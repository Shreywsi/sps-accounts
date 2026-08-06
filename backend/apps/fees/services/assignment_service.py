from django.db import transaction

from apps.students.models import Student
from apps.fees.models import StudentFee


class FeeAssignmentService:

    @staticmethod
    @transaction.atomic
    def assign_to_student(
        student,
        fee_structure,
    ):
        assignment, created = StudentFee.objects.get_or_create(
            student=student,
            fee_structure=fee_structure,
        )

        return assignment, created

    @staticmethod
    @transaction.atomic
    def assign_to_class(
        school_class,
        fee_structure,
    ):
        students = Student.objects.filter(
            school_class=school_class,
            is_active=True,
        )

        created_count = 0

        for student in students:
            _, created = StudentFee.objects.get_or_create(
                student=student,
                fee_structure=fee_structure,
            )

            if created:
                created_count += 1

        return {
            "students": students.count(),
            "assigned": created_count,
        }