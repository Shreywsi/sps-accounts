from apps.activity.services import log_activity


class ActivityLoggingMixin:
    """
    Drop this into any ModelViewSet to get automatic activity logging on
    create/update/partial_update/destroy, plus a helper for logging
    custom @action endpoints (approve/reject/verify/etc).

    Configure per-view:

        class TransactionViewSet(ActivityLoggingMixin, viewsets.ModelViewSet):
            activity_target_model = "Transaction"
            activity_action_map = {
                "create": "CREATE_TRANSACTION",
                "update": "UPDATE_TRANSACTION",
                "partial_update": "UPDATE_TRANSACTION",
                "destroy": "DELETE_TRANSACTION",
            }

    If activity_action_map is missing an entry for the current action,
    logging is silently skipped for that action (no crash on unmapped
    actions) so this can be adopted incrementally, view by view.
    """

    activity_target_model = None
    activity_action_map = {}

    def _describe(self, instance):
        return str(instance)

    def _log(self, action_key, instance, extra_metadata=None):
        action_type = self.activity_action_map.get(action_key)
        if not action_type:
            return

        log_activity(
            actor=self.request.user,
            action_type=action_type,
            description=f"{action_key.replace('_', ' ').title()} "
                        f"{self.activity_target_model}: {self._describe(instance)}",
            target_model=self.activity_target_model,
            target_id=getattr(instance, "pk", None),
            target_description=self._describe(instance),
            metadata=extra_metadata or {},
            request=self.request,
        )

    def perform_create(self, serializer):
        instance = serializer.save()
        self._log("create", instance)

    def perform_update(self, serializer):
        before = {
            f: getattr(serializer.instance, f, None)
            for f in getattr(self, "activity_watched_fields", [])
        }
        instance = serializer.save()
        after = {
            f: getattr(instance, f, None)
            for f in getattr(self, "activity_watched_fields", [])
        }
        changed = {
            f: {"from": str(before[f]), "to": str(after[f])}
            for f in before
            if before[f] != after[f]
        }
        self._log(
            "partial_update" if self.request.method == "PATCH" else "update",
            instance,
            extra_metadata={"changed_fields": changed} if changed else None,
        )

    def perform_destroy(self, instance):
        self._log("destroy", instance)
        instance.delete()

    def log_custom_action(self, action_key, instance, extra_metadata=None):
        """Call from inside a custom @action, e.g. approve()/reject()."""
        self._log(action_key, instance, extra_metadata)