from decimal import Decimal

from django.db import models
from django.utils import timezone

from apps.students.models import Student


class MonthlyFeeRecord(models.Model):
    """
    One row per student per calendar month. This is the ledger admins
    actually read the financial status off of. `expected_amount` is a
    snapshot taken at generation time (student.total_monthly_fee at that
    moment) so that changing a student's fee later doesn't rewrite history
    for months that already passed.

    SimplePayment rows point at a MonthlyFeeRecord; approving a payment is
    the only thing allowed to move amount_paid/balance/status on this model
    (see SimplePaymentViewSet.approve and PaymentAdjustment for corrections
    after approval).
    """

    STATUS_CHOICES = [
        ("PENDING", "Pending"),
        ("PARTIAL", "Partial"),
        ("PAID", "Paid"),
        ("OVERDUE", "Overdue"),
    ]

    student = models.ForeignKey(
        Student,
        on_delete=models.CASCADE,
        related_name="monthly_fee_records",
    )

    year = models.PositiveIntegerField()

    month = models.PositiveSmallIntegerField(
        help_text="1-12",
    )

    expected_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="Snapshot of the student's monthly fee when this record was generated",
    )

    amount_paid = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal("0.00"),
    )

    balance = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal("0.00"),
    )

    due_date = models.DateField(null=True, blank=True)

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="PENDING",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("student", "year", "month")
        ordering = ["-year", "-month"]

    def __str__(self):
        return f"{self.student.admission_no} - {self.year}-{self.month:02d}"

    def recalculate(self, save=True):
        """Recompute balance/status from amount_paid. Call after any change
        to amount_paid (payment approval, adjustment, refund)."""
        self.balance = self.expected_amount - self.amount_paid

        if self.balance <= 0:
            self.status = "PAID"
        elif self.amount_paid > 0:
            self.status = "PARTIAL"
        elif self.due_date and timezone.localdate() > self.due_date:
            self.status = "OVERDUE"
        else:
            self.status = "PENDING"

        if save:
            self.save(update_fields=["balance", "status", "updated_at"])

    @classmethod
    def generate_for_student(cls, student, year, month):
        """Idempotent: returns the existing record if one already exists
        for this student/year/month, otherwise creates it from the
        student's current fee configuration."""
        record, created = cls.objects.get_or_create(
            student=student,
            year=year,
            month=month,
            defaults={
                "expected_amount": student.total_monthly_fee,
                "due_date": cls._due_date_for(student, year, month),
            },
        )
        if created:
            record.recalculate()
        return record, created

    @staticmethod
    def _due_date_for(student, year, month):
        import calendar

        from apps.fees.models.fee_settings import FeeSettings

        # The due day is school-wide policy (Fee Settings, next to Class
        # Mappings), not a per-student value.
        day = FeeSettings.get_solo().fee_due_day or 10
        last_day = calendar.monthrange(year, month)[1]
        day = min(day, last_day)
        return timezone.datetime(year, month, day).date()