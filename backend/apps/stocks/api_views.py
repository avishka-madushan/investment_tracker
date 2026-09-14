from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from .models import Stock
from .serializers import StockSerializer

class StockListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = StockSerializer
    queryset = Stock.objects.all().order_by('symbol')
