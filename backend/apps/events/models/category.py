import uuid

from django.conf import settings
from django.db import models


class EventCategory(models.Model):
    """
    A category (or sub-category, or sub-sub-category...) inside an
    Event folder. 'parent' being null makes it a top-level category
    of the event; pointing it at another category nests it one level
    deeper. There's no fixed depth limit — operators can add/delete
    freely.
    """

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    event = models.ForeignKey(
        "events.Event",
        on_delete=models.CASCADE,
        related_name="categories",
    )

    parent = models.ForeignKey(
        "self",
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name="children",
    )

    name = models.CharField(max_length=150)

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="created_event_categories",
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]
        verbose_name_plural = "Event categories"
        constraints = [
            models.UniqueConstraint(
                fields=["event", "parent", "name"],
                name="unique_category_name_under_same_parent",
            )
        ]

    def __str__(self):
        return self.name

    def clean(self):
        from django.core.exceptions import ValidationError

        # A category can't nest inside a category from a different event.
        if self.parent_id and self.parent.event_id != self.event_id:
            raise ValidationError("Sub-category must belong to the same event as its parent.")

        # Prevent a category being made its own ancestor.
        node = self.parent
        while node is not None:
            if node.id == self.id:
                raise ValidationError("A category cannot be nested inside itself.")
            node = node.parent
