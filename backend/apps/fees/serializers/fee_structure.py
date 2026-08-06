from rest_framework import serializers

from apps.fees.models import FeeStructure


class FeeStructureSerializer(serializers.ModelSerializer):

    school_class_name = serializers.CharField(
        source="school_class.name",
        read_only=True,
    )

    session_name = serializers.CharField(
        source="academic_session.name",
        read_only=True,
    )

    class Meta:
        model = FeeStructure
        fields = "__all__"