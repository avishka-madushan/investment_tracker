from django.conf import settings
from django.db import models


class Holding(models.Model):
    """Current open position — cached from transactions."""
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='holdings',
    )
    stock = models.ForeignKey(
        'stocks.Stock',
        on_delete=models.CASCADE,
        related_name='holdings',
    )
    quantity = models.DecimalField(max_digits=12, decimal_places=4)
    avg_price = models.DecimalField(max_digits=12, decimal_places=4)
    last_updated = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'holdings'
        unique_together = ('user', 'stock')

    def __str__(self):
        return f"{self.user.username} holds {self.quantity} × {self.stock.symbol}"


class ClosedInvestment(models.Model):
    """Record of a fully or partially sold position."""
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='closed_investments',
    )
    stock = models.ForeignKey(
        'stocks.Stock',
        on_delete=models.CASCADE,
        related_name='closed_investments',
    )
    quantity = models.DecimalField(max_digits=12, decimal_places=4)
    buy_price = models.DecimalField(max_digits=12, decimal_places=4)
    sell_price = models.DecimalField(max_digits=12, decimal_places=4)
    profit_loss = models.DecimalField(max_digits=12, decimal_places=4)
    profit_loss_percent = models.DecimalField(max_digits=12, decimal_places=4)
    buy_date = models.DateField()
    sell_date = models.DateField()
    holding_days = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'closed_investments'
        ordering = ['-sell_date', '-created_at']

    def __str__(self):
        sign = '+' if self.profit_loss >= 0 else ''
        return f"{self.stock.symbol} {sign}{self.profit_loss} ({self.profit_loss_percent}%)"


class CashAccount(models.Model):
    """Ledger entry for all cash movements."""
    ENTRY_TYPES = [
        ('DEPOSIT', 'Deposit'),
        ('WITHDRAWAL', 'Withdrawal'),
        ('BUY_DEBIT', 'Buy Debit'),
        ('SELL_CREDIT', 'Sell Credit'),
        ('DIVIDEND', 'Dividend'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='cash_entries',
    )
    entry_type = models.CharField(max_length=12, choices=ENTRY_TYPES)
    amount = models.DecimalField(max_digits=14, decimal_places=4)
    date = models.DateField()
    description = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'cash_account'
        ordering = ['-date', '-created_at']

    def __str__(self):
        return f"{self.entry_type} {self.amount} on {self.date}"


class PortfolioSnapshot(models.Model):
    """Daily snapshot of portfolio value for charting."""
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='portfolio_snapshots',
    )
    date = models.DateField()
    total_value = models.DecimalField(max_digits=14, decimal_places=4)
    cash_balance = models.DecimalField(max_digits=14, decimal_places=4)
    invested_value = models.DecimalField(max_digits=14, decimal_places=4)
    total_profit_loss = models.DecimalField(max_digits=14, decimal_places=4)

    class Meta:
        db_table = 'portfolio_snapshot'
        unique_together = ('user', 'date')
        ordering = ['-date']

    def __str__(self):
        return f"{self.user.username} snapshot {self.date}: {self.total_value}"
