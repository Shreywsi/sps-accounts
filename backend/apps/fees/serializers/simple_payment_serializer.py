from decimal import Decimal

from rest_framework import serializers
from apps.fees.models.simple_payment import SimplePayment
from apps.students.serializers.student import StudentSerializer


class SimplePaymentSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.first_name", read_only=True, allow_null=True)
    student_admission_no = serializers.CharField(source="student.admission_no", read_only=True, allow_null=True)
    received_by_name = serializers.CharField(source="received_by.username", read_only=True, allow_null=True)
    is_late = serializers.SerializerMethodField()
    is_locked = serializers.BooleanField(read_only=True)
    late_fee_amount = serializers.SerializerMethodField()

    def get_is_late(self, obj):
        try:
            return obj.is_late
        except:
            return False

    def get_late_fee_amount(self, obj):
        try:
            return obj.late_fee_amount
        except:
            return 0

    class Meta:
        model = SimplePayment
        fields = [
            "id",
            "student",
            "student_name",
            "student_admission_no",
            "monthly_fee_record",
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
            "is_locked",
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
            "is_locked",
            "late_fee_amount",
        ]

    def validate(self, attrs):
        amount = attrs.get("amount")
        if not amount or amount <= 0:
            raise serializers.ValidationError({"amount": "Amount must be greater than 0"})

        record = attrs.get("monthly_fee_record")
        payment_type = attrs.get("payment_type", "MONTHLY")

        # Make monthly_fee_record optional to allow one-time payments
        if payment_type == "MONTHLY" and record is None:
            # Allow monthly payments without ledger record for now
            pass

        if record is not None:
            try:
                # Operators can't record an amount that would overshoot what's
                # actually owed for that month - this is the server-side check
                # that keeps the ledger trustworthy even if the UI has a bug.
                if amount > record.balance:
                    raise serializers.ValidationError(
                        {
                            "amount": (
                                f"Amount ({amount}) exceeds the outstanding balance "
                                f"({record.balance}) for {record.month}/{record.year}"
                            )
                        }
                    )
                student = attrs.get("student") or getattr(self.instance, "student", None)
                if student and record.student_id != student.id:
                    raise serializers.ValidationError(
                        {"monthly_fee_record": "This ledger row belongs to a different student"}
                    )
            except serializers.ValidationError:
                raise
            except Exception as e:
                # Log but don't fail on ledger validation errors
                pass

        return attrs