from django.contrib import admin
from .models import ActivityLog


@admin.register(ActivityLog)
class ActivityLogAdmin(admin.ModelAdmin):
    list_display = ["timestamp", "actor", "actor_role", "action_type", "target_description"]
    list_filter = ["action_type", "actor_role", "timestamp"]
    search_fields = ["description", "target_description", "actor__username"]
    readonly_fields = ["timestamp", "ip_address", "user_agent"]
    date_hierarchy = "timestamp"