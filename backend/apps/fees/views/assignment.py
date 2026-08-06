from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.fees.models import FeeStructure
from apps.fees.services.assignment_service import (
    FeeAssignmentService,
)

from .student_fee import StudentFeeViewSet


class FeeAssignmentViewSet(StudentFeeViewSet):

    @action(
        detail=False,
        methods=["post"],
        url_path="assign-class",
    )
    def assign_class(
        self,
        request,
    ):
        school_class = request.data.get(
            "school_class",
        )

        fee_structure = request.data.get(
            "fee_structure",
        )

        if not school_class or not fee_structure:
            return Response(
                {
                    "detail":
                    "school_class and fee_structure are required."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        structure = FeeStructure.objects.get(
            id=fee_structure,
        )

        result = FeeAssignmentService.assign_to_class(
            structure.school_class,
            structure,
        )

        return Response(result)