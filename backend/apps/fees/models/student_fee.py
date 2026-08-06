from decimal import Decimal

from django.db import models

from apps.students.models import Student
from apps.fees.models.fee_structure import FeeStructure

from django.utils import timezone
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
    max_digits=10,
    decimal_places=2,
    default=Decimal("0.00"),
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

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="PENDING",
    )

    due_date = models.DateField(
        null=True,
        blank=True,
    )

    notes = models.TextField(
        blank=True,
    )

    is_active = models.BooleanField(
        default=True,
    )

    assigned_at = models.DateTimeField(
    default=timezone.now,
)

    class Meta:
        unique_together = (
            "student",
            "fee_structure",
        )

    def calculate_total(self):
        return sum(
            item.amount
            for item in self.fee_structure.items.all()
        )

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