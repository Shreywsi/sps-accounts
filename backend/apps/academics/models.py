from django.db import models


class SchoolClass(models.Model):
    name = models.CharField(
        max_length=50,
        unique=True,
    )

    display_order = models.PositiveIntegerField(
        default=0,
    )

    is_active = models.BooleanField(
        default=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    def __str__(self):
        return self.name

class Section(models.Model):
    school_class = models.ForeignKey(
        SchoolClass,
        on_delete=models.CASCADE,
        related_name="sections",
    )

    name = models.CharField(
        max_length=10,
    )

    is_active = models.BooleanField(
        default=True,
    )

    class Meta:
        unique_together = ("school_class", "name")
        ordering = ["school_class", "name"]

    def __str__(self):
        return f"{self.school_class.name} - {self.name}"

class AcademicSession(models.Model):
    name = models.CharField(
        max_length=20,
        unique=True,
    )

    start_date = models.DateField()

    end_date = models.DateField()

    is_active = models.BooleanField(
        default=False,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    def __str__(self):
        return self.name