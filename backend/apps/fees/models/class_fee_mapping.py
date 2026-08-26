from django.db import models


class ClassFeeMapping(models.Model):
    """Links a class to its applicable FeeCategoryGroup(s)"""
    session = models.ForeignKey(
        "fees.FeeSession",
        on_delete=models.PROTECT,
        related_name="class_mappings"
    )
    class_name = models.CharField(
        max_length=50,
        help_text="e.g., 'Nursery', 'KG', 'I', 'II', ... 'VIII'"
    )
    day_scholar_group = models.ForeignKey(
        "fees.FeeCategoryGroup",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="day_scholar_classes",
        help_text="Fee group for day scholar students in this class"
    )
    hostel_group = models.ForeignKey(
        "fees.FeeCategoryGroup",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="hostel_classes",
        help_text="Fee group for hostel students in this class"
    )
    default_uniform_gender_required = models.BooleanField(
        default=True,
        help_text="Whether uniform selection applies to this class"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["session", "class_name"]
        unique_together = ["session", "class_name"]

    def __str__(self):
        return f"{self.session} - Class {self.class_name}"
