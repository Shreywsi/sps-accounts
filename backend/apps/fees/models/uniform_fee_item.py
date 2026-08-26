from django.db import models


class UniformFeeItem(models.Model):
    """Uniform pricing items"""
    GENDER_CHOICES = [
        ("boys", "Boys"),
        ("girls", "Girls"),
    ]

    session = models.ForeignKey(
        "fees.FeeSession",
        on_delete=models.PROTECT,
        related_name="uniform_items"
    )
    gender = models.CharField(
        max_length=10,
        choices=GENDER_CHOICES
    )
    item_name = models.CharField(
        max_length=100,
        help_text="e.g., 'Full Shirt', 'Tunic', 'Socks 2 Set', 'Tie', 'Belt'"
    )
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )
    display_order = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["session", "gender", "display_order", "item_name"]
        unique_together = ["session", "gender", "item_name"]

    def __str__(self):
        return f"{self.get_gender_display()} - {self.item_name} - ₹{self.price}"
