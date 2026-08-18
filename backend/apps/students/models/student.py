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