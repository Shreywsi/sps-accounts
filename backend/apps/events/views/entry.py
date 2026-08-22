from rest_framework import viewsets
from rest_framework.exceptions import PermissionDenied
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated

from apps.events.models import EventEntry
from apps.events.permissions import can_edit_event
from apps.events.serializers import EventEntrySerializer


class EventEntryViewSet(viewsets.ModelViewSet):
    """
    A spend line (e.g. 'Sugar - ₹80') inside a category, with an
    optional receipt file. Filter by ?category=<id> or
    ?category__event=<event_id>.
    """

    serializer_class = EventEntrySerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    filterset_fields = ["category", "category__event", "payment_method", "entry_date"]

    def get_queryset(self):
        qs = EventEntry.objects.select_related(
            "category", "category__event", "created_by"
        )
        user = self.request.user
        if user.role != "ADMIN":
            qs = qs.filter(category__event__created_by=user)
        return qs

    def perform_create(self, serializer):
        category = serializer.validated_data["category"]
        if not can_edit_event(self.request.user, category.event):
            raise PermissionDenied("This event is locked, or isn't yours to edit.")
        serializer.save(created_by=self.request.user)

    def perform_update(self, serializer):
        entry = self.get_object()
        if not can_edit_event(self.request.user, entry.category.event):
            raise PermissionDenied("This event is locked, or isn't yours to edit.")
        serializer.save()

    def perform_destroy(self, instance):
        if not can_edit_event(self.request.user, instance.category.event):
            raise PermissionDenied("This event is locked, or isn't yours to edit.")
        instance.delete()
