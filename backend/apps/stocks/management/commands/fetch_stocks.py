"""
Django management command: Fetch stock symbols from TradingView Scanner API
and populate the stocks table.

Usage:
    python manage.py fetch_stocks
"""
import requests
from django.core.management.base import BaseCommand
from apps.stocks.models import Stock


class Command(BaseCommand):
    help = 'Fetch stock symbols from TradingView (Sri Lanka) and populate the stocks table'

    def handle(self, *args, **options):
        self.stdout.write("Fetching stocks from TradingView Scanner API...")

        url = "https://scanner.tradingview.com/srilanka/scan?label-product=screener-stock"
        payload = {
            "columns": ["name", "description", "sector"],
            "markets": ["srilanka"],
            "range": [0, 1000],
            "sort": {"sortBy": "name", "sortOrder": "asc"},
            "options": {"lang": "en"},
        }
        headers = {
            "Content-Type": "text/plain;charset=UTF-8",
            "User-Agent": "Mozilla/5.0",
        }

        try:
            response = requests.post(url, json=payload, headers=headers, timeout=30)
            response.raise_for_status()
            data = response.json().get("data", [])
        except requests.RequestException as e:
            self.stderr.write(self.style.ERROR(f"API request failed: {e}"))
            return

        self.stdout.write(f"Fetched {len(data)} stocks from API")

        existing_symbols = set(
            Stock.objects.values_list('symbol', flat=True)
        )
        self.stdout.write(f"Found {len(existing_symbols)} existing stocks in DB")

        new_count = 0
        for item in data:
            d = item.get("d", [])
            if len(d) < 2:
                continue

            symbol = d[0]
            company = d[1]
            sector = d[2] if len(d) > 2 and d[2] is not None else ""

            if symbol not in existing_symbols:
                Stock.objects.create(
                    symbol=symbol,
                    company=company,
                    sector=sector,
                )
                existing_symbols.add(symbol)
                new_count += 1

        if new_count:
            self.stdout.write(self.style.SUCCESS(f"Added {new_count} new stocks"))
        else:
            self.stdout.write(self.style.SUCCESS("Database is up to date — no new stocks"))
