from django.db.models import ProtectedError
from rest_framework import viewsets, status
from rest_framework.response import Response

from apps.fees.models import FeeStructure
from apps.fees.permissions import IsOperatorOrAdmin
from apps.fees.serializers import FeeStructureSerializer
from apps.notifications.utils import notify_admins


class FeeStructureViewSet(viewsets.ModelViewSet):
    queryset = (
        FeeStructure.objects
        .select_related(
            "school_class",
            "academic_session",
        )
    )
    serializer_class = FeeStructureSerializer
    permission_classes = [IsOperatorOrAdmin]
    filterset_fields = [
        "school_class",
        "academic_session",
    ]

    def perform_create(self, serializer):
        structure = serializer.save()
        notify_admins(
            actor=self.request.user,
            category="FEES",
            title="New fee structure created",
            message=(
                f"{self.request.user.username} created fee structure "
                f"'{structure.name}' for {structure.school_class}."
            ),
            link="/fees/structure",
        )

    def perform_update(self, serializer):
        structure = serializer.save()
        notify_admins(
            actor=self.request.user,
            category="FEES",
            title="Fee structure updated",
            message=(
                f"{self.request.user.username} updated fee structure "
                f"'{structure.name}' for {structure.school_class}."
            ),
            link="/fees/structure",
        )

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        try:
            instance.delete()
        except ProtectedError:
            return Response(
                {
                    "detail": (
                        "This fee structure is already assigned to one or "
                        "more students, so it can't be deleted. Deactivate "
                        "it instead, or remove the student assignments first."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(status=status.HTTP_204_NO_CONTENT)