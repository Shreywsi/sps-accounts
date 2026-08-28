import uuid

from django.conf import settings
from django.db import models
from django.utils import timezone
from cloudinary.models import CloudinaryField

from apps.students.models import Student


class SimplePayment(models.Model):
    """Simplified payment model linked directly to students."""

    PAYMENT_METHODS = [
        ("cash", "Cash"),
        ("upi", "UPI"),
        ("card", "Card"),
        ("bank", "Bank Transfer"),
        ("cheque", "Cheque"),
    ]

    PAYMENT_TYPES = [
        ("MONTHLY", "Monthly Fee"),
        ("ANNUAL", "Annual Fee"),
        ("CAB", "Cab Fee"),
        ("ADDITIONAL", "Additional Fee"),
        ("OTHER", "Other"),
    ]

    STATUS_CHOICES = [
        ("PENDING", "Pending Review"),
        ("APPROVED", "Approved"),
        ("REJECTED", "Rejected"),
    ]

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    student = models.ForeignKey(
        Student,
        on_delete=models.CASCADE,
        related_name="simple_payments",
    )

    # Which month's ledger row this payment applies to.
    # Required logically for MONTHLY payments, but kept optional at the
    # database level for ANNUAL/CAB/ADDITIONAL/OTHER payments.
    monthly_fee_record = models.ForeignKey(
        "fees.MonthlyFeeRecord",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="payments",
    )

    payment_type = models.CharField(
        max_length=20,
        choices=PAYMENT_TYPES,
        default="MONTHLY",
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

    receipt = CloudinaryField(
        "image",
        folder="school-accounts/receipts",
        null=True,
        blank=True,
    )

    receipt_number = models.CharField(
        max_length=30,
        unique=True,
        null=True,
        blank=True,
    )

    transaction_reference = models.CharField(
        max_length=100,
        blank=True,
    )

    # For additional fees, store the fee name.
    additional_fee_name = models.CharField(
        max_length=100,
        blank=True,
        help_text="Name of additional fee if payment_type is ADDITIONAL",
    )

    notes = models.TextField(
        blank=True,
    )

    # Admin review status.
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="PENDING",
    )

    rejection_reason = models.TextField(
        blank=True,
    )

    received_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="received_payments",
    )

    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reviewed_payments",
    )

    reviewed_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    payment_date = models.DateField(
        default=timezone.localdate,
    )

    late_fee_days = models.PositiveIntegerField(
        default=0,
        help_text="Number of days late this payment was made, snapshotted at creation time.",
    )

    late_fee_charged = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        default=0,
        help_text="Late fee amount snapshotted at creation time (days_late x rate at that time).",
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        ordering = ["-payment_date", "-created_at"]

    def __str__(self):
        return (
            f"{self.student.admission_no} - "
            f"{self.payment_type} - "
            f"{self.amount}"
        )

    @property
    def is_locked(self):
        """
        Approved payments are permanent financial records and cannot
        be edited or deleted.

        Corrections should go through PaymentAdjustment.
        """
        return self.status == "APPROVED"

    @property
    def is_late(self):
        """
        Check if payment was made after the school-wide fee due day
        (Fee Settings, next to Class Mappings) - the due day is school
        policy, not a per-student value.
        """
        from apps.fees.models.fee_settings import FeeSettings

        due_day = FeeSettings.get_solo().fee_due_day
        if not due_day:
            return False

        payment_day = self.payment_date.day

        return payment_day > due_day

    @property
    def late_fee_amount(self):
        """
        Calculate late fee based on the number of days late, using the
        school-wide late fee rate from Fee Settings.
        """
        if not self.is_late:
            return 0

        from apps.fees.models.fee_settings import FeeSettings

        settings = FeeSettings.get_solo()
        due_day = settings.fee_due_day
        payment_day = self.payment_date.day
        days_late = payment_day - due_day

        return float(settings.late_fee_per_day) * days_late