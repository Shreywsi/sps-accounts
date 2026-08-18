import uuid

from django.db import models

from apps.students.models.student import Student


class CustomFieldDefinition(models.Model):
    FIELD_TYPES = [
        ("text", "Text"),
        ("number", "Number"),
        ("date", "Date"),
    ]

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    name = models.CharField(
        max_length=100,
        unique=True,
    )

    field_type = models.CharField(
        max_length=10,
        choices=FIELD_TYPES,
        default="text",
    )

    is_active = models.BooleanField(
        default=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class StudentCustomFieldValue(models.Model):
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    student = models.ForeignKey(
        Student,
        on_delete=models.CASCADE,
        related_name="custom_values",
    )

    field = models.ForeignKey(
        CustomFieldDefinition,
        on_delete=models.CASCADE,
        related_name="values",
    )

    value = models.TextField(
        blank=True,
    )

    class Meta:
        unique_together = ("student", "field")

    def __str__(self):
        return f"{self.student} - {self.field.name}: {self.value}"