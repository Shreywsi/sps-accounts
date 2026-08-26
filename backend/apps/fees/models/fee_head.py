from django.db import models


class FeeHead(models.Model):
    """Individual fee line item (e.g., Registration, Tuition, Hostel)"""
    FREQUENCY_CHOICES = [
        ("one_time", "One-time"),
        ("monthly", "Monthly"),
        ("yearly", "Yearly"),
    ]

    EDITABLE_BY_CHOICES = [
        ("admin", "Admin Only"),
        ("admin_operator", "Admin + Operator"),
    ]

    group = models.ForeignKey(
        "fees.FeeCategoryGroup",
        on_delete=models.CASCADE,
        related_name="fee_heads"
    )
    label = models.CharField(
        max_length=200,
        help_text="e.g., 'Registration Fees', 'Tuition Fees', 'Hostel/Accommodation'"
    )
    frequency = models.CharField(
        max_length=20,
        choices=FREQUENCY_CHOICES,
        default="monthly"
    )
    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="Amount for the frequency (not annual equivalent)"
    )
    annual_equivalent = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        help_text="Auto-computed: monthly*12 or yearly amount or one_time amount"
    )
    is_mandatory = models.BooleanField(
        default=True,
        help_text="Whether this fee head is mandatory for all students"
    )
    display_order = models.IntegerField(default=0)
    editable_by = models.CharField(
        max_length=20,
        choices=EDITABLE_BY_CHOICES,
        default="admin_operator",
        help_text="Who can edit this fee head"
    )
    notes = models.TextField(
        blank=True,
        help_text="Optional notes about this fee head"
    )
    is_active = models.BooleanField(
        default=True,
        help_text="Inactive heads won't be applied to new assignments"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["group", "display_order", "label"]

    def __str__(self):
        return f"{self.label} ({self.get_frequency_display()}) - ₹{self.amount}"

    def save(self, *args, **kwargs):
        # Auto-calculate annual equivalent
        if self.frequency == "monthly":
            self.annual_equivalent = self.amount * 12
        elif self.frequency == "yearly":
            self.annual_equivalent = self.amount
        else:  # one_time
            self.annual_equivalent = self.amount
        super().save(*args, **kwargs)
