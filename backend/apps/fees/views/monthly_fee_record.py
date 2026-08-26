from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from django_filters.rest_framework import DjangoFilterBackend

from apps.fees.models.monthly_fee_record import MonthlyFeeRecord
from apps.fees.serializers.monthly_fee_record import MonthlyFeeRecordSerializer
from apps.students.models import Student
from apps.students.permissions import IsAdminOrOperator, IsAdminRole


class MonthlyFeeRecordViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Read-only: rows here only ever change through SimplePayment approval
    or a PaymentAdjustment, never a direct edit. `generate` is the one
    write path, and it only creates missing rows - it never overwrites one
    that already has payment history.
    """

    queryset = MonthlyFeeRecord.objects.select_related("student").prefetch_related("payments")
    serializer_class = MonthlyFeeRecordSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["student", "year", "month", "status"]

    def get_permissions(self):
        if self.action == "generate":
            return [IsAdminRole()]
        return [IsAdminOrOperator()]

    @action(detail=False, methods=["post"])
    def generate(self, request):
        """Create the 12 monthly ledger rows for a student for a given
        academic year. Safe to call repeatedly - existing months are left
        untouched (see MonthlyFeeRecord.generate_for_student)."""
        student_id = request.data.get("student")
        year = request.data.get("year")

        if not student_id or not year:
            raise ValidationError({"detail": "student and year are required"})

        try:
            student = Student.objects.get(pk=student_id)
        except Student.DoesNotExist:
            raise ValidationError({"student": "No such student"})

        created_months = []
        for month in range(1, 13):
            record, created = MonthlyFeeRecord.generate_for_student(student, int(year), month)
            if created:
                created_months.append(month)

        return Response(
            {
                "message": f"Generated {len(created_months)} new ledger row(s)",
                "created_months": created_months,
            }
        )