from rest_framework.routers import DefaultRouter

from apps.academics.views import (
    AcademicSessionViewSet,
    SchoolClassViewSet,
    SectionViewSet,
)

router = DefaultRouter()

router.register(
    "classes",
    SchoolClassViewSet,
    basename="classes",
)

router.register(
    "sections",
    SectionViewSet,
    basename="sections",
)

router.register(
    "sessions",
    AcademicSessionViewSet,
    basename="sessions",
)

urlpatterns = router.urls