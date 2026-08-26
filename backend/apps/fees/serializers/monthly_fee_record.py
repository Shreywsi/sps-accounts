from rest_framework import serializers

from apps.fees.models.monthly_fee_record import MonthlyFeeRecord


class MonthlyFeeRecordPaymentSerializer(serializers.Serializer):
    """Trimmed-down payment info nested inside a ledger row - just enough
    for the admin to see what happened without a second request."""

    id = serializers.UUIDField()
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    payment_method = serializers.CharField()
    status = serializers.CharField()
    receipt_number = serializers.CharField()
    received_by_name = serializers.CharField(source="received_by.username")
    payment_date = serializers.DateField()


class MonthlyFeeRecordSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.first_name", read_only=True)
    student_admission_no = serializers.CharField(source="student.admission_no", read_only=True)
    payments = MonthlyFeeRecordPaymentSerializer(many=True, read_only=True)
    month_label = serializers.SerializerMethodField()

    class Meta:
        model = MonthlyFeeRecord
        fields = [
            "id",
            "student",
            "student_name",
            "student_admission_no",
            "year",
            "month",
            "month_label",
            "expected_amount",
            "amount_paid",
            "balance",
            "due_date",
            "status",
            "payments",
        ]
        read_only_fields = fields

    def get_month_label(self, obj):
        import calendar

        return f"{calendar.month_abbr[obj.month]} {obj.year}"