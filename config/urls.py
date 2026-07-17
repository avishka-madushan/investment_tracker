from django.contrib import admin
from django.urls import path, include
from django.contrib.auth import views as auth_views
from django.views.generic import RedirectView

urlpatterns = [
    path('admin/', admin.site.urls),

    # App URLs
    path('', include('apps.dashboard.urls')),
    path('transactions/', include('apps.transactions.urls')),
    path('portfolio/', include('apps.portfolio.urls')),
    path('analytics/', include('apps.analytics.urls')),

    # Authentication — allauth handles Google login + callback
    path('accounts/', include('allauth.urls')),

    # Redirect root to dashboard (which redirects to login if unauthenticated)
    path('', RedirectView.as_view(url='/dashboard/', permanent=False)),
]
