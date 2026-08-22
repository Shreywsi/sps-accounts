from django.contrib import admin

from .models import Student, CustomFieldDefinition, StudentCustomFieldValue


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
        "total_monthly_fee",
        "total_annual_fee",
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


@admin.register(CustomFieldDefinition)
class CustomFieldDefinitionAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "field_type",
        "is_active",
        "created_at",
    )

    search_fields = (
        "name",
    )

    list_filter = (
        "field_type",
        "is_active",
    )


@admin.register(StudentCustomFieldValue)
class StudentCustomFieldValueAdmin(admin.ModelAdmin):
    list_display = (
        "student",
        "field",
        "value",
    )

    search_fields = (
        "student__admission_no",
        "student__first_name",
        "field__name",
    )

    list_filter = (
        "field",
    )