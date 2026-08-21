from decimal import Decimal

from django.db.models import Count, Sum
from django.utils import timezone
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.fees.models import Payment, StudentFee
from apps.transactions.models import Transaction
from datetime import timedelta


class DashboardAPIView(APIView):

    def get(self, request):
        total_students = StudentFee.objects.values(
            "student"
        ).distinct().count()

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
                "PENDING",
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
            "total_students": total_students,
            "total_assigned": total_assigned,
            "total_collected": total_collected,
            "total_due": total_due,
            "pending_students": pending_students,
            "recent_payments": recent_payments,
            "week_received": total_for(week_start, "INCOME"),
            "week_spent": total_for(week_start, "EXPENSE"),
            "month_received": total_for(month_start, "INCOME"),
            "month_spent": total_for(month_start, "EXPENSE"),
        })