from rest_framework.routers import DefaultRouter

from apps.events.views import (
    EventCategoryViewSet,
    EventCommentViewSet,
    EventEntryViewSet,
    EventViewSet,
)

router = DefaultRouter()

router.register("events", EventViewSet, basename="events")
router.register("categories", EventCategoryViewSet, basename="event-categories")
router.register("entries", EventEntryViewSet, basename="event-entries")
router.register("comments", EventCommentViewSet, basename="event-comments")

urlpatterns = router.urls
