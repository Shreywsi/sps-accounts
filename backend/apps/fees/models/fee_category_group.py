from django.db import models


class FeeCategoryGroup(models.Model):
    """Fee structure group (e.g., Day Scholar, Hostel/Boarding)"""
    BOARDING_CHOICES = [
        ("day_scholar", "Day Scholar"),
        ("hostel", "Hostel/Boarding"),
    ]

    session = models.ForeignKey(
        "fees.FeeSession",
        on_delete=models.PROTECT,
        related_name="fee_category_groups"
    )
    name = models.CharField(
        max_length=100,
        help_text="e.g., 'Day Scholar', 'Hostel/Boarding'"
    )
    boarding_type = models.CharField(
        max_length=20,
        choices=BOARDING_CHOICES,
        default="day_scholar"
    )
    applicable_class_range = models.CharField(
        max_length=100,
        help_text="e.g., 'Pre-Nursery', 'Nursery & KG', 'I-V', 'VI-VII', 'VI-VIII'"
    )
    display_order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["session", "boarding_type", "display_order", "name"]
        unique_together = ["session", "name", "boarding_type"]

    def __str__(self):
        return f"{self.session} - {self.name} ({self.get_boarding_type_display()})"
