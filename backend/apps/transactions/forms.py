from django import forms
from apps.stocks.models import Stock


class TransactionForm(forms.Form):
    """Form for adding BUY / SELL transactions."""
    stock = forms.ModelChoiceField(
        queryset=Stock.objects.all().order_by('symbol'),
        label='Stock',
        empty_label='— Select stock —',
        widget=forms.Select(attrs={'class': 'form-select', 'id': 'id_stock'}),
    )
    transaction_type = forms.ChoiceField(
        choices=[('BUY', 'Buy'), ('SELL', 'Sell')],
        widget=forms.RadioSelect(attrs={'class': 'form-check-input'}),
        initial='BUY',
    )
    quantity = forms.IntegerField(
        min_value=1,
        widget=forms.NumberInput(attrs={
            'class': 'form-control',
            'step': '1',
            'placeholder': 'Quantity',
            'id': 'id_quantity',
        }),
    )
    price = forms.DecimalField(
        label='Average Price',
        max_digits=12,
        decimal_places=4,
        min_value=0.0001,
        widget=forms.NumberInput(attrs={
            'class': 'form-control',
            'step': '0.0001',
            'placeholder': 'Average Price per share',
            'id': 'id_price',
        }),
    )
    date = forms.DateField(
        widget=forms.DateInput(attrs={
            'class': 'form-control',
            'type': 'date',
            'id': 'id_date',
        }),
    )
    notes = forms.CharField(
        required=False,
        widget=forms.Textarea(attrs={
            'class': 'form-control',
            'rows': 2,
            'placeholder': 'Optional notes…',
            'id': 'id_notes',
        }),
    )
