from apps.notifications.models import Notification


def notify(
    *,
    message,
    title="",
    category="GENERAL",
    link="",
    actor=None,
    recipient=None,
    recipient_role=None,
):
    """Create a single notification. Use the role-based helpers below
    for the common case of notifying everyone in a role."""
    return Notification.objects.create(
        recipient=recipient,
        recipient_role=recipient_role or "",
        actor=actor,
        category=category,
        title=title or message[:50],
        message=message,
        link=link,
    )


def notify_admins(**kwargs):
    return notify(recipient_role="ADMIN", **kwargs)


def notify_operators(**kwargs):
    return notify(recipient_role="OPERATOR", **kwargs)