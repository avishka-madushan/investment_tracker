from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from apps.dashboard.api_views import (
    RegisterAPIView, GoogleAuthAPIView, DashboardSummaryAPIView, ProfileAPIView,
    ChangePasswordAPIView, DeleteAccountAPIView
)
from apps.stocks.api_views import StockListView
from apps.portfolio.api_views import (
    HoldingsAPIView, ClosedInvestmentsAPIView, CashAccountAPIView
)
from apps.transactions.api_views import (
    TradeOrderAPIView, TransactionHistoryAPIView
)
from apps.analytics.api_views import (
    AnalyticsOverviewAPIView, StockAnalysisAPIView
)

urlpatterns = [
    # Auth
    path('auth/register/', RegisterAPIView.as_view(), name='api_register'),
    path('auth/login/', TokenObtainPairView.as_view(), name='api_login'),
    path('auth/google/', GoogleAuthAPIView.as_view(), name='api_google'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='api_refresh'),
    path('auth/profile/', ProfileAPIView.as_view(), name='api_profile'),

    path('auth/change-password/', ChangePasswordAPIView.as_view(), name='api_change_password'),
    path('auth/delete-account/', DeleteAccountAPIView.as_view(), name='api_delete_account'),

    # Dashboard
    path('dashboard/', DashboardSummaryAPIView.as_view(), name='api_dashboard'),

    # Stocks
    path('stocks/', StockListView.as_view(), name='api_stocks'),

    # Portfolio
    path('portfolio/holdings/', HoldingsAPIView.as_view(), name='api_holdings'),
    path('portfolio/closed/', ClosedInvestmentsAPIView.as_view(), name='api_closed'),
    path('portfolio/cash/', CashAccountAPIView.as_view(), name='api_cash'),

    # Transactions
    path('transactions/trade/', TradeOrderAPIView.as_view(), name='api_trade'),
    path('transactions/history/', TransactionHistoryAPIView.as_view(), name='api_history'),

    # Analytics
    path('analytics/overview/', AnalyticsOverviewAPIView.as_view(), name='api_analytics_overview'),
    path('analytics/stock/', StockAnalysisAPIView.as_view(), name='api_stock_analysis'),
]
