from rest_framework.permissions import BasePermission


class IsAdminRole(BasePermission):
    """
    Allow access only to authenticated users with role == ADMIN.
    Used to lock down verify/reject/reopen so an operator can never
    approve their own submission by calling the API directly.
    """

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == "ADMIN"
        )


class IsAdminOrCreateOnly(BasePermission):
    """
    Custom field definitions are shared: both roles need to read them,
    and operators need to create new ones on the fly while filling out
    a student form. But only an ADMIN should be able to edit, deactivate,
    or delete a definition that everyone else relies on.
    """

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False

        if request.method in ("GET", "HEAD", "OPTIONS", "POST"):
            return True

        return request.user.role == "ADMIN"