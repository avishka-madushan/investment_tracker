from django.urls import path
from . import views

app_name = 'dashboard'

urlpatterns = [
    path('dashboard/', views.dashboard_view, name='index'),
    path('profile/', views.profile_view, name='profile'),
    path('profile/delete/', views.delete_account_view, name='delete_account'),
]
