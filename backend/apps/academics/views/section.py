from rest_framework import viewsets

from apps.academics.models import Section
from apps.academics.serializers import SectionSerializer
from apps.academics.permissions import IsAdminOrReadOnly


class SectionViewSet(viewsets.ModelViewSet):
    queryset = Section.objects.all()
    serializer_class = SectionSerializer
    permission_classes = [IsAdminOrReadOnly]
    filterset_fields = ["school_class"]