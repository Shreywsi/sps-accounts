from rest_framework import viewsets

from apps.fees.models import StudentFee
from apps.fees.permissions import IsAdminOrReadOnly
from apps.fees.serializers import StudentFeeSerializer


class StudentFeeViewSet(viewsets.ModelViewSet):
    queryset = (
    StudentFee.objects
    .select_related(
        "student",
        "fee_structure",
    )
)
    serializer_class = StudentFeeSerializer
    permission_classes = [IsAdminOrReadOnly]
    filterset_fields = [
        "student",
        "fee_structure",
    ]