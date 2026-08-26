from rest_framework import serializers
from apps.fees.models.fee_session import FeeSession


class FeeSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = FeeSession
        fields = [
            "id",
            "session_label",
            "is_active",
            "start_date",
            "end_date",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]
