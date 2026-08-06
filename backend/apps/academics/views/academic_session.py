from rest_framework import viewsets

from apps.academics.models import AcademicSession
from apps.academics.serializers import AcademicSessionSerializer
from apps.academics.permissions import IsAdminOrReadOnly


class AcademicSessionViewSet(viewsets.ModelViewSet):
    queryset = AcademicSession.objects.all().order_by("-is_active", "-start_date")
    serializer_class = AcademicSessionSerializer
    permission_classes = [IsAdminOrReadOnly]