from decimal import Decimal
from django.db.models import Sum
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import Transaction
from .serializers import TransactionSerializer
from .services import execute_buy, execute_sell, InsufficientCashError, InsufficientHoldingError
from apps.stocks.models import Stock
from apps.portfolio.models import CashAccount

class TradeOrderAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        stock_id = request.data.get('stock_id')
        trans_type = request.data.get('transaction_type')
        quantity = request.data.get('quantity')
        price = request.data.get('price')
        date = request.data.get('date')
        notes = request.data.get('notes', '')

        if not all([stock_id, trans_type, quantity, price, date]):
            return Response({'error': 'Missing required fields.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            stock = Stock.objects.get(id=stock_id)
        except Stock.DoesNotExist:
            return Response({'error': 'Stock not found.'}, status=status.HTTP_404_NOT_FOUND)

        try:
            if trans_type == 'BUY':
                execute_buy(request.user, stock, quantity, price, date, notes)
                message = f"Successfully bought {quantity} of {stock.symbol}"
            elif trans_type == 'SELL':
                execute_sell(request.user, stock, quantity, price, date, notes)
                message = f"Successfully sold {quantity} of {stock.symbol}"
            else:
                return Response({'error': 'Invalid transaction type.'}, status=status.HTTP_400_BAD_REQUEST)

            return Response({'message': message}, status=status.HTTP_201_CREATED)
        except (InsufficientCashError, InsufficientHoldingError) as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class TransactionHistoryAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        transactions_list = Transaction.objects.filter(user=request.user).select_related('stock')

        symbol_query = request.query_params.get('symbol')
        if symbol_query:
            transactions_list = transactions_list.filter(stock__symbol__icontains=symbol_query)

        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 20))
        start = (page - 1) * page_size
        end = start + page_size

        total_count = transactions_list.count()
        items = transactions_list[start:end]
        serializer = TransactionSerializer(items, many=True)

        return Response({
            'results': serializer.data,
            'total_count': total_count,
            'page': page,
            'page_size': page_size,
            'total_pages': (total_count + page_size - 1) // page_size if total_count > 0 else 1,
        })
