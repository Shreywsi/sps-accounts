import uuid

from django.conf import settings
from django.db import models


class EventEntry(models.Model):
    """
    A single spend line sitting inside a category — e.g. 'Sugar - ₹80'
    inside the 'Food Ingredients' category of the 'Picnic' event.
    Optional receipt attachment.
    """

    PAYMENT_METHODS = [
        ("cash", "Cash"),
        ("upi", "UPI"),
        ("card", "Card"),
        ("bank", "Bank Transfer"),
        ("cheque", "Cheque"),
    ]

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    category = models.ForeignKey(
        "events.EventCategory",
        on_delete=models.CASCADE,
        related_name="entries",
    )

    title = models.CharField(max_length=200, help_text="e.g. 'Sugar', 'Salt'")

    amount = models.DecimalField(max_digits=10, decimal_places=2)

    payment_method = models.CharField(
        max_length=20,
        choices=PAYMENT_METHODS,
        default="cash",
    )

    entry_date = models.DateField()

    remarks = models.TextField(blank=True)

    receipt = models.FileField(
        upload_to="event_receipts/%Y/%m/",
        null=True,
        blank=True,
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="created_event_entries",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-entry_date", "-created_at"]
        verbose_name_plural = "Event entries"

    def __str__(self):
        return f"{self.title} - {self.amount}"

    @property
    def event_id_(self):
        return self.category.event_id
