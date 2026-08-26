from django.contrib import admin

from apps.fees.models import (
    FeeCategory,
    FeeStructure,
    FeeStructureItem,
    Payment,
    StudentFee,
    FeeSession,
    FeeCategoryGroup,
    FeeHead,
    UniformFeeItem,
    ClassFeeMapping,
    StudentFeeAssignment,
)

@admin.register(FeeSession)
class FeeSessionAdmin(admin.ModelAdmin):
    list_display = ["session_label", "is_active", "start_date", "end_date"]
    list_filter = ["is_active"]
    search_fields = ["session_label"]

@admin.register(FeeCategoryGroup)
class FeeCategoryGroupAdmin(admin.ModelAdmin):
    list_display = ["name", "session", "boarding_type", "applicable_class_range"]
    list_filter = ["session", "boarding_type"]
    search_fields = ["name", "applicable_class_range"]

@admin.register(FeeHead)
class FeeHeadAdmin(admin.ModelAdmin):
    list_display = ["label", "group", "frequency", "amount", "annual_equivalent", "is_mandatory", "is_active"]
    list_filter = ["group", "frequency", "is_mandatory", "is_active", "editable_by"]
    search_fields = ["label", "notes"]

@admin.register(UniformFeeItem)
class UniformFeeItemAdmin(admin.ModelAdmin):
    list_display = ["item_name", "session", "gender", "price", "is_active"]
    list_filter = ["session", "gender", "is_active"]
    search_fields = ["item_name"]

@admin.register(ClassFeeMapping)
class ClassFeeMappingAdmin(admin.ModelAdmin):
    list_display = ["class_name", "session", "day_scholar_group", "hostel_group"]
    list_filter = ["session"]
    search_fields = ["class_name"]

@admin.register(StudentFeeAssignment)
class StudentFeeAssignmentAdmin(admin.ModelAdmin):
    list_display = ["student", "session", "boarding_type", "created_from_template", "last_modified_at"]
    list_filter = ["session", "boarding_type", "created_from_template"]
    search_fields = ["student__admission_no", "student__first_name", "student__last_name"]

admin.site.register(FeeCategory)
admin.site.register(FeeStructure)
admin.site.register(FeeStructureItem)
admin.site.register(StudentFee)
admin.site.register(Payment)