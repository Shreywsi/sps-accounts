from rest_framework import viewsets

from apps.academics.models import SchoolClass
from apps.academics.serializers import SchoolClassSerializer
from apps.academics.permissions import IsAdminOrReadOnly


class SchoolClassViewSet(viewsets.ModelViewSet):
    queryset = SchoolClass.objects.all().order_by("display_order")
    serializer_class = SchoolClassSerializer
    permission_classes = [IsAdminOrReadOnly]