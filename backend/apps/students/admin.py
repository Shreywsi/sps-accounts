from django.contrib import admin

from .models import Student


@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = (
        "admission_no",
        "first_name",
        "last_name",
        "school_class",
        "academic_section",
        "roll_number",
        "phone",
        "is_active",
    )

    search_fields = (
        "admission_no",
        "first_name",
        "last_name",
        "phone",
    )

    list_filter = (
        "school_class",
        "academic_section",
        "is_active",
    )

    ordering = (
        "admission_no",
    )