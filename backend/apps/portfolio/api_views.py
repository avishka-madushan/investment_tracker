from decimal import Decimal
from django.db.models import Sum
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import Holding, ClosedInvestment, CashAccount
from .serializers import ClosedInvestmentSerializer, CashAccountSerializer

class HoldingsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        holdings = Holding.objects.filter(user=request.user).select_related('stock')
        holdings_data = []
        total_current_value = Decimal('0')
        total_unrealized_pnl = Decimal('0')

        for h in holdings:
            latest_price_obj = h.stock.prices.order_by('-date').first()
            latest_price = Decimal(str(latest_price_obj.close)) if latest_price_obj and latest_price_obj.close else h.avg_price

            current_value = h.quantity * latest_price
            unrealized_pnl = current_value - (h.quantity * h.avg_price)
            unrealized_pnl_percent = (unrealized_pnl / (h.quantity * h.avg_price)) * Decimal('100') if (h.avg_price and h.quantity) else Decimal('0')

            total_current_value += current_value
            total_unrealized_pnl += unrealized_pnl

            holdings_data.append({
                'stock_id': h.stock.id,
                'symbol': h.stock.symbol,
                'company': h.stock.company,
                'sector': h.stock.sector,
                'quantity': float(h.quantity),
                'avg_price': float(h.avg_price),
                'latest_price': float(latest_price),
                'current_value': float(current_value),
                'unrealized_pnl': float(unrealized_pnl),
                'unrealized_pnl_percent': float(unrealized_pnl_percent),
                'sma_4': latest_price_obj.sma_4 if latest_price_obj else None,
                'sma_9': latest_price_obj.sma_9 if latest_price_obj else None,
                'sma_50': latest_price_obj.sma_50 if latest_price_obj else None,
            })

        return Response({
            'holdings': holdings_data,
            'total_current_value': float(total_current_value),
            'total_unrealized_pnl': float(total_unrealized_pnl),
        })

class ClosedInvestmentsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        closed_list = ClosedInvestment.objects.filter(user=request.user).select_related('stock')

        symbol_query = request.query_params.get('symbol')
        if symbol_query:
            closed_list = closed_list.filter(stock__symbol__icontains=symbol_query)

        total_trades = closed_list.count()
        winning_trades = closed_list.filter(profit_loss__gt=0).count()
        losing_trades = closed_list.filter(profit_loss__lt=0).count()
        win_rate = (winning_trades / total_trades * 100) if total_trades > 0 else 0
        total_realized_pnl = closed_list.aggregate(Sum('profit_loss'))['profit_loss__sum'] or Decimal('0')

        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 20))
        start = (page - 1) * page_size
        end = start + page_size

        total_count = closed_list.count()
        items = closed_list[start:end]
        serializer = ClosedInvestmentSerializer(items, many=True)

        return Response({
            'results': serializer.data,
            'total_count': total_count,
            'page': page,
            'page_size': page_size,
            'total_pages': (total_count + page_size - 1) // page_size if total_count > 0 else 1,
            'summary': {
                'total_trades': total_trades,
                'winning_trades': winning_trades,
                'losing_trades': losing_trades,
                'win_rate': float(win_rate),
                'total_realized_pnl': float(total_realized_pnl),
            }
        })

class CashAccountAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        cash_entries = CashAccount.objects.filter(user=request.user).order_by('-date', '-created_at')
        current_balance = cash_entries.aggregate(Sum('amount'))['amount__sum'] or Decimal('0')
        serializer = CashAccountSerializer(cash_entries, many=True)
        return Response({
            'current_balance': float(current_balance),
            'cash_entries': serializer.data
        })

    def post(self, request):
        entry_type = request.data.get('entry_type')
        amount = Decimal(str(request.data.get('amount', 0)))
        date = request.data.get('date')
        description = request.data.get('description', '')

        if entry_type not in ['DEPOSIT', 'WITHDRAWAL']:
            return Response({'error': 'Invalid entry type.'}, status=status.HTTP_400_BAD_REQUEST)

        cash_entries = CashAccount.objects.filter(user=request.user)
        current_balance = cash_entries.aggregate(Sum('amount'))['amount__sum'] or Decimal('0')

        if entry_type == 'WITHDRAWAL':
            if current_balance < amount:
                return Response({'error': 'Insufficient funds for withdrawal.'}, status=status.HTTP_400_BAD_REQUEST)
            amount = -amount

        entry = CashAccount.objects.create(
            user=request.user,
            entry_type=entry_type,
            amount=amount,
            date=date,
            description=description
        )
        serializer = CashAccountSerializer(entry)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
