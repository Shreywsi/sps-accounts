from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal

from apps.fees.models.simple_payment import SimplePayment
from apps.expenses.models.expense import Expense
from apps.students.permissions import IsAdminRole


class FinancialDashboardAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Check if user is admin
        if request.user.role != "ADMIN":
            return Response(
                {"error": "Only admins can view financial dashboard"},
                status=403
            )

        # Get current month's data
        today = timezone.now().date()
        current_month_start = today.replace(day=1)
        
        # Calculate income from approved payments this month
        monthly_income = SimplePayment.objects.filter(
            status="APPROVED",
            payment_date__gte=current_month_start,
            payment_date__lte=today
        ).aggregate(total=Sum('amount'))['total'] or Decimal("0.00")

        # Calculate expenses this month
        monthly_expenses = Expense.objects.filter(
            expense_date__gte=current_month_start,
            expense_date__lte=today
        ).aggregate(total=Sum('amount'))['total'] or Decimal("0.00")

        # Calculate net income
        net_income = monthly_income - monthly_expenses

        # Get pending payments
        pending_payments = SimplePayment.objects.filter(status="PENDING").count()

        # Get rejected payments
        rejected_payments = SimplePayment.objects.filter(status="REJECTED").count()

        return Response({
            "monthly_income": float(monthly_income),
            "monthly_expenses": float(monthly_expenses),
            "net_income": float(net_income),
            "pending_payments": pending_payments,
            "rejected_payments": rejected_payments,
            "current_month": current_month_start.strftime("%B %Y"),
        })