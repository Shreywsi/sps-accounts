from django.db.models import Sum
from django.utils.dateparse import parse_date
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.fees.models import Payment, StudentFee


class CollectionReportAPIView(APIView):

    def get(self, request):
        start = request.GET.get("start")
        end = request.GET.get("end")

        payments = Payment.objects.filter(status="SUCCESS")

        if start:
            payments = payments.filter(payment_datetime__date__gte=parse_date(start))

        if end:
            payments = payments.filter(payment_datetime__date__lte=parse_date(end))

        total = payments.aggregate(total=Sum("amount"))["total"] or 0

        return Response({
            "total_collection": total,
            "payments": list(
                payments.values(
                    "receipt_number",
                    "amount",
                    "payment_method",
                    "payment_datetime",
                    "student_fee__student__admission_no",
                    "student_fee__student__first_name",
                )
            ),
        })


class OutstandingReportAPIView(APIView):

    def get(self, request):
        fees = StudentFee.objects.filter(balance__gt=0).select_related(
            "student", "fee_structure",
        )

        return Response({
            "students": fees.count(),
            "outstanding": list(
                fees.values(
                    "student__admission_no",
                    "student__first_name",
                    "total_amount",
                    "amount_paid",
                    "balance",
                    "status",
                )
            ),
        })


class DueFeesReportAPIView(APIView):
    """Who owes what, including any accrued late fee — sorted most overdue first."""

    def get(self, request):
        fees = (
            StudentFee.objects.filter(balance__gt=0)
            .select_related("student", "fee_structure")
        )

        results = []

        for fee in fees:
            results.append({
                "student_fee_id": fee.id,
                "admission_no": fee.student.admission_no,
                "student_name": f"{fee.student.first_name} {fee.student.last_name}".strip(),
                "fee_structure": fee.fee_structure.name,
                "due_date": fee.due_date,
                "balance": fee.balance,
                "days_overdue": fee.days_overdue,
                "late_fee_per_day": fee.late_fee_per_day,
                "late_fee_amount": fee.late_fee_amount,
                "total_payable": fee.total_payable,
                "status": fee.status,
            })

        results.sort(key=lambda r: -r["days_overdue"])

        return Response({
            "count": len(results),
            "total_outstanding": sum(r["balance"] for r in results),
            "total_late_fees": sum(r["late_fee_amount"] for r in results),
            "results": results,
        })