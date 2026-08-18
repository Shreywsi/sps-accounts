from rest_framework import viewsets

from apps.students.models import CustomFieldDefinition
from apps.students.serializers.custom_field import CustomFieldDefinitionSerializer


class CustomFieldDefinitionViewSet(viewsets.ModelViewSet):
    queryset = CustomFieldDefinition.objects.all()
    serializer_class = CustomFieldDefinitionSerializer
    filterset_fields = ["is_active"]