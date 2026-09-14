"""
Django management command: Daily Update
Runs all daily data-fetching tasks in sequence:
  1. Fetch new stock symbols from TradingView
  2. Fetch latest stock prices (incremental mode)
  3. Take daily portfolio snapshot for all users

Usage:
    python manage.py daily_update
    python manage.py daily_update --full   (fetch ALL historical data, not just recent)
"""
import logging
from django.core.management.base import BaseCommand
from django.core.management import call_command

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Run all daily update tasks: fetch stocks, fetch prices, take snapshot'

    def add_arguments(self, parser):
        parser.add_argument(
            '--full', action='store_true',
            help='Fetch full historical data instead of incremental update',
        )

    def handle(self, *args, **options):
        full_mode = options['full']

        # Step 1: Fetch any new stock symbols
        self.stdout.write(self.style.NOTICE('=' * 60))
        self.stdout.write(self.style.NOTICE('STEP 1: Fetching stock symbols...'))
        self.stdout.write(self.style.NOTICE('=' * 60))
        try:
            call_command('fetch_stocks')
            self.stdout.write(self.style.SUCCESS('Stock symbols updated.\n'))
        except Exception as e:
            self.stderr.write(self.style.ERROR(f'fetch_stocks failed: {e}\n'))

        # Step 2: Fetch stock prices
        self.stdout.write(self.style.NOTICE('=' * 60))
        self.stdout.write(self.style.NOTICE('STEP 2: Fetching stock prices...'))
        self.stdout.write(self.style.NOTICE('=' * 60))
        try:
            if full_mode:
                call_command('fetch_stock_prices', threads=6)
            else:
                call_command('fetch_stock_prices', threads=6, incremental=True, days=7)
            self.stdout.write(self.style.SUCCESS('Stock prices updated.\n'))
        except Exception as e:
            self.stderr.write(self.style.ERROR(f'fetch_stock_prices failed: {e}\n'))

        # Step 3: Take daily portfolio snapshot
        self.stdout.write(self.style.NOTICE('=' * 60))
        self.stdout.write(self.style.NOTICE('STEP 3: Taking daily portfolio snapshot...'))
        self.stdout.write(self.style.NOTICE('=' * 60))
        try:
            from apps.portfolio.tasks import take_daily_snapshot
            take_daily_snapshot()
            self.stdout.write(self.style.SUCCESS('Daily snapshot completed.\n'))
        except Exception as e:
            self.stderr.write(self.style.ERROR(f'Daily snapshot failed: {e}\n'))

        self.stdout.write(self.style.SUCCESS('=' * 60))
        self.stdout.write(self.style.SUCCESS('DAILY UPDATE COMPLETE'))
        self.stdout.write(self.style.SUCCESS('=' * 60))
