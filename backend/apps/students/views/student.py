from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.students.models import Student
from apps.students.serializers import StudentSerializer
from rest_framework.permissions import IsAuthenticated

class StudentViewSet(viewsets.ModelViewSet):
    queryset = Student.objects.all()
    serializer_class = StudentSerializer
    permission_classes = [IsAuthenticated]

    filterset_fields = [
        "school_class",
        "academic_section",
        "is_active",
        "verification_status",
    ]

    def update(self, request, *args, **kwargs):
        student = self.get_object()

        if student.verification_status == "VERIFIED":
            return Response(
                {"detail": "Verified students cannot be edited."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        student = self.get_object()

        if student.verification_status == "VERIFIED":
            return Response(
                {"detail": "Verified students cannot be deleted."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=["post"])
    def verify(self, request, pk=None):
        student = self.get_object()

        student.verification_status = "VERIFIED"
        student.verified_by = request.user
        student.verified_at = timezone.now()
        student.save()

        return Response(
            {"message": "Student verified successfully."},
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=["post"])
    def reject(self, request, pk=None):
        student = self.get_object()

        student.verification_status = "REJECTED"
        student.verified_by = None
        student.verified_at = None
        student.save()

        return Response(
            {"message": "Student rejected successfully."},
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=["post"])
    def reopen(self, request, pk=None):
        student = self.get_object()

        student.verification_status = "PENDING"
        student.verified_by = None
        student.verified_at = None
        student.save()

        return Response(
            {"message": "Student moved back to pending."},
            status=status.HTTP_200_OK,
        )