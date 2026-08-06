from decimal import Decimal

from django.db.models import Count, Sum
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.fees.models import Payment, StudentFee


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
        })