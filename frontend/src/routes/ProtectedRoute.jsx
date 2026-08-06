import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, allowedRole }) {
  const { isAuthenticated, user } = useAuth();

  // Not logged in
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Wrong role
  if (allowedRole && user?.role !== allowedRole) {
    return <Navigate to="/" replace />;
  }

  return children;
}