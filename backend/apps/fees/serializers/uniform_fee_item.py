from rest_framework import serializers
from apps.fees.models.uniform_fee_item import UniformFeeItem
from apps.fees.serializers.fee_session import FeeSessionSerializer


class UniformFeeItemSerializer(serializers.ModelSerializer):
    session_details = FeeSessionSerializer(source="session", read_only=True)

    class Meta:
        model = UniformFeeItem
        fields = [
            "id",
            "session",
            "session_details",
            "gender",
            "item_name",
            "price",
            "display_order",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]

    def validate_price(self, value):
        if value <= 0:
            raise serializers.ValidationError("Price must be greater than 0")
        return value
