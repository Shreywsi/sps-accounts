import uuid

from django.conf import settings
from django.db import models


class EventComment(models.Model):
    """
    A remark left on an Event (general) or on one specific EventEntry
    (e.g. 'please attach the receipt for this one'). Either role can
    post — admins verifying, operators replying/clarifying.
    """

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    event = models.ForeignKey(
        "events.Event",
        on_delete=models.CASCADE,
        related_name="comments",
    )

    entry = models.ForeignKey(
        "events.EventEntry",
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name="comments",
        help_text="Leave blank for a general comment on the whole event.",
    )

    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="event_comments",
    )

    message = models.TextField()

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"Comment by {self.author} on {self.event}"
