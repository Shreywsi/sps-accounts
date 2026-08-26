import { useAuth } from "../context/AuthContext";
import AdminLayout from "./AdminLayout";
import OperatorLayout from "./OperatorLayout";

/**
 * Wraps a page in whichever layout (sidebar + navbar) matches the
 * logged-in user's role. Use this for any route that both ADMIN and
 * OPERATOR can visit (e.g. /fee-structure, /fee-collection,
 * /students/:studentId) instead of declaring the same <Route> twice
 * with two different hard-coded layouts - that duplication is what
 * caused operators to be served the admin sidebar (with admin-only
 * links) and get bounced back to the login page when they clicked one.
 */
export default function RoleLayout({ children }) {
  const { user } = useAuth();

  if (user?.role === "OPERATOR") {
    return <OperatorLayout>{children}</OperatorLayout>;
  }

  return <AdminLayout>{children}</AdminLayout>;
}
