from rest_framework import viewsets
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated

from apps.events.models import EventCategory
from apps.events.permissions import can_edit_event
from apps.events.serializers import EventCategorySerializer


class EventCategoryViewSet(viewsets.ModelViewSet):
    """
    Category (and sub-category, and sub-sub-category...) CRUD.
    Filter by ?event=<id> for the category list of one folder, or
    ?event=<id>&parent=<id> for direct children of one node
    (parent=null via ?parent__isnull=true isn't wired up — just use
    the /tree/ action on EventViewSet for the full nested view).
    """

    serializer_class = EventCategorySerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["event", "parent"]

    def get_queryset(self):
        qs = EventCategory.objects.select_related("event", "parent", "created_by")
        user = self.request.user
        if user.role != "ADMIN":
            qs = qs.filter(event__created_by=user)
        return qs

    def perform_create(self, serializer):
        event = serializer.validated_data["event"]
        if not can_edit_event(self.request.user, event):
            raise PermissionDenied("This event is locked, or isn't yours to edit.")
        serializer.save(created_by=self.request.user)

    def perform_update(self, serializer):
        category = self.get_object()
        if not can_edit_event(self.request.user, category.event):
            raise PermissionDenied("This event is locked, or isn't yours to edit.")
        serializer.save()

    def perform_destroy(self, instance):
        # Deleting a category cascades to its sub-categories and their
        # entries (model FK on_delete=CASCADE) — the UI should warn
        # the operator before calling this on a non-empty category.
        if not can_edit_event(self.request.user, instance.event):
            raise PermissionDenied("This event is locked, or isn't yours to edit.")
        instance.delete()
