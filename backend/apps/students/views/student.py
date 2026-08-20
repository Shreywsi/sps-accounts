import json
import logging

import cloudinary.uploader
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from apps.students.models import Student
from apps.students.permissions import IsAdminRole
from apps.students.serializers import StudentSerializer


logger = logging.getLogger(__name__)


def _prepare_data(request):
    """
    Multipart form submissions (used whenever a photo file is attached)
    send `custom_values` as a JSON-encoded string instead of a real
    nested list, because HTML forms can't send nested JSON directly.
    Convert it back into a list here so the serializer can validate it
    normally, regardless of whether the request was JSON or multipart.
    """
    data = request.data

    if hasattr(data, "dict"):
        data = data.dict()
    else:
        data = dict(data)

    raw_custom_values = data.get("custom_values")
    if isinstance(raw_custom_values, str):
        try:
            data["custom_values"] = json.loads(raw_custom_values)
        except (TypeError, ValueError):
            data["custom_values"] = []

    return data


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

    def create(self, request, *args, **kwargs):
        data = _prepare_data(request)
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED,
            headers=headers,
        )

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        student = self.get_object()

        data = _prepare_data(request)
        remove_photo = str(data.pop("remove_photo", "")).lower() == "true"
        old_photo = student.photo if remove_photo and "photo" not in data else None
        if remove_photo and "photo" not in data:
            data["photo"] = None

        serializer = self.get_serializer(student, data=data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        if old_photo:
            try:
                cloudinary.uploader.destroy(
                    old_photo.public_id,
                    invalidate=True,
                    resource_type=old_photo.resource_type,
                    type=old_photo.type,
                )
            except Exception:
                logger.exception("Failed to delete old student photo from Cloudinary")

        # Any edit (from PENDING, VERIFIED, or REJECTED) must go back
        # through admin review instead of being silently accepted or
        # blocked outright. This is what lets the operator actually
        # submit changes: they save, it goes to PENDING, the admin
        # verifies or rejects it, and the operator sees that result.
        student.refresh_from_db()
        student.verification_status = "PENDING"
        student.verified_by = None
        student.verified_at = None
        student.rejection_reason = ""
        student.save()

        serializer = self.get_serializer(student)
        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        student = self.get_object()

        if student.verification_status == "VERIFIED":
            return Response(
                {"detail": "Verified students cannot be deleted."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return super().destroy(request, *args, **kwargs)

    @action(
        detail=True,
        methods=["post"],
        permission_classes=[IsAdminRole],
    )
    def verify(self, request, pk=None):
        student = self.get_object()

        student.verification_status = "VERIFIED"
        student.verified_by = request.user
        student.verified_at = timezone.now()
        student.rejection_reason = ""
        student.save()

        return Response(
            {"message": "Student verified successfully."},
            status=status.HTTP_200_OK,
        )

    @action(
        detail=True,
        methods=["post"],
        permission_classes=[IsAdminRole],
    )
    def reject(self, request, pk=None):
        student = self.get_object()

        reason = request.data.get("reason", "").strip()

        student.verification_status = "REJECTED"
        student.verified_by = None
        student.verified_at = None
        student.rejection_reason = reason
        student.save()

        return Response(
            {"message": "Student rejected successfully."},
            status=status.HTTP_200_OK,
        )

    @action(
        detail=True,
        methods=["post"],
        permission_classes=[IsAdminRole],
    )
    def reopen(self, request, pk=None):
        student = self.get_object()

        student.verification_status = "PENDING"
        student.verified_by = None
        student.verified_at = None
        student.rejection_reason = ""
        student.save()

        return Response(
            {"message": "Student moved back to pending."},
            status=status.HTTP_200_OK,
        )