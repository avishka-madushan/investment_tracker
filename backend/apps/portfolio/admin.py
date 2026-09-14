from django.contrib import admin
from .models import Holding, ClosedInvestment, CashAccount, PortfolioSnapshot


@admin.register(Holding)
class HoldingAdmin(admin.ModelAdmin):
    list_display = ('user', 'stock', 'quantity', 'avg_price', 'last_updated')
    search_fields = ('stock__symbol', 'user__username')
    raw_id_fields = ('stock', 'user')


@admin.register(ClosedInvestment)
class ClosedInvestmentAdmin(admin.ModelAdmin):
    list_display = ('user', 'stock', 'quantity', 'buy_price', 'sell_price',
                    'profit_loss', 'profit_loss_percent', 'sell_date')
    list_filter = ('sell_date',)
    search_fields = ('stock__symbol', 'user__username')
    raw_id_fields = ('stock', 'user')


@admin.register(CashAccount)
class CashAccountAdmin(admin.ModelAdmin):
    list_display = ('user', 'entry_type', 'amount', 'date', 'description')
    list_filter = ('entry_type', 'date')
    search_fields = ('user__username',)
    raw_id_fields = ('user',)


@admin.register(PortfolioSnapshot)
class PortfolioSnapshotAdmin(admin.ModelAdmin):
    list_display = ('user', 'date', 'total_value', 'cash_balance',
                    'invested_value', 'total_profit_loss')
    list_filter = ('date',)
    raw_id_fields = ('user',)
