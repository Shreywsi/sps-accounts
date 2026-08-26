from rest_framework import serializers
from apps.fees.models.fee_category_group import FeeCategoryGroup
from apps.fees.serializers.fee_session import FeeSessionSerializer


class FeeCategoryGroupSerializer(serializers.ModelSerializer):
    session_details = FeeSessionSerializer(source="session", read_only=True)
    fee_heads_count = serializers.SerializerMethodField()

    class Meta:
        model = FeeCategoryGroup
        fields = [
            "id",
            "session",
            "session_details",
            "name",
            "boarding_type",
            "applicable_class_range",
            "display_order",
            "fee_heads_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]

    def get_fee_heads_count(self, obj):
        return obj.fee_heads.filter(is_active=True).count()
