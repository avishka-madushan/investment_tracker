from django import forms
from django.contrib.auth.models import User
from django.contrib.auth.forms import UserCreationForm

class CustomSignupForm(forms.Form):
    first_name = forms.CharField(max_length=30, label='First Name', required=False, widget=forms.TextInput(attrs={'class': 'form-input', 'placeholder': 'First Name'}))
    last_name = forms.CharField(max_length=30, label='Last Name', required=False, widget=forms.TextInput(attrs={'class': 'form-input', 'placeholder': 'Last Name'}))

    def signup(self, request, user):
        if self.cleaned_data.get('first_name'):
            user.first_name = self.cleaned_data['first_name']
        if self.cleaned_data.get('last_name'):
            user.last_name = self.cleaned_data['last_name']
        user.save()
        return user


class UserProfileForm(forms.ModelForm):
    first_name = forms.CharField(max_length=30, required=False, widget=forms.TextInput(attrs={'class': 'form-control glass-input'}))
    last_name = forms.CharField(max_length=30, required=False, widget=forms.TextInput(attrs={'class': 'form-control glass-input'}))

    class Meta:
        model = User
        fields = ['first_name', 'last_name']
