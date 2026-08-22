from rest_framework import viewsets

from apps.fees.models import StudentFee
from apps.fees.permissions import IsOperatorOrAdmin
from apps.fees.serializers import StudentFeeSerializer
from apps.notifications.utils import notify_admins


class StudentFeeViewSet(viewsets.ModelViewSet):
    queryset = (
        StudentFee.objects
        .select_related(
            "student",
            "fee_structure",
        )
    )
    serializer_class = StudentFeeSerializer
    permission_classes = [IsOperatorOrAdmin]
    filterset_fields = [
        "student",
        "fee_structure",
    ]

    def perform_create(self, serializer):
        assignment = serializer.save()
        notify_admins(
            actor=self.request.user,
            category="FEES",
            title="Fee assigned to student",
            message=(
                f"{self.request.user.username} assigned "
                f"'{assignment.fee_structure.name}' to {assignment.student}."
            ),
            link=f"/fees/structure",
        )