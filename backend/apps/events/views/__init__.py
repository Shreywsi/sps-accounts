from apps.events.views.event import EventViewSet
from apps.events.views.category import EventCategoryViewSet
from apps.events.views.entry import EventEntryViewSet
from apps.events.views.comment import EventCommentViewSet
from apps.events.views.edit_request import EventEditRequestViewSet

__all__ = [
    "EventViewSet",
    "EventCategoryViewSet",
    "EventEntryViewSet",
    "EventCommentViewSet",
    "EventEditRequestViewSet",
]