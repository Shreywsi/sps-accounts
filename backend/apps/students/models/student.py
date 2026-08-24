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

    # Fee Tracking
    FEE_STATUS_CHOICES = [
        ("UNPAID", "Unpaid"),
        ("PARTIAL", "Partial"),
        ("PAID", "Paid"),
    ]

    annual_fee_paid = models.BooleanField(
        default=False,
        help_text="Whether annual fee has been paid for current year"
    )

    total_fee_due = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        help_text="Total fee amount due (calculated automatically)"
    )

    total_fee_paid = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        help_text="Total fee amount paid (excluding annual fee)"
    )

    fee_status = models.CharField(
        max_length=20,
        choices=FEE_STATUS_CHOICES,
        default="UNPAID",
        help_text="Payment status"
    )

    last_payment_date = models.DateField(
        null=True,
        blank=True,
        help_text="Date of last payment"
    )

    next_payment_due = models.DateField(
        null=True,
        blank=True,
        help_text="Next payment due date"
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

    @property
    def fee_balance(self):
        """Calculate remaining fee balance (excluding annual fee)"""
        return self.total_fee_due - self.total_fee_paid

    @property
    def payment_progress(self):
        """Calculate payment progress percentage (excluding annual fee)"""
        if self.total_fee_due == 0:
            return 0
        return (self.total_fee_paid / self.total_fee_due) * 100

    @property
    def late_fee_due(self):
        """Calculate late fee based on payment due date"""
        from datetime import date
        if not self.fee_due_day:
            return 0
        
        today = date.today()
        due_day = self.fee_due_day
        
        # Calculate last due date
        if today.day > due_day:
            # Payment is late this month
            last_due_date = date(today.year, today.month, due_day)
            days_late = (today - last_due_date).days
        else:
            # Payment not yet due this month
            days_late = 0
        
        if days_late > 0:
            return days_late * float(self.late_fee_per_day)
        return 0

    def calculate_total_fee_due(self):
        """Calculate total fee due based on monthly recurring fees only"""
        # Only calculate monthly recurring fees (monthly_fee + cab_fee + additional monthly fees)
        total = self.total_monthly_fee
        return total

    def update_fee_status(self):
        """Update fee status based on payments (excluding annual fee)"""
        if self.total_fee_paid >= self.total_fee_due:
            self.fee_status = "PAID"
        elif self.total_fee_paid > 0:
            self.fee_status = "PARTIAL"
        else:
            self.fee_status = "UNPAID"

    def save(self, *args, **kwargs):
        # Calculate total fee due if not set (monthly recurring fees only)
        if self.total_fee_due == 0:
            self.total_fee_due = self.calculate_total_fee_due()
        
        # Update fee status
        self.update_fee_status()
        
        super().save(*args, **kwargs)