import { Routes, Route, Navigate, useParams } from "react-router-dom";

import Login from "../pages/Login";
import Signup from "../pages/Signup";
import ForgotPassword from "../pages/ForgotPassword";
import ResetPassword from "../pages/ResetPassword";
import Dashboard from "../pages/Dashboard";
import Students from "../pages/Students";
import PendingUsers from "../pages/PendingUsers";
import NotFound from "../pages/NotFound";
import ExpenseReports from "../pages/ExpenseReports";
import Messages from "../pages/Messages";

import ProtectedRoute from "./ProtectedRoute";

import AdminLayout from "../layouts/AdminLayout";
import OperatorLayout from "../layouts/OperatorLayout";
import RoleLayout from "../layouts/RoleLayout";

import OperatorDashboard from "../pages/operator/OperatorDashboard";
import OperatorStudents from "../pages/operator/OperatorStudents";

import OperatorLedgerSheet from '../pages/operator/OperatorLedgerSheet';
import AdminApprovals from '../pages/AdminApprovals';

import OperatorEvents from '../pages/operator/OperatorEvents';
import OperatorEventDetail from '../pages/operator/OperatorEventDetail';
import AdminEvents from '../pages/AdminEvents';
import AdminEventReview from '../pages/AdminEventReview';

import FinancialDashboard from "../features/dashboard/FinancialDashboard";
import StudentDetailWithFees from "../features/students/StudentDetailWithFees";
import FeeStructureManagement from "../pages/FeeStructureManagement";
import NewFeeCollection from "../pages/NewFeeCollection";

// /operator/students/:id used to render its own full copy of the student
// detail page. It's the same page as /students/:id (RoleLayout already
// picks the right sidebar for the logged-in role), so just forward old
// links/bookmarks to the one real route instead of keeping two copies.
function OperatorStudentRedirect() {
  const { studentId } = useParams();
  return <Navigate to={`/students/${studentId}`} replace />;
}

export default function AppRoutes() {
  return (
    <Routes>

      {/* Public Routes */}
      <Route path="/" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:uid/:token" element={<ResetPassword />} />


      {/* ================= ADMIN ROUTES ================= */}

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRole="ADMIN">
            <AdminLayout>
              <Dashboard />
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/financial-dashboard"
        element={
          <ProtectedRoute allowedRole="ADMIN">
            <AdminLayout>
              <FinancialDashboard />
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/students"
        element={
          <ProtectedRoute allowedRole="ADMIN">
            <AdminLayout>
              <Students />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/students/:studentId"
        element={
          <ProtectedRoute allowedRole={["ADMIN", "OPERATOR"]}>
            <RoleLayout>
              <StudentDetailWithFees />
            </RoleLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/pending-users"
        element={
          <ProtectedRoute allowedRole="ADMIN">
            <AdminLayout>
              <PendingUsers />
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/expenses/reports"
        element={
          <ProtectedRoute allowedRole="ADMIN">
            <AdminLayout>
              <ExpenseReports />
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/fee-structure"
        element={
          <ProtectedRoute allowedRole={["ADMIN", "OPERATOR"]}>
            <RoleLayout>
              <FeeStructureManagement />
            </RoleLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/fee-collection"
        element={
          <ProtectedRoute allowedRole={["ADMIN", "OPERATOR"]}>
            <RoleLayout>
              <NewFeeCollection />
            </RoleLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/messages"
        element={
          <ProtectedRoute allowedRole="ADMIN">
            <AdminLayout>
              <Messages />
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/events"
        element={
          <ProtectedRoute allowedRole="ADMIN">
            <AdminLayout>
              <AdminEvents />
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/events/:eventId"
        element={
          <ProtectedRoute allowedRole="ADMIN">
            <AdminLayout>
              <AdminEventReview />
            </AdminLayout>
          </ProtectedRoute>
        }
      />


      {/* ================= OPERATOR ROUTES ================= */}

      <Route
        path="/operator/dashboard"
        element={
          <ProtectedRoute allowedRole="OPERATOR">
            <OperatorLayout>
              <OperatorDashboard />
            </OperatorLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/operator/students"
        element={
          <ProtectedRoute allowedRole="OPERATOR">
            <OperatorLayout>
              <OperatorStudents />
            </OperatorLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/operator/students/:studentId"
        element={
          <ProtectedRoute allowedRole="OPERATOR">
            <OperatorStudentRedirect />
          </ProtectedRoute>
        }
      />

      <Route
        path="/operator/expenses"
        element={
          <ProtectedRoute allowedRole="OPERATOR">
            <OperatorLayout>
              <OperatorLedgerSheet />
            </OperatorLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/operator/messages"
        element={
          <ProtectedRoute allowedRole="OPERATOR">
            <OperatorLayout>
              <Messages />
            </OperatorLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/operator/financial-dashboard"
        element={
          <ProtectedRoute allowedRole="OPERATOR">
            <OperatorLayout>
              <FinancialDashboard />
            </OperatorLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/approvals"
        element={
          <ProtectedRoute allowedRole="ADMIN">
            <AdminLayout>
              <AdminApprovals />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/operator/ledger"
        element={
          <ProtectedRoute allowedRole="OPERATOR">
            <OperatorLayout>
              <OperatorLedgerSheet />
            </OperatorLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/operator/events"
        element={
          <ProtectedRoute allowedRole="OPERATOR">
            <OperatorLayout>
              <OperatorEvents />
            </OperatorLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/operator/events/:eventId"
        element={
          <ProtectedRoute allowedRole="OPERATOR">
            <OperatorLayout>
              <OperatorEventDetail />
            </OperatorLayout>
          </ProtectedRoute>
        }
      />
      {/* 404 */}
      <Route path="*" element={<NotFound />} />


    </Routes>
  );
}