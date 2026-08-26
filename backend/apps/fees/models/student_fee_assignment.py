import json
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class StudentFeeAssignment(models.Model):
    """Per-student fee assignment snapshot"""
    BOARDING_CHOICES = [
        ("day_scholar", "Day Scholar"),
        ("hostel", "Hostel/Boarding"),
    ]

    student = models.ForeignKey(
        "students.Student",
        on_delete=models.CASCADE,
        related_name="fee_assignments"
    )
    session = models.ForeignKey(
        "fees.FeeSession",
        on_delete=models.PROTECT,
        related_name="student_assignments"
    )
    boarding_type = models.CharField(
        max_length=20,
        choices=BOARDING_CHOICES,
        default="day_scholar"
    )
    fee_heads = models.JSONField(
        default=list,
        help_text="JSON array of fee heads copied from FeeHead at assignment time"
    )
    uniform_selection = models.JSONField(
        default=dict,
        blank=True,
        help_text="JSON: {gender, items: [{name, price, selected}]}"
    )
    transportation_fee = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Transportation fee if applicable"
    )
    created_from_template = models.BooleanField(
        default=True,
        help_text="Whether this was created from a fee structure template"
    )
    last_modified_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name="modified_fee_assignments"
    )
    last_modified_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-session__start_date", "student"]
        unique_together = ["student", "session"]

    def __str__(self):
        return f"{self.student} - {self.session} ({self.get_boarding_type_display()})"

    def calculate_total_one_time(self):
        """Calculate total one-time fees"""
        total = 0
        for head in self.fee_heads:
            if head.get("frequency") == "one_time" and head.get("is_active", True):
                total += float(head.get("amount", 0))
        return total

    def calculate_total_annual(self):
        """Calculate total annual fees"""
        total = 0
        for head in self.fee_heads:
            if head.get("frequency") == "yearly" and head.get("is_active", True):
                total += float(head.get("amount", 0))
        return total

    def calculate_monthly_tuition(self):
        """Calculate monthly tuition fees"""
        total = 0
        for head in self.fee_heads:
            if head.get("frequency") == "monthly" and head.get("is_active", True):
                total += float(head.get("amount", 0))
        return total

    def calculate_uniform_total(self):
        """Calculate uniform total based on selection"""
        if not self.uniform_selection:
            return 0
        total = 0
        for item in self.uniform_selection.get("items", []):
            if item.get("selected", False):
                total += float(item.get("price", 0))
        return total

    def calculate_total_package(self):
        """Calculate total package including one-time, annual, and uniform"""
        return (
            self.calculate_total_one_time() +
            self.calculate_total_annual() +
            self.calculate_uniform_total()
        )
