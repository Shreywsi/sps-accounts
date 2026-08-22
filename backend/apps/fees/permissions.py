from rest_framework.permissions import SAFE_METHODS, BasePermission


class IsAdminOrReadOnly(BasePermission):
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True

        return (
            request.user.is_authenticated
            and request.user.role == "ADMIN"
        )


class IsOperatorOrAdmin(BasePermission):
    """Operators define fee structures/categories and collect payments;
    admin verification happens via the notification feed, not by
    blocking the write itself."""

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role in ("ADMIN", "OPERATOR")
        )