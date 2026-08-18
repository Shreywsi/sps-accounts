from django.db import models


class FormField(models.Model):
    FIELD_TYPES = [
        ("text", "Text"),
        ("number", "Number"),
        ("email", "Email"),
        ("date", "Date"),
        ("textarea", "Textarea"),
        ("select", "Select"),
        ("checkbox", "Checkbox"),
    ]

    name = models.CharField(
        max_length=100,
        unique=True,
    )

    label = models.CharField(
        max_length=100,
    )

    field_type = models.CharField(
        max_length=20,
        choices=FIELD_TYPES,
        default="text",
    )

    required = models.BooleanField(
        default=False,
    )

    options = models.TextField(
        blank=True,
        help_text="Comma separated options for select field",
    )

    order = models.PositiveIntegerField(
        default=0,
    )

    is_active = models.BooleanField(
        default=True,
    )

    def __str__(self):
        return self.label