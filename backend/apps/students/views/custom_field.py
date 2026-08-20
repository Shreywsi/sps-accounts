from rest_framework import viewsets

from apps.students.models import CustomFieldDefinition
from apps.students.permissions import IsAdminOrCreateOnly
from apps.students.serializers.custom_field import CustomFieldDefinitionSerializer


class CustomFieldDefinitionViewSet(viewsets.ModelViewSet):
    queryset = CustomFieldDefinition.objects.all()
    serializer_class = CustomFieldDefinitionSerializer
    permission_classes = [IsAdminOrCreateOnly]
    filterset_fields = ["is_active"]