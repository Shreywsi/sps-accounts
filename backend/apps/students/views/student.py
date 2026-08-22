import json
import logging

import cloudinary.uploader
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from apps.students.models import Student
from apps.students.permissions import IsAdminRole, IsAdminOrOperator
from apps.students.serializers import StudentSerializer
from apps.activity.services import log_activity


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
    permission_classes = [IsAdminOrOperator]

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
        
        # Log the creation activity
        student = serializer.instance
        log_activity(
            actor=request.user,
            action_type="CREATE_STUDENT",
            description=f"Created student: {student.admission_no} - {student.first_name} {student.last_name}",
            target_model="Student",
            target_id=student.id,
            target_description=str(student),
            request=request,
        )
        
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

        # Log the update activity
        log_activity(
            actor=request.user,
            action_type="UPDATE_STUDENT",
            description=f"Updated student: {student.admission_no} - {student.first_name} {student.last_name}",
            target_model="Student",
            target_id=student.id,
            target_description=str(student),
            request=request,
        )

        serializer = self.get_serializer(student)
        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        student = self.get_object()

        # Log the deletion activity
        log_activity(
            actor=request.user,
            action_type="DELETE_STUDENT",
            description=f"Deleted student: {student.admission_no} - {student.first_name} {student.last_name}",
            target_model="Student",
            target_id=student.id,
            target_description=str(student),
            request=request,
        )

        # Delete student photo from Cloudinary if exists
        if student.photo:
            try:
                cloudinary.uploader.destroy(
                    student.photo.public_id,
                    invalidate=True,
                    resource_type=student.photo.resource_type,
                    type=student.photo.type,
                )
            except Exception:
                logger.exception("Failed to delete student photo from Cloudinary")

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

        # Log the verification activity
        log_activity(
            actor=request.user,
            action_type="VERIFY_STUDENT",
            description=f"Verified student: {student.admission_no} - {student.first_name} {student.last_name}",
            target_model="Student",
            target_id=student.id,
            target_description=str(student),
            request=request,
        )

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

        # Log the rejection activity
        log_activity(
            actor=request.user,
            action_type="REJECT_STUDENT",
            description=f"Rejected student: {student.admission_no} - {student.first_name} {student.last_name}. Reason: {reason}",
            target_model="Student",
            target_id=student.id,
            target_description=str(student),
            metadata={"rejection_reason": reason},
            request=request,
        )

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

        # Log the reopen activity
        log_activity(
            actor=request.user,
            action_type="REOPEN_STUDENT",
            description=f"Reopened student: {student.admission_no} - {student.first_name} {student.last_name}",
            target_model="Student",
            target_id=student.id,
            target_description=str(student),
            request=request,
        )

        return Response(
            {"message": "Student moved back to pending."},
            status=status.HTTP_200_OK,
        )