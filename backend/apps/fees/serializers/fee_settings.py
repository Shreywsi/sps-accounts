from rest_framework import serializers

from apps.fees.models.fee_settings import FeeSettings


class FeeSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = FeeSettings
        fields = ["id", "fee_due_day", "late_fee_per_day", "updated_at"]
        read_only_fields = ["id", "updated_at"]

    def validate_fee_due_day(self, value):
        if value < 1 or value > 31:
            raise serializers.ValidationError(
                "Fee due day must be between 1 and 31."
            )
        return value

    def validate_late_fee_per_day(self, value):
        if value < 0:
            raise serializers.ValidationError(
                "Late fee per day cannot be negative."
            )
        return value
