from django.db.models import Sum
from rest_framework import serializers

from apps.events.models import Event, EventEntry


class EventSerializer(serializers.ModelSerializer):

    created_by_name = serializers.CharField(
        source="created_by.username", read_only=True
    )
    approved_by_name = serializers.CharField(
        source="approved_by.username", read_only=True, allow_null=True
    )
    total_amount = serializers.SerializerMethodField()
    entries_count = serializers.SerializerMethodField()
    comments_count = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = (
            "id",
            "name",
            "event_date",
            "description",
            "status",
            "created_by",
            "created_by_name",
            "approved_by",
            "approved_by_name",
            "approved_at",
            "total_amount",
            "entries_count",
            "comments_count",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "status",
            "created_by",
            "approved_by",
            "approved_at",
        )

    def get_total_amount(self, obj):
        total = EventEntry.objects.filter(
            category__event=obj
        ).aggregate(total=Sum("amount"))["total"]
        return total or 0

    def get_entries_count(self, obj):
        return EventEntry.objects.filter(category__event=obj).count()

    def get_comments_count(self, obj):
        return obj.comments.count()

    def create(self, validated_data):
        validated_data["created_by"] = self.context["request"].user
        validated_data["status"] = Event.Status.SUBMITTED
        return super().create(validated_data)
