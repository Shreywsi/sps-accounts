from rest_framework import viewsets

from apps.fees.models import FeeStructureItem
from apps.fees.permissions import IsOperatorOrAdmin
from apps.fees.serializers import FeeStructureItemSerializer


class FeeStructureItemViewSet(viewsets.ModelViewSet):
    queryset = (
        FeeStructureItem.objects
        .select_related(
            "fee_structure",
            "fee_category",
        )
    )
    serializer_class = FeeStructureItemSerializer
    permission_classes = [IsOperatorOrAdmin]
    filterset_fields = [
        "fee_structure",
        "fee_category",
    ]