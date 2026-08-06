from rest_framework import serializers

from apps.academics.models import SchoolClass


class SchoolClassSerializer(serializers.ModelSerializer):
    section_count = serializers.IntegerField(
        source="sections.count",
        read_only=True,
    )

    class Meta:
        model = SchoolClass
        fields = [
            "id",
            "name",
            "display_order",
            "is_active",
            "created_at",
            "section_count",
        ]