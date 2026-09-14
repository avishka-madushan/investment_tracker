from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.contrib.auth import login, logout
from django.contrib import messages
from django.db.models import Sum, F
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal


from apps.portfolio.models import Holding, ClosedInvestment, CashAccount, PortfolioSnapshot

from .forms import UserProfileForm
from django.contrib.auth import update_session_auth_hash
from django.contrib.auth.forms import PasswordChangeForm, SetPasswordForm

@login_required
def profile_view(request):
    form = UserProfileForm(instance=request.user)
    
    # Use SetPasswordForm if user has no usable password (Google-only signup)
    if request.user.has_usable_password():
        password_form = PasswordChangeForm(request.user)
    else:
        password_form = SetPasswordForm(request.user)
    
    if request.method == 'POST':
        if 'update_profile' in request.POST:
            form = UserProfileForm(request.POST, instance=request.user)
            if form.is_valid():
                form.save()
                messages.success(request, 'Your profile has been updated successfully.')
                return redirect('dashboard:profile')
        elif 'change_password' in request.POST:
            if request.user.has_usable_password():
                password_form = PasswordChangeForm(request.user, request.POST)
            else:
                password_form = SetPasswordForm(request.user, request.POST)
            if password_form.is_valid():
                user = password_form.save()
                update_session_auth_hash(request, user)
                messages.success(request, 'Your password has been changed successfully.')
                return redirect('dashboard:profile')
        
    return render(request, 'dashboard/profile.html', {
        'form': form,
        'password_form': password_form,
    })

@login_required
def delete_account_view(request):
    if request.method == 'POST':
        user = request.user
        logout(request)
        user.delete()
        messages.success(request, 'Your account has been permanently deleted.')
        return redirect('account_login')
    return redirect('dashboard:profile')

@login_required
def dashboard_view(request):
    user = request.user
    today = timezone.now().date()
    
    cash_balance = CashAccount.objects.filter(user=user).aggregate(Sum('amount'))['amount__sum'] or 0
    
    holdings = Holding.objects.filter(user=user).select_related('stock')
    holdings_data = []
    total_market_value = 0
    total_unrealized_pnl = 0
    
    for h in holdings:
        latest_price_obj = h.stock.prices.order_by('-date').first()
        latest_price = Decimal(str(latest_price_obj.close)) if latest_price_obj and latest_price_obj.close else h.avg_price
        
        current_value = h.quantity * latest_price
        unrealized_pnl = current_value - (h.quantity * h.avg_price)
        unrealized_pnl_percent = (unrealized_pnl / (h.quantity * h.avg_price)) * 100 if (h.avg_price and h.quantity) else 0
        
        total_market_value += current_value
        total_unrealized_pnl += unrealized_pnl
        
        holdings_data.append({
            'symbol': h.stock.symbol,
            'company': h.stock.company,
            'sector': h.stock.sector,
            'quantity': h.quantity,
            'avg_price': h.avg_price,
            'latest_price': latest_price,
            'current_value': current_value,
            'unrealized_pnl': unrealized_pnl,
            'unrealized_pnl_percent': unrealized_pnl_percent
        })
        
    total_portfolio_value = total_market_value
    
    closed_investments = ClosedInvestment.objects.filter(user=user)
    total_realized_pnl = closed_investments.aggregate(Sum('profit_loss'))['profit_loss__sum'] or 0
    
    net_pnl = total_realized_pnl + total_unrealized_pnl
    
    winning_trades = closed_investments.filter(profit_loss__gt=0).count()
    total_trades = closed_investments.count()
    win_rate = (winning_trades / total_trades * 100) if total_trades > 0 else 0
    
    best_stock = closed_investments.filter(profit_loss__gt=0).order_by('-profit_loss_percent').first()
    worst_stock = closed_investments.filter(profit_loss__lt=0).order_by('profit_loss_percent').first()
    
    thirty_days_ago = today - timedelta(days=30)
    snapshots = PortfolioSnapshot.objects.filter(user=user, date__gte=thirty_days_ago).order_by('date')
    chart_dates = [s.date.strftime('%b %d') for s in snapshots]
    chart_values = [float(s.total_value) for s in snapshots]
    
    context = {
        'total_portfolio_value': total_portfolio_value,
        'total_realized_pnl': total_realized_pnl,
        'total_unrealized_pnl': total_unrealized_pnl,
        'net_pnl': net_pnl,
        'cash_balance': cash_balance,
        'win_rate': win_rate,
        'holdings': holdings_data,
        'best_stock': best_stock,
        'worst_stock': worst_stock,
        'chart_dates': chart_dates,
        'chart_values': chart_values,
    }
    
    return render(request, 'dashboard/index.html', context)
