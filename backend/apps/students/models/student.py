import uuid
from django.conf import settings
from apps.academics.models import SchoolClass, Section
from django.db import models
from cloudinary.models import CloudinaryField


class Student(models.Model):
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    photo = CloudinaryField(
        "image",
        folder="school-accounts/students",
        null=True,
        blank=True,
    )

    admission_no = models.CharField(
        max_length=20,
        unique=True,
    )

    first_name = models.CharField(
        max_length=100,
    )

    last_name = models.CharField(
        max_length=100,
        blank=True,
    )

    school_class = models.ForeignKey(
        SchoolClass,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="students",
    )

    academic_section = models.ForeignKey(
        Section,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="students",
    )

    GENDER_CHOICES = [
        ("MALE", "Male"),
        ("FEMALE", "Female"),
        ("OTHER", "Other"),
    ]

    age = models.PositiveIntegerField(
        null=True,
        blank=True,
    )

    gender = models.CharField(
        max_length=10,
        choices=GENDER_CHOICES,
        blank=True,
    )

    roll_number = models.PositiveIntegerField()

    father_name = models.CharField(
        max_length=100,
    )

    mother_name = models.CharField(
        max_length=100,
        blank=True,
    )

    phone = models.CharField(
        max_length=15,
        blank=True,
    )

    email = models.EmailField(
        blank=True,
    )

    address = models.TextField(
        blank=True,
    )

    is_active = models.BooleanField(
        default=True,
    )

    STATUS_CHOICES = [
        ("PENDING", "Pending"),
        ("VERIFIED", "Verified"),
        ("REJECTED", "Rejected"),
    ]

    verification_status = models.CharField(
        max_length=10,
        choices=STATUS_CHOICES,
        default="PENDING",
    )
    rejection_reason = models.TextField(
        blank=True,
        default="",
        help_text="Set by the admin when rejecting a student, shown to the operator.",
    )   
    verified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="verified_students",
    )

    verified_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    # Fee Structure - Simplified
    annual_fee = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        help_text="Annual fee amount"
    )

    monthly_fee = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        help_text="Monthly fee amount"
    )

    cab_fee = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        help_text="Transport/Cab fee amount"
    )

    fee_due_day = models.PositiveIntegerField(
        default=10,
        help_text="Day of month when fee is due (e.g., 10 for 10th of every month)"
    )

    late_fee_per_day = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        default=10,
        help_text="Late fee charged per day after due date"
    )

    additional_fees = models.JSONField(
        default=dict,
        blank=True,
        help_text="Flexible additional fees (e.g., {'lab_fee': 500, 'sports_fee': 200})"
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        ordering = ["admission_no"]

    def __str__(self):
        return f"{self.admission_no} - {self.first_name} {self.last_name}"

    @property
    def total_monthly_fee(self):
        """Calculate total monthly fee including all components"""
        total = self.monthly_fee + self.cab_fee
        # Add additional fees
        if self.additional_fees:
            for fee_name, fee_amount in self.additional_fees.items():
                # Only count monthly recurring additional fees
                if not fee_name.endswith('_annual'):
                    total += fee_amount
        return total

    @property
    def total_annual_fee(self):
        """Calculate total annual fee"""
        total = self.annual_fee
        # Add annual additional fees
        if self.additional_fees:
            for fee_name, fee_amount in self.additional_fees.items():
                if fee_name.endswith('_annual'):
                    total += fee_amount
        return total