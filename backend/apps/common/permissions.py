from rest_framework.permissions import SAFE_METHODS, BasePermission


class RolePermission(BasePermission):
    """
    Single declarative permission class for every viewset in the project.

    Set `roles_required` as a dict on the view mapping HTTP method -> tuple
    of allowed roles. Methods not listed are open to any authenticated user.

        class TransactionViewSet(viewsets.ModelViewSet):
            permission_classes = [RolePermission]
            roles_required = {
                "PATCH": ("ADMIN", "OPERATOR"),
                "DELETE": ("ADMIN",),
            }

    This replaces IsAdminOrReadOnly, IsOperatorOrAdmin, IsAdminRole,
    IsAdminOrCreateOnly, IsAuthenticatedColumnManager, IsAdminOrOperator,
    etc. The policy becomes data on the view instead of a new class per app.
    """

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False

        roles_required = getattr(view, "roles_required", {})
        allowed = roles_required.get(request.method)

        if allowed is None:
            return True

        return request.user.role in allowed


class LockedAfterApproval(BasePermission):
    """
    Object-level guard: once a record's status is in `locked_statuses`,
    only ADMIN may write to it, regardless of which fields are touched
    or which viewset/action is used.

    DRF calls has_object_permission() automatically for retrieve, update,
    partial_update and destroy on any view whose get_object() calls
    check_object_permissions() (all ModelViewSet actions do this by
    default), so this fires on every PATCH/PUT/DELETE without the view
    needing to remember to check it manually.

    Attach it alongside RolePermission:

        permission_classes = [RolePermission, LockedAfterApproval]
    """

    locked_statuses = ("APPROVED",)
    status_field = "status"

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True

        if request.user.role == "ADMIN":
            return True

        current_status = getattr(obj, self.status_field, None)
        return current_status not in self.locked_statuses