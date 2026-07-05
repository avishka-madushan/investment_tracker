import logging
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.db.models import Sum
from decimal import Decimal

from apps.portfolio.models import Holding, CashAccount, PortfolioSnapshot

logger = logging.getLogger(__name__)
User = get_user_model()


def take_daily_snapshot():
    """
    Computes and saves a PortfolioSnapshot for every user with active holdings or cash.
    Can be run manually via: python manage.py shell -c "from apps.portfolio.tasks import take_daily_snapshot; take_daily_snapshot()"
    """
    users = User.objects.all()
    today = timezone.now().date()
    
    snapshots_created = 0
    
    for user in users:
        # 1. Cash Balance
        cash_balance = CashAccount.objects.filter(user=user).aggregate(
            balance=Sum('amount')
        )['balance'] or 0
        
        # 2. Holdings (Market Value & Invested Value)
        holdings = Holding.objects.filter(user=user).select_related('stock')
        
        invested_value = 0
        market_value = 0
        
        for h in holdings:
            invested_value += (h.quantity * h.avg_price)
            
            latest_price_obj = h.stock.prices.order_by('-date').first()
            latest_price = Decimal(str(latest_price_obj.close)) if latest_price_obj and latest_price_obj.close else h.avg_price
            
            market_value += (h.quantity * latest_price)
            
        total_value = market_value
        
        # Total deposits - total withdrawals to calculate absolute total P/L
        deposits = CashAccount.objects.filter(user=user, entry_type='DEPOSIT').aggregate(Sum('amount'))['amount__sum'] or 0
        withdrawals = CashAccount.objects.filter(user=user, entry_type='WITHDRAWAL').aggregate(Sum('amount'))['amount__sum'] or 0
        net_deposits = deposits + withdrawals # withdrawals are negative
        
        # We must include the cash balance to correctly calculate net profit/loss
        total_profit_loss = (market_value + cash_balance) - net_deposits
        
        if total_value > 0 or net_deposits != 0:
            PortfolioSnapshot.objects.update_or_create(
                user=user,
                date=today,
                defaults={
                    'total_value': total_value,
                    'cash_balance': cash_balance,
                    'invested_value': invested_value,
                    'total_profit_loss': total_profit_loss,
                }
            )
            snapshots_created += 1
            
    logger.info(f"Daily snapshot completed. Created/updated for {snapshots_created} users.")
