import uuid
from django.conf import settings
from django.db import models
from cloudinary.models import CloudinaryField
from django.utils import timezone

from apps.students.models import Student


class SimplePayment(models.Model):
    """Simplified payment model linked directly to students"""
    
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

    # For additional fees, store the fee name
    additional_fee_name = models.CharField(
        max_length=100,
        blank=True,
        help_text="Name of additional fee if payment_type is ADDITIONAL"
    )

    notes = models.TextField(
        blank=True,
    )

    # Admin review status
    STATUS_CHOICES = [
        ("PENDING", "Pending Review"),
        ("APPROVED", "Approved"),
        ("REJECTED", "Rejected"),
    ]

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

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        ordering = ["-payment_date", "-created_at"]

    def __str__(self):
        return f"{self.student.admission_no} - {self.payment_type} - {self.amount}"

    @property
    def is_late(self):
        """Check if payment was made after due date"""
        if not self.student.fee_due_day:
            return False
        
        due_day = self.student.fee_due_day
        payment_day = self.payment_date.day
        
        # Consider it late if payment is made after the due day
        return payment_day > due_day

    @property
    def late_fee_amount(self):
        """Calculate late fee if payment is late"""
        if not self.is_late:
            return 0
        
        due_day = self.student.fee_due_day
        payment_day = self.payment_date.day
        days_late = payment_day - due_day
        
        return float(self.student.late_fee_per_day) * days_late