from .models import ActivityLog


def log_activity(
    actor,
    action_type,
    description,
    target_model=None,
    target_id=None,
    target_description=None,
    metadata=None,
    request=None,
):
    """
    Service function to log user activities
    """
    ip_address = None
    user_agent = None
    
    if request:
        ip_address = get_client_ip(request)
        user_agent = request.META.get("HTTP_USER_AGENT", "")[:255] if request.META.get("HTTP_USER_AGENT") else ""
    
    ActivityLog.objects.create(
        action_type=action_type,
        description=description,
        actor=actor,
        actor_role=actor.role if actor else "UNKNOWN",
        target_model=target_model,
        target_id=target_id,
        target_description=target_description,
        ip_address=ip_address,
        user_agent=user_agent,
        metadata=metadata or {},
    )


def get_client_ip(request):
    """Extract client IP from request"""
    x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
    if x_forwarded_for:
        ip = x_forwarded_for.split(",")[0]
    else:
        ip = request.META.get("REMOTE_ADDR")
    return ip