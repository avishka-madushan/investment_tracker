from rest_framework import serializers
from .models import Stock, StockPrice

class StockSerializer(serializers.ModelSerializer):
    class Meta:
        model = Stock
        fields = ['id', 'symbol', 'company', 'sector']

class StockPriceSerializer(serializers.ModelSerializer):
    class Meta:
        model = StockPrice
        fields = ['id', 'stock', 'date', 'open', 'high', 'low', 'close', 'volume', 'sma_4', 'sma_9', 'sma_50']
