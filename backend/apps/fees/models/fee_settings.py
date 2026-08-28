from django.db import models


class FeeSettings(models.Model):
    """
    School-wide fee due day / late fee policy.

    This used to live as per-student fields (Student.fee_due_day /
    Student.late_fee_per_day), but the due day and late-fee rate are a
    school policy, not something that varies from student to student -
    so they were pulled out into this single shared row instead.

    This is a singleton: there is only ever one row (pk=1). Use
    FeeSettings.get_solo() to read it - it creates the row with sane
    defaults the first time it's called, so callers never have to
    handle a "does not exist yet" case.
    """

    fee_due_day = models.PositiveIntegerField(
        default=10,
        help_text="Day of month when fees are due (e.g., 10 for the 10th).",
    )

    late_fee_per_day = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        default=10,
        help_text="Late fee charged per day after the due day, e.g. \u20b910 per day late.",
    )

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Fee Settings"
        verbose_name_plural = "Fee Settings"

    def __str__(self):
        return f"Due day {self.fee_due_day}, \u20b9{self.late_fee_per_day}/day late"

    def save(self, *args, **kwargs):
        # Force this to always be the single row - if anything ever tries
        # to create a second FeeSettings, it silently overwrites row 1
        # instead of creating a second one.
        self.pk = 1
        super().save(*args, **kwargs)

    @classmethod
    def get_solo(cls):
        obj, _created = cls.objects.get_or_create(pk=1)
        return obj
