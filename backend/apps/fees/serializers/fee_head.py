from rest_framework import serializers
from apps.fees.models.fee_head import FeeHead


class FeeHeadSerializer(serializers.ModelSerializer):
    class Meta:
        model = FeeHead
        fields = [
            "id",
            "group",
            "label",
            "frequency",
            "amount",
            "annual_equivalent",
            "is_mandatory",
            "display_order",
            "editable_by",
            "notes",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["annual_equivalent", "created_at", "updated_at"]

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Amount must be greater than 0")
        return value
