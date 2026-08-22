from django.contrib import admin

from apps.events.models import (
    Event,
    EventCategory,
    EventComment,
    EventEditRequest,
    EventEntry,
)


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ("name", "event_date", "status", "created_by", "approved_by")
    list_filter = ("status", "event_date")
    search_fields = ("name",)


@admin.register(EventCategory)
class EventCategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "event", "parent")
    list_filter = ("event",)
    search_fields = ("name",)


@admin.register(EventEntry)
class EventEntryAdmin(admin.ModelAdmin):
    list_display = ("title", "amount", "category", "entry_date", "created_by")
    list_filter = ("payment_method", "entry_date")
    search_fields = ("title",)


@admin.register(EventComment)
class EventCommentAdmin(admin.ModelAdmin):
    list_display = ("event", "entry", "author", "created_at")


@admin.register(EventEditRequest)
class EventEditRequestAdmin(admin.ModelAdmin):
    list_display = ("event", "requested_by", "status", "reviewed_by", "created_at")
    list_filter = ("status",)
    search_fields = ("event__name", "requested_by__username")