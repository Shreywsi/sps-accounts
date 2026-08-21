from decimal import Decimal

from django.db import models
from django.utils import timezone

from apps.students.models import Student
from apps.fees.models.fee_structure import FeeStructure


class StudentFee(models.Model):
    STATUS_CHOICES = [
        ("PENDING", "Pending"),
        ("PARTIAL", "Partial"),
        ("PAID", "Paid"),
    ]

    student = models.ForeignKey(
        Student,
        on_delete=models.CASCADE,
        related_name="fees",
    )

    fee_structure = models.ForeignKey(
        FeeStructure,
        on_delete=models.PROTECT,
        related_name="student_fees",
    )

    total_amount = models.DecimalField(
        max_digits=10, decimal_places=2, default=Decimal("0.00"),
    )

    amount_paid = models.DecimalField(
        max_digits=10, decimal_places=2, default=Decimal("0.00"),
    )

    balance = models.DecimalField(
        max_digits=10, decimal_places=2, default=Decimal("0.00"),
    )

    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default="PENDING",
    )

    due_date = models.DateField(null=True, blank=True)

    # Late fee charged per day once due_date has passed
    late_fee_per_day = models.DecimalField(
        max_digits=8, decimal_places=2, default=Decimal("0.00"),
    )

    notes = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    assigned_at = models.DateTimeField(default=timezone.now)

    class Meta:
        unique_together = ("student", "fee_structure")

    def calculate_total(self):
        return sum(item.amount for item in self.fee_structure.items.all())

    @property
    def days_overdue(self):
        if not self.due_date or self.balance <= 0:
            return 0
        today = timezone.now().date()
        return max((today - self.due_date).days, 0)

    @property
    def late_fee_amount(self):
        return (self.late_fee_per_day or Decimal("0.00")) * self.days_overdue

    @property
    def total_payable(self):
        """Outstanding balance + any accrued late fee."""
        return self.balance + self.late_fee_amount

    def save(self, *args, **kwargs):
        self.total_amount = self.calculate_total()

        if self.amount_paid > self.total_amount:
            self.amount_paid = self.total_amount

        self.balance = self.total_amount - self.amount_paid

        if self.balance == 0:
            self.status = "PAID"
        elif self.amount_paid > 0:
            self.status = "PARTIAL"
        else:
            self.status = "PENDING"

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.student} - {self.fee_structure}"