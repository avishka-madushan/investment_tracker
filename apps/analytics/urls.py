from django.urls import path
from . import views

app_name = 'analytics'

urlpatterns = [
    path('', views.analytics_view, name='index'),
    path('stock/', views.stock_analysis_view, name='stock'),
    path('chart/<int:stock_id>/', views.chart_view, name='chart'),
]
