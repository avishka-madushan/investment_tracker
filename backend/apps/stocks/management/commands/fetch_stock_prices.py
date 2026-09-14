"""
Django management command: Fetch historical price data from TradingView WebSocket
and populate the stock_price table with OHLCV + SMA indicators.

Usage:
    python manage.py fetch_stock_prices
    python manage.py fetch_stock_prices --incremental --days 7
    python manage.py fetch_stock_prices --threads 4
    python manage.py fetch_stock_prices --force-refresh AAPL GOOG
    python manage.py fetch_stock_prices --enable-split-detection
"""
import json
import time
import random
import logging
import sys
from datetime import datetime, timezone, timedelta
from concurrent.futures import ThreadPoolExecutor, as_completed

import pandas as pd
import numpy as np
from django.conf import settings
from django.core.management.base import BaseCommand
from django.db import connection as django_connection

from apps.stocks.models import Stock, StockPrice

try:
    from websocket import create_connection, WebSocketTimeoutException
except ImportError:
    create_connection = None
    WebSocketTimeoutException = Exception

logger = logging.getLogger(__name__)

# ---------- Configuration ----------
SOCKET_URL = getattr(settings, 'TRADINGVIEW_WS_URL',
                     'wss://data.tradingview.com/socket.io/websocket')
WEBSOCKET_TIMEOUT = 10
FETCH_TIMEOUT = 6
MAX_CANDLES = 5000
RETRY_LIMIT = 2
BATCH_SIZE = 1000
MIN_DELAY = 0.05
MAX_DELAY = 0.15

# Split detection
SPLIT_DETECTION_THRESHOLD = 0.5
SPLIT_DETECTION_DAYS = 5
MIN_VOLUME_RATIO = 0.1


def _ws_send(ws, method, params):
    """Send formatted message to TradingView WebSocket."""
    msg = json.dumps({"m": method, "p": params})
    ws.send(f"~m~{len(msg)}~m~{msg}")


def _validate_candle(candle):
    """Return (is_valid, is_suspicious) for a candle dict."""
    try:
        required = ('date', 'open', 'high', 'low', 'close', 'volume')
        if not all(k in candle for k in required):
            return False, False
        if candle['volume'] < 0:
            return False, False
        if all(candle[k] == 0 for k in ('open', 'high', 'low', 'close')):
            return False, False

        suspicious = False
        if candle['open'] == 0 or candle['close'] == 0:
            suspicious = True
        if all(candle[k] > 0 for k in ('open', 'high', 'low', 'close')):
            if candle['high'] < max(candle['open'], candle['close']):
                suspicious = True
            if candle['low'] > min(candle['open'], candle['close']):
                suspicious = True
        return True, suspicious
    except (KeyError, TypeError):
        return False, False


def _parse_ws_response(data):
    """Parse WebSocket frames and extract candle dicts."""
    if not data.startswith("~m~"):
        return None
    parts = data.split("~m~")
    candles = []
    for part in parts:
        if not part or part.isdigit():
            continue
        try:
            payload = json.loads(part)
        except json.JSONDecodeError:
            continue
        if payload.get("m") == "timescale_update":
            series_data = payload["p"][1]
            for series in series_data.values():
                if "s" in series:
                    for item in series["s"]:
                        v = item["v"]
                        candle = {
                            "date": datetime.fromtimestamp(v[0], tz=timezone.utc).date(),
                            "open": v[1],
                            "high": v[2],
                            "low": v[3],
                            "close": v[4],
                            "volume": v[5] if len(v) > 5 else 0,
                        }
                        is_valid, _ = _validate_candle(candle)
                        if is_valid:
                            candles.append(candle)
    return candles or None


def _fetch_tradingview_data(symbol):
    """Fetch historical daily candles for a single symbol."""
    if create_connection is None:
        logger.error("websocket-client is not installed")
        return None

    for attempt in range(1, RETRY_LIMIT + 1):
        time.sleep(random.uniform(MIN_DELAY, MAX_DELAY))
        ws = None
        try:
            ws = create_connection(SOCKET_URL, timeout=WEBSOCKET_TIMEOUT)
            session_id = f"cs_{int(time.time() * 1000)}_{symbol.replace('.', '')}"

            _ws_send(ws, "chart_create_session", [session_id, ""])
            _ws_send(ws, "resolve_symbol", [
                session_id, "sds_sym_1",
                f'={{"adjustment":"splits","symbol":"CSELK:{symbol}"}}'
            ])
            _ws_send(ws, "create_series", [
                session_id, "sds_1", "s1", "sds_sym_1", "1D", MAX_CANDLES, ""
            ])

            start = time.time()
            candles = []
            while time.time() - start < FETCH_TIMEOUT:
                try:
                    res = ws.recv()
                except WebSocketTimeoutException:
                    break
                parsed = _parse_ws_response(res)
                if parsed:
                    candles.extend(parsed)
                if "series_completed" in res:
                    break

            if candles:
                df = (pd.DataFrame(candles)
                      .drop_duplicates(subset="date")
                      .sort_values("date"))
                return df

            if attempt < RETRY_LIMIT:
                logger.warning(f"[{symbol}] No data on attempt {attempt}, retrying…")
        except Exception as e:
            if attempt < RETRY_LIMIT:
                logger.error(f"[{symbol}] Attempt {attempt}/{RETRY_LIMIT}: {e}")
                time.sleep(random.uniform(1, 2))
        finally:
            if ws:
                try:
                    ws.close()
                except Exception:
                    pass

    logger.error(f"[{symbol}] Failed after {RETRY_LIMIT} attempts")
    return None


def _calculate_sma(df):
    """Calculate SMA 4, 9, 50 on the close column."""
    if df.empty:
        return df
    df = df.copy()
    df['sma_4'] = df['close'].rolling(window=4).mean()
    df['sma_9'] = df['close'].rolling(window=9).mean()
    df['sma_50'] = df['close'].rolling(window=50).mean()
    return df


def _process_single_stock(stock_id, symbol, enable_split_detection=False):
    """Fetch data for one stock and insert only new records."""
    # Each thread needs its own DB connection in Django
    from django.db import connection as _conn
    _conn.ensure_connection()

    try:
        df = _fetch_tradingview_data(symbol)
        if df is None or df.empty:
            logger.info(f"No data fetched for {symbol}")
            return {'symbol': symbol, 'status': 'skipped', 'rows': 0}

        df = _calculate_sma(df)

        # Find existing dates for this stock
        existing_dates = set(
            StockPrice.objects
            .filter(stock_id=stock_id, date__in=df['date'].tolist())
            .values_list('date', flat=True)
        )

        new_rows = df[~df['date'].isin(existing_dates)]
        if new_rows.empty:
            logger.info(f"No new data for {symbol}")
            return {'symbol': symbol, 'status': 'success', 'rows': 0}

        # Bulk create
        records = []
        for _, row in new_rows.iterrows():
            records.append(StockPrice(
                stock_id=stock_id,
                date=row['date'],
                open=float(row['open']),
                high=float(row['high']),
                low=float(row['low']),
                close=float(row['close']),
                volume=int(row['volume']),
                sma_4=float(row['sma_4']) if pd.notna(row.get('sma_4')) else None,
                sma_9=float(row['sma_9']) if pd.notna(row.get('sma_9')) else None,
                sma_50=float(row['sma_50']) if pd.notna(row.get('sma_50')) else None,
            ))

        # Insert in batches
        for i in range(0, len(records), BATCH_SIZE):
            StockPrice.objects.bulk_create(records[i:i + BATCH_SIZE], ignore_conflicts=True)

        logger.info(f"Stored {len(records)} new records for {symbol}")
        return {'symbol': symbol, 'status': 'success', 'rows': len(records)}

    except Exception as e:
        logger.error(f"Error processing {symbol}: {e}", exc_info=True)
        return {'symbol': symbol, 'status': 'error', 'error': str(e)}
    finally:
        _conn.close()


class Command(BaseCommand):
    help = 'Fetch historical stock prices from TradingView and store in stock_price table'

    def add_arguments(self, parser):
        parser.add_argument('--incremental', action='store_true',
                            help='Only update stocks with missing recent data')
        parser.add_argument('--days', type=int, default=7,
                            help='Days to look back for incremental mode')
        parser.add_argument('--threads', type=int, default=6,
                            help='Number of concurrent threads')
        parser.add_argument('--force-refresh', nargs='+', default=None,
                            help='Force refresh specific symbols (deletes old data first)')
        parser.add_argument('--enable-split-detection', action='store_true',
                            help='Enable corporate action / split detection')

    def handle(self, *args, **options):
        max_threads = options['threads']
        incremental = options['incremental']
        days_back = options['days']
        force_refresh = options.get('force_refresh')
        enable_split = options['enable_split_detection']

        stocks = list(
            Stock.objects.filter(symbol__isnull=False)
            .values_list('id', 'symbol')
        )

        # Force refresh specific symbols
        if force_refresh:
            force_set = {s.strip().upper() for s in force_refresh}
            for stock_id, symbol in stocks:
                if symbol.strip().upper() in force_set:
                    deleted, _ = StockPrice.objects.filter(stock_id=stock_id).delete()
                    self.stdout.write(f"Force-refreshed {symbol}: deleted {deleted} rows")

        # Incremental mode
        if incremental:
            cutoff = datetime.now().date() - timedelta(days=days_back)
            filtered = []
            for stock_id, symbol in stocks:
                latest = (StockPrice.objects
                          .filter(stock_id=stock_id)
                          .order_by('-date')
                          .values_list('date', flat=True)
                          .first())
                if latest is None or latest < cutoff:
                    filtered.append((stock_id, symbol))
            stocks = filtered
            self.stdout.write(f"Incremental mode: {len(stocks)} stocks need updates")

        total = len(stocks)
        self.stdout.write(f"Processing {total} stocks with {max_threads} threads")

        results = {'success': 0, 'skipped': 0, 'error': 0, 'total_rows': 0}
        failed = []
        start_time = time.time()

        with ThreadPoolExecutor(max_workers=max_threads) as executor:
            futures = {
                executor.submit(
                    _process_single_stock,
                    sid, sym.strip(), enable_split
                ): sym
                for sid, sym in stocks if sym
            }

            completed = 0
            for future in as_completed(futures):
                completed += 1
                result = future.result()
                status = result.get('status', 'error')

                if status == 'success':
                    results['success'] += 1
                    results['total_rows'] += result.get('rows', 0)
                elif status == 'skipped':
                    results['skipped'] += 1
                else:
                    results['error'] += 1
                    failed.append(result)

                if completed % 10 == 0:
                    elapsed = time.time() - start_time
                    rate = completed / elapsed if elapsed > 0 else 0
                    eta = (total - completed) / rate if rate > 0 else 0
                    self.stdout.write(
                        f"Progress: {completed}/{total} "
                        f"({completed / total * 100:.1f}%) | "
                        f"Rate: {rate:.1f}/s | ETA: {eta:.0f}s"
                    )

        elapsed = time.time() - start_time
        self.stdout.write("\n" + "=" * 60)
        self.stdout.write(self.style.SUCCESS("SUMMARY"))
        self.stdout.write(f"  Time:        {elapsed:.1f}s ({elapsed / 60:.1f} min)")
        self.stdout.write(f"  Successful:  {results['success']}")
        self.stdout.write(f"  Skipped:     {results['skipped']}")
        self.stdout.write(f"  Failed:      {results['error']}")
        self.stdout.write(f"  New records: {results['total_rows']}")

        if failed:
            self.stdout.write(self.style.ERROR("\nFailed stocks:"))
            for f in failed:
                self.stdout.write(f"  {f['symbol']}: {f.get('error', 'Unknown')}")

        self.stdout.write("=" * 60)
