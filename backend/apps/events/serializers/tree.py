from rest_framework import serializers

from apps.events.models import EventCategory
from apps.events.serializers.entry import EventEntrySerializer


class CategoryNodeSerializer(serializers.ModelSerializer):
    """
    Recursive: a category serializes its own entries plus its child
    categories (which themselves serialize their entries + children,
    and so on) — this is what lets 'category within category' render
    as a folder tree in one API call.
    """

    entries = EventEntrySerializer(many=True, read_only=True)
    children = serializers.SerializerMethodField()
    subtotal = serializers.SerializerMethodField()

    class Meta:
        model = EventCategory
        fields = (
            "id",
            "name",
            "parent",
            "entries",
            "children",
            "subtotal",
        )

    def get_children(self, obj):
        # obj.children is prefetched (see views/event.py) so this
        # doesn't re-hit the database per node.
        children = sorted(obj.children.all(), key=lambda c: c.name.lower())
        return CategoryNodeSerializer(children, many=True, context=self.context).data

    def get_subtotal(self, obj):
        """Sum of this category's own entries + every descendant's."""
        total = sum((e.amount for e in obj.entries.all()), start=0)
        for child in obj.children.all():
            total += self.get_subtotal(child)
        return total
