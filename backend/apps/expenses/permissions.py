from rest_framework.permissions import SAFE_METHODS, BasePermission


class IsOwnerOrAdmin(BasePermission):
    """
    Expense has no status/approval workflow, so there's no 'locked
    after approval' concept here — the gap on this model was simpler
    and more basic: any authenticated user (operator or admin) could
    previously edit or delete ANY expense row, including ones created
    by someone else, because ExpenseViewSet had no permission_classes
    of its own and fell back to the project default (IsAuthenticated).

    This restricts write access to the row's creator or an admin.
    """

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        if request.user.role == "ADMIN":
            return True
        return obj.created_by_id == request.user.id