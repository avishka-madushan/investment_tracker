from decimal import Decimal
from django.db.models import Sum, Avg, Count
from django.db.models.functions import TruncMonth, TruncYear
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from apps.portfolio.models import ClosedInvestment
from apps.stocks.models import Stock
from apps.transactions.models import Transaction
from apps.transactions.serializers import TransactionSerializer

class AnalyticsOverviewAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        closed_investments = ClosedInvestment.objects.filter(user=user)

        monthly_pnl = closed_investments.annotate(month=TruncMonth('sell_date')).values('month').annotate(total_pnl=Sum('profit_loss')).order_by('month')
        months = [m['month'].strftime('%b %Y') for m in monthly_pnl if m['month']]
        pnl_values = [float(m['total_pnl']) for m in monthly_pnl if m['month']]

        yearly_pnl = closed_investments.annotate(year=TruncYear('sell_date')).values('year').annotate(
            total_pnl=Sum('profit_loss'),
            total_trades=Count('id'),
        ).order_by('-year')

        yearly_data = []
        for y in yearly_pnl:
            if not y['year']:
                continue
            year_date = y['year'].year
            trades_in_year = closed_investments.filter(sell_date__year=year_date)
            winning = trades_in_year.filter(profit_loss__gt=0).count()
            total = y['total_trades']
            win_rate = (winning / total * 100) if total > 0 else 0

            yearly_data.append({
                'year': year_date,
                'total_trades': total,
                'realized_pnl': float(y['total_pnl']),
                'win_rate': float(win_rate),
            })

        top_5_stocks = list(closed_investments.values('stock__symbol').annotate(total_pnl=Sum('profit_loss')).filter(total_pnl__gt=0).order_by('-total_pnl')[:5])
        for item in top_5_stocks:
            item['total_pnl'] = float(item['total_pnl'])

        worst_5_stocks = list(closed_investments.values('stock__symbol').annotate(total_pnl=Sum('profit_loss')).filter(total_pnl__lt=0).order_by('total_pnl')[:5])
        for item in worst_5_stocks:
            item['total_pnl'] = float(item['total_pnl'])

        avg_holding_days = closed_investments.aggregate(Avg('holding_days'))['holding_days__avg'] or 0

        best_trade_obj = closed_investments.filter(profit_loss__gt=0).order_by('-profit_loss').first()
        worst_trade_obj = closed_investments.filter(profit_loss__lt=0).order_by('profit_loss').first()

        def format_trade(t):
            if not t: return None
            return {
                'symbol': t.stock.symbol,
                'profit_loss': float(t.profit_loss),
                'profit_loss_percent': float(t.profit_loss_percent),
                'buy_date': t.buy_date.strftime('%Y-%m-%d'),
                'sell_date': t.sell_date.strftime('%Y-%m-%d'),
            }

        return Response({
            'months': months,
            'pnl_values': pnl_values,
            'yearly_data': yearly_data,
            'top_5_stocks': top_5_stocks,
            'worst_5_stocks': worst_5_stocks,
            'avg_holding_days': float(avg_holding_days),
            'best_trade': format_trade(best_trade_obj),
            'worst_trade': format_trade(worst_trade_obj),
        })

class StockAnalysisAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        stock_id = request.query_params.get('stock_id')

        if not stock_id:
            return Response({'error': 'stock_id query parameter is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            stock = Stock.objects.get(id=stock_id)
        except Stock.DoesNotExist:
            return Response({'error': 'Stock not found.'}, status=status.HTTP_404_NOT_FOUND)

        closed_investments = ClosedInvestment.objects.filter(user=user, stock=stock)

        total_trades = closed_investments.count()
        total_realized_pnl = closed_investments.aggregate(Sum('profit_loss'))['profit_loss__sum'] or Decimal('0')
        avg_holding_days = closed_investments.aggregate(Avg('holding_days'))['holding_days__avg'] or 0

        winning_trades = closed_investments.filter(profit_loss__gt=0).count()
        win_rate = (winning_trades / total_trades * 100) if total_trades > 0 else 0

        price_history = list(stock.prices.order_by('-date')[:90])
        price_history = list(reversed(price_history))

        chart_dates = []
        chart_close = []
        chart_sma4 = []
        chart_sma9 = []
        chart_sma50 = []

        for p in price_history:
            chart_dates.append(p.date.strftime('%Y-%m-%d'))
            chart_close.append(p.close)
            chart_sma4.append(p.sma_4)
            chart_sma9.append(p.sma_9)
            chart_sma50.append(p.sma_50)

        transactions = Transaction.objects.filter(user=user, stock=stock).order_by('-date')
        tx_serializer = TransactionSerializer(transactions, many=True)

        return Response({
            'selected_stock': {
                'id': stock.id,
                'symbol': stock.symbol,
                'company': stock.company,
                'sector': stock.sector,
            },
            'total_trades': total_trades,
            'total_realized_pnl': float(total_realized_pnl),
            'avg_holding_days': float(avg_holding_days),
            'win_rate': float(win_rate),
            'transactions': tx_serializer.data,
            'chart_dates': chart_dates,
            'chart_close': chart_close,
            'chart_sma4': chart_sma4,
            'chart_sma9': chart_sma9,
            'chart_sma50': chart_sma50,
        })
