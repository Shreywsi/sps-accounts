from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from apps.accounts.views.auth import (
    LoginView,
    SignupView,
)
from apps.accounts.views.users import (
    PendingUsersView,
    ApprovedUsersView,
    RejectedUsersView,
    ApproveUserView,
    RevokeUserView,
)
from apps.accounts.views.password_reset import (
    ForgotPasswordView,
    ResetPasswordView,
)

urlpatterns = [
    path("login/", LoginView.as_view()),
    path("signup/", SignupView.as_view()),
    path("forgot-password/", ForgotPasswordView.as_view()),
    path("reset-password/", ResetPasswordView.as_view()),
    path(
        "users/pending/",
        PendingUsersView.as_view()
    ),
    path(
        "users/approved/",
        ApprovedUsersView.as_view()
    ),
    path(
        "users/rejected/",
        RejectedUsersView.as_view()
    ),
    path(
        "users/<uuid:user_id>/approve/",
        ApproveUserView.as_view()
    ),
    path(
        "users/<uuid:user_id>/revoke/",
        RevokeUserView.as_view()
    ),
    path(
        "refresh/",
        TokenRefreshView.as_view(),
        name="token_refresh",
    ),
]