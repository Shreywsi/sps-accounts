from rest_framework import serializers

from apps.events.models import EventEntry


class EventEntrySerializer(serializers.ModelSerializer):

    category_name = serializers.CharField(source="category.name", read_only=True)
    event = serializers.UUIDField(source="category.event_id", read_only=True)
    created_by_name = serializers.CharField(
        source="created_by.username", read_only=True
    )
    receipt_url = serializers.SerializerMethodField()

    class Meta:
        model = EventEntry
        fields = (
            "id",
            "category",
            "category_name",
            "event",
            "title",
            "amount",
            "payment_method",
            "entry_date",
            "remarks",
            "receipt",
            "receipt_url",
            "created_by",
            "created_by_name",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("created_by",)

    def get_receipt_url(self, obj):
        if not obj.receipt:
            return None
        request = self.context.get("request")
        url = obj.receipt.url
        return request.build_absolute_uri(url) if request else url

    def create(self, validated_data):
        validated_data["created_by"] = self.context["request"].user
        return super().create(validated_data)
