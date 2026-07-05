from django.shortcuts import render, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.db.models import Sum, Avg, Count
from django.db.models.functions import TruncMonth, TruncYear

from apps.portfolio.models import ClosedInvestment
from apps.stocks.models import Stock
from apps.transactions.models import Transaction


@login_required
def chart_view(request, stock_id):
    stock = get_object_or_404(Stock, id=stock_id)
    return render(request, 'analytics/chart.html', {'symbol': stock.symbol})

@login_required
def analytics_view(request):
    user = request.user
    closed_investments = ClosedInvestment.objects.filter(user=user)
    
    # Monthly P/L
    monthly_pnl = closed_investments.annotate(month=TruncMonth('sell_date')).values('month').annotate(total_pnl=Sum('profit_loss')).order_by('month')
    months = [m['month'].strftime('%b %Y') for m in monthly_pnl if m['month']]
    pnl_values = [float(m['total_pnl']) for m in monthly_pnl if m['month']]
    
    # Yearly P/L
    yearly_pnl = closed_investments.annotate(year=TruncYear('sell_date')).values('year').annotate(
        total_pnl=Sum('profit_loss'),
        total_trades=Count('id'),
    ).order_by('-year')
    
    # Needs a raw python loop for win rate per year since we can't easily filter within annotation in older Django without extra steps
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
            'realized_pnl': y['total_pnl'],
            'win_rate': win_rate,
        })
        
    # Top 5 most profitable
    top_5_stocks = closed_investments.values('stock__symbol').annotate(total_pnl=Sum('profit_loss')).order_by('-total_pnl')[:5]
    
    # Top 5 worst
    worst_5_stocks = closed_investments.values('stock__symbol').annotate(total_pnl=Sum('profit_loss')).order_by('total_pnl')[:5]
    
    avg_holding_days = closed_investments.aggregate(Avg('holding_days'))['holding_days__avg'] or 0
    
    best_trade = closed_investments.order_by('-profit_loss').first()
    worst_trade = closed_investments.order_by('profit_loss').first()
    
    context = {
        'months': months,
        'pnl_values': pnl_values,
        'yearly_data': yearly_data,
        'top_5_stocks': top_5_stocks,
        'worst_5_stocks': worst_5_stocks,
        'avg_holding_days': avg_holding_days,
        'best_trade': best_trade,
        'worst_trade': worst_trade,
        'stocks': Stock.objects.all().order_by('symbol'),
    }
    return render(request, 'analytics/index.html', context)

@login_required
def stock_analysis_view(request):
    user = request.user
    stock_id = request.GET.get('stock_id')
    
    if not stock_id:
        return render(request, 'analytics/stock_analysis.html', {'stocks': Stock.objects.all().order_by('symbol')})
        
    try:
        stock = Stock.objects.get(id=stock_id)
    except Stock.DoesNotExist:
        return render(request, 'analytics/stock_analysis.html', {'stocks': Stock.objects.all().order_by('symbol')})
        
    closed_investments = ClosedInvestment.objects.filter(user=user, stock=stock)
    
    total_trades = closed_investments.count()
    total_realized_pnl = closed_investments.aggregate(Sum('profit_loss'))['profit_loss__sum'] or 0
    avg_holding_days = closed_investments.aggregate(Avg('holding_days'))['holding_days__avg'] or 0
    
    winning_trades = closed_investments.filter(profit_loss__gt=0).count()
    win_rate = (winning_trades / total_trades * 100) if total_trades > 0 else 0
    
    # Price history for chart (last 90 days)
    price_history = stock.prices.order_by('-date')[:90]
    price_history = reversed(price_history) # chronologically for chart
    
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
    
    context = {
        'stocks': Stock.objects.all().order_by('symbol'),
        'selected_stock': stock,
        'total_trades': total_trades,
        'total_realized_pnl': total_realized_pnl,
        'avg_holding_days': avg_holding_days,
        'win_rate': win_rate,
        'transactions': transactions,
        'chart_dates': chart_dates,
        'chart_close': chart_close,
        'chart_sma4': chart_sma4,
        'chart_sma9': chart_sma9,
        'chart_sma50': chart_sma50,
    }
    return render(request, 'analytics/stock_analysis.html', context)
