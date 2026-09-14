from rest_framework import serializers
from .models import Transaction
from apps.stocks.serializers import StockSerializer

class TransactionSerializer(serializers.ModelSerializer):
    stock = StockSerializer(read_only=True)
    stock_id = serializers.IntegerField(write_only=True)
    total_value = serializers.DecimalField(max_digits=16, decimal_places=4, read_only=True)

    class Meta:
        model = Transaction
        fields = ['id', 'user', 'stock', 'stock_id', 'transaction_type', 'quantity', 'price', 'total_value', 'date', 'notes', 'created_at']
