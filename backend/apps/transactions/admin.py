from django.contrib import admin
from .models import Transaction


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ('user', 'stock', 'transaction_type', 'quantity', 'price', 'date')
    list_filter = ('transaction_type', 'date')
    search_fields = ('stock__symbol', 'user__username')
    raw_id_fields = ('stock', 'user')
