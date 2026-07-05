"""
Core business logic for executing BUY and SELL transactions.

Both functions are wrapped in @transaction.atomic so partial failures
never corrupt data. All arithmetic uses Python Decimal.
"""
from decimal import Decimal
from django.db import transaction
from django.db.models import Sum, Min

from apps.transactions.models import Transaction
from apps.portfolio.models import Holding, ClosedInvestment, CashAccount


def get_cash_balance(user):
    """Return the user's current cash balance as Decimal."""
    result = (
        CashAccount.objects
        .filter(user=user)
        .aggregate(balance=Sum('amount'))
    )
    return result['balance'] or Decimal('0')


class InsufficientCashError(Exception):
    """Raised when user doesn't have enough cash for a BUY."""
    pass


class InsufficientHoldingError(Exception):
    """Raised when user tries to sell more shares than they hold."""
    pass


@transaction.atomic
def execute_buy(user, stock, quantity, price, date, notes=''):
    """
    Execute a BUY transaction.

    1. Check cash balance
    2. Update or create holding (weighted average price)
    3. Insert Transaction record
    4. Insert CashAccount BUY_DEBIT
    """
    quantity = Decimal(str(quantity))
    price = Decimal(str(price))
    total_cost = quantity * price

    # 1. Cash check
    cash = get_cash_balance(user)
    if cash < total_cost:
        raise InsufficientCashError(
            f"Insufficient cash. Required: {total_cost:.2f}, Available: {cash:.2f}"
        )

    # 2. Update or create holding
    try:
        holding = Holding.objects.select_for_update().get(user=user, stock=stock)
        # Weighted average price
        old_total = holding.quantity * holding.avg_price
        new_total = quantity * price
        holding.avg_price = (old_total + new_total) / (holding.quantity + quantity)
        holding.quantity += quantity
        holding.save()
    except Holding.DoesNotExist:
        holding = Holding.objects.create(
            user=user,
            stock=stock,
            quantity=quantity,
            avg_price=price,
        )

    # 3. Transaction record
    Transaction.objects.create(
        user=user,
        stock=stock,
        transaction_type='BUY',
        quantity=quantity,
        price=price,
        date=date,
        notes=notes,
    )

    # 4. Cash debit
    CashAccount.objects.create(
        user=user,
        entry_type='BUY_DEBIT',
        amount=-total_cost,
        date=date,
        description=f"BUY {quantity} × {stock.symbol} @ {price}",
    )

    return holding


@transaction.atomic
def execute_sell(user, stock, quantity, price, date, notes=''):
    """
    Execute a SELL transaction.

    1. Validate holding quantity
    2. Calculate P/L
    3. Reduce / delete holding
    4. Insert ClosedInvestment
    5. Insert Transaction record
    6. Insert CashAccount SELL_CREDIT
    """
    quantity = Decimal(str(quantity))
    price = Decimal(str(price))

    # 1. Validate holding
    try:
        holding = Holding.objects.select_for_update().get(user=user, stock=stock)
    except Holding.DoesNotExist:
        raise InsufficientHoldingError(
            f"You do not hold any shares of {stock.symbol}"
        )

    if holding.quantity < quantity:
        raise InsufficientHoldingError(
            f"Insufficient shares. Trying to sell {quantity}, but you hold {holding.quantity}"
        )

    # 2. Calculate P/L
    avg_price = holding.avg_price
    profit_loss = (price - avg_price) * quantity
    profit_loss_percent = ((price - avg_price) / avg_price) * Decimal('100') if avg_price else Decimal('0')

    # Earliest buy date for this stock
    earliest_buy = (
        Transaction.objects
        .filter(user=user, stock=stock, transaction_type='BUY')
        .aggregate(earliest=Min('date'))
    )
    buy_date = earliest_buy['earliest'] or date
    holding_days = (date - buy_date).days

    # 3. Update or delete holding
    holding.quantity -= quantity
    if holding.quantity <= 0:
        holding.delete()
    else:
        holding.save()

    # 4. Closed investment record
    ClosedInvestment.objects.create(
        user=user,
        stock=stock,
        quantity=quantity,
        buy_price=avg_price,
        sell_price=price,
        profit_loss=profit_loss,
        profit_loss_percent=profit_loss_percent,
        buy_date=buy_date,
        sell_date=date,
        holding_days=holding_days,
    )

    # 5. Transaction record
    Transaction.objects.create(
        user=user,
        stock=stock,
        transaction_type='SELL',
        quantity=quantity,
        price=price,
        date=date,
        notes=notes,
    )

    # 6. Cash credit
    total_credit = quantity * price
    CashAccount.objects.create(
        user=user,
        entry_type='SELL_CREDIT',
        amount=total_credit,
        date=date,
        description=f"SELL {quantity} × {stock.symbol} @ {price}",
    )

    return profit_loss
