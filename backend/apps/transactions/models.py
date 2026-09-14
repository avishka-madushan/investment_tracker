from django.conf import settings
from django.db import models


class Transaction(models.Model):
    """Record of every BUY and SELL trade."""

    TYPE_CHOICES = [
        ('BUY', 'Buy'),
        ('SELL', 'Sell'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='transactions',
    )
    stock = models.ForeignKey(
        'stocks.Stock',
        on_delete=models.CASCADE,
        related_name='transactions',
    )
    transaction_type = models.CharField(max_length=4, choices=TYPE_CHOICES)
    quantity = models.DecimalField(max_digits=12, decimal_places=4)
    price = models.DecimalField(max_digits=12, decimal_places=4)
    date = models.DateField()
    notes = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'transactions'
        ordering = ['-date', '-created_at']

    def __str__(self):
        return f"{self.transaction_type} {self.quantity} × {self.stock.symbol} @ {self.price}"

    @property
    def total_value(self):
        return self.quantity * self.price
