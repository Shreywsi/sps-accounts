from rest_framework import serializers

from apps.fees.models import Payment, StudentFee


class PaymentSerializer(serializers.ModelSerializer):

    class Meta:
        model = Payment
        fields = "__all__"
        read_only_fields = (
            "receipt_number",
            "received_by",
            "payment_datetime",
        )

    def validate(self, attrs):
        student_fee = attrs["student_fee"]
        amount = attrs["amount"]

        if amount <= 0:
            raise serializers.ValidationError(
                {"amount": "Amount must be greater than zero."}
            )

        if amount > student_fee.balance:
            raise serializers.ValidationError(
                {
                    "amount":
                    "Payment exceeds remaining balance."
                }
            )

        return attrs