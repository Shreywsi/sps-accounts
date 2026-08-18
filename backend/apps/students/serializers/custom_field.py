from rest_framework import serializers

from apps.students.models import CustomFieldDefinition


class CustomFieldDefinitionSerializer(serializers.ModelSerializer):

    class Meta:
        model = CustomFieldDefinition
        fields = [
            "id",
            "name",
            "field_type",
            "is_active",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]