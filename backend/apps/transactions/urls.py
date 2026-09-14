from django.urls import path
from . import views

app_name = 'transactions'

urlpatterns = [
    path('add/', views.add_transaction, name='add'),
    path('history/', views.transaction_history, name='history'),
]
