from django.db import models

from apps.academics.models import AcademicSession, SchoolClass


class FeeStructure(models.Model):
    name = models.CharField(
        max_length=100,
    )

    academic_session = models.ForeignKey(
        AcademicSession,
        on_delete=models.CASCADE,
        related_name="fee_structures",
    )

    school_class = models.ForeignKey(
        SchoolClass,
        on_delete=models.CASCADE,
        related_name="fee_structures",
    )

    due_date = models.DateField(null=True, blank=True)

    late_fee_per_day = models.DecimalField(
        max_digits=8, decimal_places=2, default=0,
    )

    is_active = models.BooleanField(
        default=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    class Meta:
        unique_together = (
            "academic_session",
            "school_class",
        )

    def __str__(self):
        return f"{self.name} ({self.school_class})"