from rest_framework.permissions import BasePermission


class IsAdminRole(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == "ADMIN"
        )


def is_admin(user):
    return bool(user and user.is_authenticated and user.role == "ADMIN")


def can_edit_event(user, event):
    """
    Admin can always edit. The operator who created the event can
    edit it as long as it hasn't been approved yet — once approved
    it's locked to keep the verified record intact.
    """
    if is_admin(user):
        return True
    return event.created_by_id == user.id and event.status != event.Status.APPROVED
