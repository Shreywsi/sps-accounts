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


class IsAdminOrOperator(BasePermission):
    """
    Allow access to both admin and operator roles for common operations
    """

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role in ["ADMIN", "OPERATOR"]
        )

    def has_object_permission(self, request, view, obj):
        # Allow both admin and operator to perform any action on student objects
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role in ["ADMIN", "OPERATOR"]
        )


class IsAdminOrCreateOnly(BasePermission):
    """
    Custom field definitions are shared: both roles need to read them,
    and operators need to create new ones on the fly while filling out
    a student form. Operators may also hide a field from forms, while only
    an ADMIN should be able to edit, reactivate, or delete a definition.
    """

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False

        if request.method in ("GET", "HEAD", "OPTIONS", "POST"):
            return True

        if (
            request.method == "PATCH"
            and request.data.get("is_active") is False
            and set(request.data.keys()) == {"is_active"}
        ):
            return True

        return request.user.role == "ADMIN"