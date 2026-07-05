from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.core.paginator import Paginator

from .forms import TransactionForm
from .models import Transaction
from .services import execute_buy, execute_sell, InsufficientCashError, InsufficientHoldingError

@login_required
def add_transaction(request):
    if request.method == 'POST':
        form = TransactionForm(request.POST)
        if form.is_valid():
            stock = form.cleaned_data['stock']
            trans_type = form.cleaned_data['transaction_type']
            quantity = form.cleaned_data['quantity']
            price = form.cleaned_data['price']
            date = form.cleaned_data['date']
            notes = form.cleaned_data['notes']
            
            try:
                if trans_type == 'BUY':
                    execute_buy(request.user, stock, quantity, price, date, notes)
                    messages.success(request, f"Successfully bought {quantity} of {stock.symbol}")
                else:
                    execute_sell(request.user, stock, quantity, price, date, notes)
                    messages.success(request, f"Successfully sold {quantity} of {stock.symbol}")
                return redirect('portfolio:holdings')
            except (InsufficientCashError, InsufficientHoldingError) as e:
                form.add_error(None, str(e))
    else:
        form = TransactionForm()
        
    return render(request, 'transactions/add.html', {'form': form})

@login_required
def transaction_history(request):
    transactions_list = Transaction.objects.filter(user=request.user).select_related('stock')
    
    symbol_query = request.GET.get('symbol')
    if symbol_query:
        transactions_list = transactions_list.filter(stock__symbol__icontains=symbol_query)
        
    paginator = Paginator(transactions_list, 20)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    
    return render(request, 'transactions/history.html', {'page_obj': page_obj, 'symbol_query': symbol_query})
