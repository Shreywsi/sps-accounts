from rest_framework import serializers
from apps.fees.models.student_fee_assignment import StudentFeeAssignment
from apps.fees.serializers.fee_session import FeeSessionSerializer
from apps.students.serializers.student import StudentSerializer


class StudentFeeAssignmentSerializer(serializers.ModelSerializer):
    student_details = StudentSerializer(source="student", read_only=True)
    session_details = FeeSessionSerializer(source="session", read_only=True)
    total_one_time = serializers.SerializerMethodField()
    total_annual = serializers.SerializerMethodField()
    monthly_tuition = serializers.SerializerMethodField()
    uniform_total = serializers.SerializerMethodField()
    total_package = serializers.SerializerMethodField()

    class Meta:
        model = StudentFeeAssignment
        fields = [
            "id",
            "student",
            "student_details",
            "session",
            "session_details",
            "boarding_type",
            "fee_heads",
            "uniform_selection",
            "transportation_fee",
            "created_from_template",
            "total_one_time",
            "total_annual",
            "monthly_tuition",
            "uniform_total",
            "total_package",
            "last_modified_by",
            "last_modified_at",
            "created_at",
        ]
        read_only_fields = [
            "total_one_time",
            "total_annual",
            "monthly_tuition",
            "uniform_total",
            "total_package",
            "last_modified_by",
            "last_modified_at",
            "created_at",
        ]

    def get_total_one_time(self, obj):
        return obj.calculate_total_one_time()

    def get_total_annual(self, obj):
        return obj.calculate_total_annual()

    def get_monthly_tuition(self, obj):
        return obj.calculate_monthly_tuition()

    def get_uniform_total(self, obj):
        return obj.calculate_uniform_total()

    def get_total_package(self, obj):
        return obj.calculate_total_package()
