from rest_framework import serializers
from apps.fees.models.simple_payment import SimplePayment
from apps.students.serializers.student import StudentSerializer


class SimplePaymentSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.first_name", read_only=True)
    student_admission_no = serializers.CharField(source="student.admission_no", read_only=True)
    received_by_name = serializers.CharField(source="received_by.username", read_only=True)
    is_late = serializers.BooleanField(read_only=True)
    late_fee_amount = serializers.DecimalField(read_only=True, max_digits=10, decimal_places=2)
    
    class Meta:
        model = SimplePayment
        fields = [
            "id",
            "student",
            "student_name",
            "student_admission_no",
            "payment_type",
            "amount",
            "payment_method",
            "receipt",
            "receipt_number",
            "transaction_reference",
            "additional_fee_name",
            "notes",
            "status",
            "rejection_reason",
            "received_by",
            "received_by_name",
            "reviewed_by",
            "reviewed_at",
            "payment_date",
            "is_late",
            "late_fee_amount",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "receipt_number",
            "received_by",
            "reviewed_by",
            "reviewed_at",
            "status",
            "rejection_reason",
            "created_at",
            "updated_at",
            "is_late",
            "late_fee_amount",
        ]

    def validate(self, attrs):
        if not attrs.get('amount') or float(attrs.get('amount', 0)) <= 0:
            raise serializers.ValidationError("Amount must be greater than 0")
        return attrs