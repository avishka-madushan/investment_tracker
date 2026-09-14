from django.urls import path
from . import views

app_name = 'portfolio'

urlpatterns = [
    path('holdings/', views.holdings_view, name='holdings'),
    path('closed/', views.closed_investments_view, name='closed'),
    path('cash/', views.cash_account_view, name='cash'),
]
