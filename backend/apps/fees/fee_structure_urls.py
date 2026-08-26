from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.fees.views.fee_structure_new import (
    FeeSessionViewSet,
    FeeCategoryGroupViewSet,
    FeeHeadViewSet,
    UniformFeeItemViewSet,
    ClassFeeMappingViewSet,
    StudentFeeAssignmentViewSet,
)

router = DefaultRouter()
router.register(r"fee-sessions", FeeSessionViewSet, basename="fee-sessions")
router.register(r"fee-category-groups", FeeCategoryGroupViewSet, basename="fee-category-groups")
router.register(r"fee-heads", FeeHeadViewSet, basename="fee-heads")
router.register(r"uniform-items", UniformFeeItemViewSet, basename="uniform-items")
router.register(r"class-mappings", ClassFeeMappingViewSet, basename="class-mappings")
router.register(r"student-fee-assignments", StudentFeeAssignmentViewSet, basename="student-fee-assignments")

urlpatterns = [
    path("", include(router.urls)),
]
