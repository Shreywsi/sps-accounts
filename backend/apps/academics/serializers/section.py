from rest_framework import serializers

from apps.academics.models import Section


class SectionSerializer(serializers.ModelSerializer):
    school_class_name = serializers.CharField(
        source="school_class.name",
        read_only=True,
    )

    class Meta:
        model = Section
        fields = [
            "id",
            "name",
            "is_active",
            "school_class",
            "school_class_name",
        ]