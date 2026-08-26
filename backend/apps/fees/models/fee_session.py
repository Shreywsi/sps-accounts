from django.db import models


class FeeSession(models.Model):
    """Academic session for fee structure versioning"""
    session_label = models.CharField(
        max_length=50,
        unique=True,
        help_text="e.g., '2022-2023', '2026-2027'"
    )
    is_active = models.BooleanField(
        default=True,
        help_text="The active session is used for new admissions and fee collections"
    )
    start_date = models.DateField(
        null=True,
        blank=True,
        help_text="Session start date"
    )
    end_date = models.DateField(
        null=True,
        blank=True,
        help_text="Session end date"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-start_date", "-session_label"]

    def __str__(self):
        return self.session_label

    def save(self, *args, **kwargs):
        # Ensure only one active session
        if self.is_active:
            FeeSession.objects.filter(is_active=True).exclude(id=self.id).update(is_active=False)
        super().save(*args, **kwargs)
