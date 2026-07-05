from django.db import models


class Stock(models.Model):
    """Stock instrument — symbol, company name, and sector."""
    symbol = models.CharField(max_length=255)
    company = models.CharField(max_length=255)
    sector = models.CharField(max_length=255, blank=True, default='')

    class Meta:
        db_table = 'stocks'
        managed = True

    def __str__(self):
        return f"{self.symbol} — {self.company}"


class StockPrice(models.Model):
    """Daily OHLCV price data with moving averages."""
    stock = models.ForeignKey(
        Stock,
        on_delete=models.CASCADE,
        related_name='prices',
    )
    date = models.DateField()
    open = models.FloatField(null=True, blank=True)
    high = models.FloatField(null=True, blank=True)
    low = models.FloatField(null=True, blank=True)
    close = models.FloatField(null=True, blank=True)
    volume = models.BigIntegerField(null=True, blank=True, default=0)
    sma_4 = models.FloatField(null=True, blank=True)
    sma_9 = models.FloatField(null=True, blank=True)
    sma_50 = models.FloatField(null=True, blank=True)

    class Meta:
        db_table = 'stock_price'
        managed = True
        unique_together = ('stock', 'date')
        ordering = ['-date']

    def __str__(self):
        return f"{self.stock.symbol} {self.date} close={self.close}"
