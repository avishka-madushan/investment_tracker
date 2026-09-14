from django.contrib import admin
from .models import Stock, StockPrice


@admin.register(Stock)
class StockAdmin(admin.ModelAdmin):
    list_display = ('symbol', 'company', 'sector')
    search_fields = ('symbol', 'company')
    list_filter = ('sector',)


@admin.register(StockPrice)
class StockPriceAdmin(admin.ModelAdmin):
    list_display = ('stock', 'date', 'open', 'high', 'low', 'close', 'volume')
    list_filter = ('date',)
    search_fields = ('stock__symbol',)
    raw_id_fields = ('stock',)
