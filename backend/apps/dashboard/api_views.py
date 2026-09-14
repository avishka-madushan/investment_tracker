from decimal import Decimal
from datetime import timedelta
from django.utils import timezone
from django.db.models import Sum
from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken

from .serializers import UserSerializer, RegisterSerializer
from apps.portfolio.models import Holding, ClosedInvestment, CashAccount, PortfolioSnapshot

class RegisterAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            refresh = RefreshToken.for_user(user)
            return Response({
                'user': UserSerializer(user).data,
                'access': str(refresh.access_token),
                'refresh': str(refresh),
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

import requests
class GoogleAuthAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        token = request.data.get('credential') or request.data.get('access_token')
        if not token:
            return Response({'error': 'Google token is required.'}, status=status.HTTP_400_BAD_REQUEST)

        # Verify Google Token via Google tokeninfo API
        res = requests.get(f'https://oauth2.googleapis.com/tokeninfo?id_token={token}')
        if res.status_code != 200:
            # Fallback check as access_token if id_token failed
            res = requests.get(f'https://www.googleapis.com/oauth2/v3/userinfo?access_token={token}')
            if res.status_code != 200:
                return Response({'error': 'Invalid Google token.'}, status=status.HTTP_400_BAD_REQUEST)

        payload = res.json()
        email = payload.get('email')
        if not email:
            return Response({'error': 'Email not provided by Google.'}, status=status.HTTP_400_BAD_REQUEST)

        first_name = payload.get('given_name') or payload.get('name', '').split(' ')[0] or ''
        last_name = payload.get('family_name') or ''

        user, created = User.objects.get_or_create(username=email, defaults={
            'email': email,
            'first_name': first_name,
            'last_name': last_name,
        })

        if created:
            user.set_unusable_password()
            user.save()

        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        })


class DashboardSummaryAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        today = timezone.now().date()

        cash_balance = CashAccount.objects.filter(user=user).aggregate(Sum('amount'))['amount__sum'] or Decimal('0')

        holdings = Holding.objects.filter(user=user).select_related('stock')
        holdings_data = []
        total_market_value = Decimal('0')
        total_unrealized_pnl = Decimal('0')

        for h in holdings:
            latest_price_obj = h.stock.prices.order_by('-date').first()
            latest_price = Decimal(str(latest_price_obj.close)) if latest_price_obj and latest_price_obj.close else h.avg_price

            current_value = h.quantity * latest_price
            unrealized_pnl = current_value - (h.quantity * h.avg_price)
            unrealized_pnl_percent = (unrealized_pnl / (h.quantity * h.avg_price)) * Decimal('100') if (h.avg_price and h.quantity) else Decimal('0')

            total_market_value += current_value
            total_unrealized_pnl += unrealized_pnl

            holdings_data.append({
                'symbol': h.stock.symbol,
                'company': h.stock.company,
                'sector': h.stock.sector,
                'quantity': float(h.quantity),
                'avg_price': float(h.avg_price),
                'latest_price': float(latest_price),
                'current_value': float(current_value),
                'unrealized_pnl': float(unrealized_pnl),
                'unrealized_pnl_percent': float(unrealized_pnl_percent)
            })

        total_portfolio_value = total_market_value

        closed_investments = ClosedInvestment.objects.filter(user=user)
        total_realized_pnl = closed_investments.aggregate(Sum('profit_loss'))['profit_loss__sum'] or Decimal('0')

        net_pnl = total_realized_pnl + total_unrealized_pnl

        winning_trades = closed_investments.filter(profit_loss__gt=0).count()
        total_trades = closed_investments.count()
        win_rate = (winning_trades / total_trades * 100) if total_trades > 0 else 0

        best_stock_obj = closed_investments.filter(profit_loss__gt=0).order_by('-profit_loss_percent').first()
        worst_stock_obj = closed_investments.filter(profit_loss__lt=0).order_by('profit_loss_percent').first()

        best_stock = {
            'symbol': best_stock_obj.stock.symbol,
            'profit_loss': float(best_stock_obj.profit_loss),
            'profit_loss_percent': float(best_stock_obj.profit_loss_percent),
        } if best_stock_obj else None

        worst_stock = {
            'symbol': worst_stock_obj.stock.symbol,
            'profit_loss': float(worst_stock_obj.profit_loss),
            'profit_loss_percent': float(worst_stock_obj.profit_loss_percent),
        } if worst_stock_obj else None

        thirty_days_ago = today - timedelta(days=30)
        snapshots = PortfolioSnapshot.objects.filter(user=user, date__gte=thirty_days_ago).order_by('date')
        chart_dates = [s.date.strftime('%b %d') for s in snapshots]
        chart_values = [float(s.total_value) for s in snapshots]

        return Response({
            'total_portfolio_value': float(total_portfolio_value),
            'total_realized_pnl': float(total_realized_pnl),
            'total_unrealized_pnl': float(total_unrealized_pnl),
            'net_pnl': float(net_pnl),
            'cash_balance': float(cash_balance),
            'win_rate': float(win_rate),
            'holdings': holdings_data,
            'best_stock': best_stock,
            'worst_stock': worst_stock,
            'chart_dates': chart_dates,
            'chart_values': chart_values,
        })

class ProfileAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

    def put(self, request):
        user = request.user
        serializer = UserSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ChangePasswordAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        old_password = request.data.get('old_password')
        new_password = request.data.get('new_password')

        if user.has_usable_password():
            if not old_password or not user.check_password(old_password):
                return Response({'error': 'Current password is incorrect.'}, status=status.HTTP_400_BAD_REQUEST)

        if not new_password or len(new_password) < 8:
            return Response({'error': 'New password must be at least 8 characters long.'}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save()
        return Response({'message': 'Password changed successfully.'})

class DeleteAccountAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request):
        user = request.user
        user.delete()
        return Response({'message': 'Account deleted successfully.'})
