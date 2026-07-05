from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.db.models import Sum
from django.core.paginator import Paginator
from decimal import Decimal

from .models import Holding, ClosedInvestment, CashAccount
from .forms import CashEntryForm

@login_required
def holdings_view(request):
    holdings = Holding.objects.filter(user=request.user).select_related('stock')
    holdings_data = []
    total_current_value = 0
    total_unrealized_pnl = 0
    
    for h in holdings:
        latest_price_obj = h.stock.prices.order_by('-date').first()
        latest_price = Decimal(str(latest_price_obj.close)) if latest_price_obj and latest_price_obj.close else h.avg_price
        
        current_value = h.quantity * latest_price
        unrealized_pnl = current_value - (h.quantity * h.avg_price)
        unrealized_pnl_percent = (unrealized_pnl / (h.quantity * h.avg_price)) * 100 if h.avg_price else 0
        
        total_current_value += current_value
        total_unrealized_pnl += unrealized_pnl
        
        holdings_data.append({
            'stock_id': h.stock.id,
            'symbol': h.stock.symbol,
            'company': h.stock.company,
            'sector': h.stock.sector,
            'quantity': h.quantity,
            'avg_price': h.avg_price,
            'latest_price': latest_price,
            'current_value': current_value,
            'unrealized_pnl': unrealized_pnl,
            'unrealized_pnl_percent': unrealized_pnl_percent,
            'sma_4': latest_price_obj.sma_4 if latest_price_obj else None,
            'sma_9': latest_price_obj.sma_9 if latest_price_obj else None,
            'sma_50': latest_price_obj.sma_50 if latest_price_obj else None,
        })
        
    context = {
        'holdings': holdings_data,
        'total_current_value': total_current_value,
        'total_unrealized_pnl': total_unrealized_pnl,
    }
    return render(request, 'portfolio/holdings.html', context)

@login_required
def closed_investments_view(request):
    closed_list = ClosedInvestment.objects.filter(user=request.user).select_related('stock')
    
    symbol_query = request.GET.get('symbol')
    if symbol_query:
        closed_list = closed_list.filter(stock__symbol__icontains=symbol_query)
        
    total_trades = closed_list.count()
    winning_trades = closed_list.filter(profit_loss__gt=0).count()
    losing_trades = closed_list.filter(profit_loss__lt=0).count()
    win_rate = (winning_trades / total_trades * 100) if total_trades > 0 else 0
    total_realized_pnl = closed_list.aggregate(Sum('profit_loss'))['profit_loss__sum'] or 0
    
    paginator = Paginator(closed_list, 20)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    
    context = {
        'page_obj': page_obj,
        'symbol_query': symbol_query,
        'total_trades': total_trades,
        'winning_trades': winning_trades,
        'losing_trades': losing_trades,
        'win_rate': win_rate,
        'total_realized_pnl': total_realized_pnl,
    }
    return render(request, 'portfolio/closed.html', context)

@login_required
def cash_account_view(request):
    cash_entries = CashAccount.objects.filter(user=request.user).order_by('-date', '-created_at')
    current_balance = cash_entries.aggregate(Sum('amount'))['amount__sum'] or 0
    
    if request.method == 'POST':
        form = CashEntryForm(request.POST)
        if form.is_valid():
            cash_entry = form.save(commit=False)
            cash_entry.user = request.user
            if cash_entry.entry_type == 'WITHDRAWAL':
                if current_balance < cash_entry.amount:
                    messages.error(request, "Insufficient funds for withdrawal.")
                    return redirect('portfolio:cash')
                cash_entry.amount = -cash_entry.amount
            cash_entry.save()
            messages.success(request, f"Successfully recorded {cash_entry.get_entry_type_display()} of {abs(cash_entry.amount)}")
            return redirect('portfolio:cash')
    else:
        form = CashEntryForm()
        
    context = {
        'cash_entries': cash_entries,
        'current_balance': current_balance,
        'form': form,
    }
    return render(request, 'portfolio/cash.html', context)
