from rest_framework.permissions import SAFE_METHODS, BasePermission


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


class IsAdminRole(BasePermission):
    def has_permission(self, request, view):
        return is_admin(request.user)


class EventObjectPermission(BasePermission):
    """
    Object-level guard for events:
      - Admin can always write.
      - Operator can only write to events they created, and only while
        the event isn't APPROVED yet.

    Enforced via has_object_permission, so it applies uniformly to
    update / partial_update / destroy AND any custom @action that calls
    self.get_object() (which triggers check_object_permissions()) —
    unlike the old approach where can_edit_event() was only checked
    manually inside perform_update/perform_destroy and could be
    forgotten on a new endpoint.
    """

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        return can_edit_event(request.user, obj)