from rest_framework.permissions import BasePermission


class IsAdminRole(BasePermission):
	def has_permission(self, request, view):
		return bool(
			request.user
			and request.user.is_authenticated
			and request.user.role == "ADMIN"
		)


class IsAdminOrCreateOnly(BasePermission):
	def has_permission(self, request, view):
		if not (request.user and request.user.is_authenticated):
			return False

		if request.method in ("GET", "HEAD", "OPTIONS", "POST"):
			return True

		return request.user.role == "ADMIN"
