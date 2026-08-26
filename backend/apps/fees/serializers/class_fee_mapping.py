from rest_framework import serializers
from apps.fees.models.class_fee_mapping import ClassFeeMapping
from apps.fees.serializers.fee_session import FeeSessionSerializer
from apps.fees.serializers.fee_category_group import FeeCategoryGroupSerializer


class ClassFeeMappingSerializer(serializers.ModelSerializer):
    session_details = FeeSessionSerializer(source="session", read_only=True)
    day_scholar_group_details = FeeCategoryGroupSerializer(source="day_scholar_group", read_only=True)
    hostel_group_details = FeeCategoryGroupSerializer(source="hostel_group", read_only=True)

    class Meta:
        model = ClassFeeMapping
        fields = [
            "id",
            "session",
            "session_details",
            "class_name",
            "day_scholar_group",
            "day_scholar_group_details",
            "hostel_group",
            "hostel_group_details",
            "default_uniform_gender_required",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]
