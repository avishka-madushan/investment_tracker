from rest_framework import serializers
from .models import Holding, ClosedInvestment, CashAccount, PortfolioSnapshot
from apps.stocks.serializers import StockSerializer

class HoldingSerializer(serializers.ModelSerializer):
    stock = StockSerializer(read_only=True)

    class Meta:
        model = Holding
        fields = ['id', 'user', 'stock', 'quantity', 'avg_price', 'last_updated']

class ClosedInvestmentSerializer(serializers.ModelSerializer):
    stock = StockSerializer(read_only=True)

    class Meta:
        model = ClosedInvestment
        fields = [
            'id', 'user', 'stock', 'quantity', 'buy_price', 'sell_price',
            'profit_loss', 'profit_loss_percent', 'buy_date', 'sell_date',
            'holding_days', 'created_at'
        ]

class CashAccountSerializer(serializers.ModelSerializer):
    entry_type_display = serializers.CharField(source='get_entry_type_display', read_only=True)

    class Meta:
        model = CashAccount
        fields = ['id', 'user', 'entry_type', 'entry_type_display', 'amount', 'date', 'description', 'created_at']

class PortfolioSnapshotSerializer(serializers.ModelSerializer):
    class Meta:
        model = PortfolioSnapshot
        fields = ['id', 'user', 'date', 'total_value', 'cash_balance', 'invested_value', 'total_profit_loss']
