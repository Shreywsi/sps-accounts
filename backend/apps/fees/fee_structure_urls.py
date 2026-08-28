from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.fees.views.fee_structure_new import (
    FeeSessionViewSet,
    FeeCategoryGroupViewSet,
    FeeHeadViewSet,
    UniformFeeItemViewSet,
    ClassFeeMappingViewSet,
    StudentFeeAssignmentViewSet,
    FeeSettingsView,
)

router = DefaultRouter()
router.register(r"fee-sessions", FeeSessionViewSet, basename="fee-sessions")
router.register(r"fee-category-groups", FeeCategoryGroupViewSet, basename="fee-category-groups")
router.register(r"fee-heads", FeeHeadViewSet, basename="fee-heads")
router.register(r"uniform-items", UniformFeeItemViewSet, basename="uniform-items")
router.register(r"class-mappings", ClassFeeMappingViewSet, basename="class-mappings")
router.register(r"student-fee-assignments", StudentFeeAssignmentViewSet, basename="student-fee-assignments")

urlpatterns = [
    # Singleton settings endpoint - registered before the router include so
    # it doesn't need (and can't get) a trailing /<pk>/ segment.
    path("fee-settings/", FeeSettingsView.as_view(), name="fee-settings"),
    path("", include(router.urls)),
]
