from rest_framework import viewsets

from apps.fees.models import FeeCategory
from apps.fees.serializers import FeeCategorySerializer
from apps.fees.permissions import IsOperatorOrAdmin


class FeeCategoryViewSet(viewsets.ModelViewSet):
    queryset = FeeCategory.objects.all()
    serializer_class = FeeCategorySerializer
    permission_classes = [IsOperatorOrAdmin]