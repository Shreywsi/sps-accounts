# Superseded by apps.common.permissions.RolePermission + LockedAfterApproval.
# Kept only if something still imports these names during migration;
# safe to delete once transactions/views/transaction.py is confirmed
# to use the shared classes below.

from apps.common.permissions import RolePermission, LockedAfterApproval  # noqa: F401
