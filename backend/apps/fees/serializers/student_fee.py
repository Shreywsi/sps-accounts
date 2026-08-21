from rest_framework import serializers

from apps.fees.models import StudentFee


class StudentFeeSerializer(serializers.ModelSerializer):

    student_name = serializers.CharField(
        source="student.first_name",
        read_only=True,
    )

    total_amount = serializers.ReadOnlyField()
    paid_amount = serializers.ReadOnlyField()
    due_amount = serializers.ReadOnlyField()

    days_overdue = serializers.ReadOnlyField()
    late_fee_amount = serializers.ReadOnlyField()
    total_payable = serializers.ReadOnlyField()

    class Meta:
        model = StudentFee
        fields = "__all__"