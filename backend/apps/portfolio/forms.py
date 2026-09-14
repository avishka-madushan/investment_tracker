from django import forms
from .models import CashAccount

class CashEntryForm(forms.ModelForm):
    class Meta:
        model = CashAccount
        fields = ['entry_type', 'amount', 'date', 'description']
        widgets = {
            'entry_type': forms.Select(attrs={'class': 'form-select'}),
            'amount': forms.NumberInput(attrs={'class': 'form-control', 'step': '0.01'}),
            'date': forms.DateInput(attrs={'class': 'form-control', 'type': 'date'}),
            'description': forms.Textarea(attrs={'class': 'form-control', 'rows': 2}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Only allow Deposit and Withdrawal in this form
        self.fields['entry_type'].choices = [
            ('DEPOSIT', 'Deposit'),
            ('WITHDRAWAL', 'Withdrawal'),
        ]
