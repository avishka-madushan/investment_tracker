from django.contrib import admin
from django.urls import path, include
from django.contrib.auth import views as auth_views

urlpatterns = [
    path('admin/', admin.site.urls),

    # App URLs
    path('', include('apps.dashboard.urls')),
    path('transactions/', include('apps.transactions.urls')),
    path('portfolio/', include('apps.portfolio.urls')),
    path('analytics/', include('apps.analytics.urls')),

    # Authentication
    path('accounts/login/', auth_views.LoginView.as_view(), name='login'),
    path('accounts/logout/', auth_views.LogoutView.as_view(), name='logout'),
    path('accounts/', include('apps.dashboard.auth_urls')),
]
