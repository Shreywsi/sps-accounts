from rest_framework import serializers
from .models import ActivityLog


class ActivityLogSerializer(serializers.ModelSerializer):
    actor_username = serializers.CharField(source="actor.username", read_only=True)
    actor_full_name = serializers.SerializerMethodField()

    class Meta:
        model = ActivityLog
        fields = [
            "id",
            "action_type",
            "description",
            "actor",
            "actor_username",
            "actor_full_name",
            "actor_role",
            "target_model",
            "target_id",
            "target_description",
            "ip_address",
            "metadata",
            "timestamp",
        ]
        read_only_fields = ["timestamp", "ip_address"]

    def get_actor_full_name(self, obj):
        if obj.actor:
            return f"{obj.actor.first_name} {obj.actor.last_name}".strip() or obj.actor.username
        return "Unknown"