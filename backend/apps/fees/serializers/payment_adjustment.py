from rest_framework import serializers

from apps.fees.models.payment_adjustment import PaymentAdjustment


class PaymentAdjustmentSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source="created_by.username", read_only=True)

    class Meta:
        model = PaymentAdjustment
        fields = [
            "id",
            "original_payment",
            "adjustment_amount",
            "reason",
            "created_by",
            "created_by_name",
            "created_at",
        ]
        read_only_fields = ["created_by", "created_at"]

    def validate(self, attrs):
        if not attrs.get("reason", "").strip():
            raise serializers.ValidationError({"reason": "A reason is required for every adjustment"})

        payment = attrs.get("original_payment")
        if payment and payment.status != "APPROVED":
            raise serializers.ValidationError(
                {"original_payment": "Adjustments only apply to already-approved payments. Pending or rejected payments can just be corrected directly."}
            )
        return attrs