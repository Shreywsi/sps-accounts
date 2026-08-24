from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum
from django.utils import timezone
from datetime import timedelta, datetime
from decimal import Decimal
from django.db.models import Q

from apps.fees.models.simple_payment import SimplePayment
from apps.fees.models import Payment, StudentFee
from apps.expenses.models.expense import Expense
from apps.transactions.models import Transaction
from apps.students.models import Student
from apps.students.permissions import IsAdminOrOperator


class FinancialDashboardAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Check if user is admin or operator
        if request.user.role not in ["ADMIN", "OPERATOR"]:
            return Response(
                {"error": "Only admins and operators can view financial dashboard"},
                status=403
            )

        # Get time filter from query params
        time_filter = request.query_params.get('time_filter', 'month')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')

        # Calculate date range
        today = timezone.now().date()
        
        if start_date and end_date:
            # Custom date range
            start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
            end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
        else:
            # Predefined time filters
            if time_filter == 'today':
                start_date = today
                end_date = today
            elif time_filter == 'week':
                start_date = today - timedelta(days=7)
                end_date = today
            elif time_filter == 'month':
                start_date = today.replace(day=1)
                end_date = today
            elif time_filter == 'year':
                start_date = today.replace(month=1, day=1)
                end_date = today
            else:
                start_date = today.replace(day=1)
                end_date = today

        # Calculate income from approved payments
        income_queryset = SimplePayment.objects.filter(
            status="APPROVED",
            payment_date__gte=start_date,
            payment_date__lte=end_date
        )
        
        monthly_income = income_queryset.aggregate(total=Sum('amount'))['total'] or Decimal("0.00")

        # Calculate expenses this period
        expenses_queryset = Expense.objects.filter(
            expense_date__gte=start_date,
            expense_date__lte=end_date
        )
        
        monthly_expenses = expenses_queryset.aggregate(total=Sum('amount'))['total'] or Decimal("0.00")

        # Calculate net income
        net_income = monthly_income - monthly_expenses

        # Get pending payments (only for admin to review)
        pending_payments = 0
        rejected_payments = 0
        if request.user.role == "ADMIN":
            pending_payments = SimplePayment.objects.filter(status="PENDING").count()
            rejected_payments = SimplePayment.objects.filter(status="REJECTED").count()

        # Get payment breakdown by type
        payment_breakdown = income_queryset.values('payment_type').annotate(
            total=Sum('amount')
        ).order_by('-total')

        # Student counts — total_students is EVERY student record
        total_students = Student.objects.filter(
            is_active=True
        ).count()

        # Calculate fee statistics from the old dashboard logic
        total_assigned = (
            StudentFee.objects.aggregate(
                total=Sum("total_amount")
            )["total"]
            or Decimal("0.00")
        )

        total_collected = (
            Payment.objects.filter(
                status="SUCCESS"
            ).aggregate(
                total=Sum("amount")
            )["total"]
            or Decimal("0.00")
        )

        total_due = total_assigned - total_collected

        today = timezone.now().date()
        week_start = today - timedelta(days=today.weekday())
        month_start = today.replace(day=1)
        approved_transactions = Transaction.objects.filter(
            status=Transaction.Status.APPROVED
        )

        def total_for(start, transaction_type):
            return (
                approved_transactions.filter(
                    transaction_date__gte=start,
                    transaction_type=transaction_type,
                ).aggregate(total=Sum("total_amount"))["total"]
                or Decimal("0.00")
            )

        pending_students = StudentFee.objects.filter(
            status__in=[
                "PARTIAL",
            ]
        ).count()

        recent_payments = (
            Payment.objects.select_related(
                "student_fee__student"
            )
            .order_by("-payment_datetime")[:5]
            .values(
                "receipt_number",
                "amount",
                "payment_datetime",
                "student_fee__student__first_name",
                "student_fee__student__admission_no",
            )
        )

        return Response({
            "monthly_income": float(monthly_income),
            "monthly_expenses": float(monthly_expenses),
            "net_income": float(net_income),
            "pending_payments": pending_payments,
            "rejected_payments": rejected_payments,
            "payment_breakdown": [
                {
                    "payment_type": item["payment_type"],
                    "total": float(item["total"])
                }
                for item in payment_breakdown
            ],
            "time_filter": time_filter,
            "start_date": start_date.strftime("%Y-%m-%d"),
            "end_date": end_date.strftime("%Y-%m-%d"),
            "user_role": request.user.role,
            "total_students": total_students,
            "total_assigned": float(total_assigned),
            "total_collected": float(total_collected),
            "total_due": float(total_due),
            "pending_students": pending_students,
            "recent_payments": list(recent_payments),
            "week_received": float(total_for(week_start, "INCOME")),
            "week_spent": float(total_for(week_start, "EXPENSE")),
            "month_received": float(total_for(month_start, "INCOME")),
            "month_spent": float(total_for(month_start, "EXPENSE")),
        })