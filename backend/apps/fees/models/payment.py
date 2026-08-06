from django.conf import settings
from django.db import models

from apps.fees.models.student_fee import StudentFee


class Payment(models.Model):

    STATUS_CHOICES = [
        ("SUCCESS", "Success"),
        ("PENDING", "Pending"),
        ("FAILED", "Failed"),
        ("REFUNDED", "Refunded"),
    ]

    PAYMENT_METHODS = [
        ("cash", "Cash"),
        ("upi", "UPI"),
        ("card", "Card"),
        ("bank", "Bank Transfer"),
        ("cheque", "Cheque"),
    ]

    student_fee = models.ForeignKey(
        StudentFee,
        on_delete=models.CASCADE,
        related_name="payments",
    )

    receipt_number = models.CharField(
    max_length=30,
    unique=True,
    null=True,
    blank=True,
)

    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
    )

    payment_method = models.CharField(
        max_length=20,
        choices=PAYMENT_METHODS,
        default="cash",
    )

    transaction_reference = models.CharField(
        max_length=100,
        blank=True,
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="SUCCESS",
    )

    remarks = models.TextField(
        blank=True,
    )

    received_by = models.ForeignKey(
    settings.AUTH_USER_MODEL,
    on_delete=models.PROTECT,
    null=True,
    blank=True,
)

    payment_datetime = models.DateTimeField(
        auto_now_add=True,
    )

    class Meta:
        ordering = [
            "-payment_datetime",
        ]

    def __str__(self):
        return self.receipt_number