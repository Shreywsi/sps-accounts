from rest_framework import viewsets

from apps.fees.models import FeeStructure
from apps.fees.permissions import IsAdminOrReadOnly
from apps.fees.serializers import FeeStructureSerializer


class FeeStructureViewSet(viewsets.ModelViewSet):
    queryset = (
    FeeStructure.objects
    .select_related(
        "school_class",
        "academic_session",
    )
)
    serializer_class = FeeStructureSerializer
    permission_classes = [IsAdminOrReadOnly]
    filterset_fields = [
        "school_class",
        "academic_session",
    ]