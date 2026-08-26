import json
import logging

import cloudinary.uploader
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.filters import SearchFilter
from django_filters.rest_framework import DjangoFilterBackend

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

    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = [
        "school_class",
        "academic_section",
        "is_active",
        "verification_status",
    ]
    # Powers ?search= on the fee-collection student lookup and anywhere
    # else the student list is searched from.
    search_fields = [
        "first_name",
        "last_name",
        "admission_no",
        "father_name",
        "mother_name",
    ]

    def get_queryset(self):
        queryset = super().get_queryset()
        # Admins can see all students, operators can only see students they created
        if self.request.user.role != "ADMIN":
            # For operators, show all students since they need to see the full list
            # If you want to restrict to only operator-created students, uncomment below:
            # queryset = queryset.filter(created_by=self.request.user)
            pass
        return queryset

    def filter_queryset(self, queryset):
        queryset = super().filter_queryset(queryset)

        # SearchFilter (search_fields above) only covers text columns.
        # roll_number is an IntegerField, and icontains on an integer
        # column isn't safe across every DB backend, so widen a
        # purely-numeric search term to also match an exact roll number.
        search = self.request.query_params.get("search")
        if search and search.strip().isdigit():
            roll_matches = self.get_queryset().filter(roll_number=int(search.strip()))
            queryset = (queryset | roll_matches).distinct()

        return queryset

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

    @action(detail=False, methods=["get"])
    def unpaid_students(self, request):
        """Get list of students with unpaid fees"""
        try:
            # Get all active students
            students = Student.objects.filter(
                is_active=True
            ).order_by('admission_no')

            # Filter students who have unpaid fees
            unpaid_list = []
            for student in students:
                try:
                    # Calculate fee balance using the model property
                    balance = student.fee_balance if hasattr(student, 'fee_balance') else 0
                    if balance > 0:
                        unpaid_list.append(student)
                except Exception:
                    # If fee calculation fails, skip this student
                    continue

            serializer = self.get_serializer(unpaid_list, many=True)
            return Response(serializer.data)
        except Exception as e:
            logger.exception("Error fetching unpaid students")
            # Return empty list instead of error to avoid breaking the dashboard
            return Response([])