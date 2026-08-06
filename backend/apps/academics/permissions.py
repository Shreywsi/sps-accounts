from rest_framework.permissions import BasePermission


class IsAdminOrReadOnly(BasePermission):
    """
    Allow read access to everyone authenticated.
    Allow write access only to ADMIN users.
    """

    def has_permission(self, request, view):
        if request.method in ["GET", "HEAD", "OPTIONS"]:
            return request.user and request.user.is_authenticated

        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == "ADMIN"
        )