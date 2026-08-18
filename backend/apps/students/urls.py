from django.urls import path
from rest_framework.routers import DefaultRouter

from apps.students.views import StudentViewSet, CustomFieldDefinitionViewSet
from apps.students.views.search import StudentSearchView

router = DefaultRouter()

router.register(
    r"students",
    StudentViewSet,
    basename="students",
)

router.register(
    r"custom-fields",
    CustomFieldDefinitionViewSet,
    basename="custom-fields",
)

urlpatterns = [
    path(
        "search/",
        StudentSearchView.as_view(),
    ),
]

urlpatterns += router.urls