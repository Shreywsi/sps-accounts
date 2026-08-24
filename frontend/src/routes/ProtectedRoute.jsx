import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, allowedRole }) {
  const { isAuthenticated, user } = useAuth();

  // Not logged in - only redirect if we're certain
  if (!isAuthenticated && !localStorage.getItem("accessToken")) {
    return <Navigate to="/" replace />;
  }

  // Wrong role (handle both single role and array of roles)
  if (allowedRole && user) {
    const allowedRoles = Array.isArray(allowedRole) ? allowedRole : [allowedRole];
    if (!allowedRoles.includes(user.role)) {
      return <Navigate to="/" replace />;
    }
  }

  // If user is not loaded yet but we have a token, wait for user data
  if (isAuthenticated && !user) {
    return <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>;
  }

  return children;
}