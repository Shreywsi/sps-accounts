import { Routes, Route } from "react-router-dom";

import Login from "../pages/Login";
import Signup from "../pages/Signup";
import Dashboard from "../pages/Dashboard";
import Students from "../pages/Students";
import PendingUsers from "../pages/PendingUsers";
import NotFound from "../pages/NotFound";
import FeeCollection from "../pages/FeeCollection";
import ExpenseReports from "../pages/ExpenseReports";
import Messages from "../pages/Messages";

import ProtectedRoute from "./ProtectedRoute";

import AdminLayout from "../layouts/AdminLayout";
import OperatorLayout from "../layouts/OperatorLayout";

import OperatorDashboard from "../pages/operator/OperatorDashboard";
import OperatorStudents from "../pages/operator/OperatorStudents";
import OperatorStudentDetail from "../pages/operator/OperatorStudentDetail";

import AdminStudentDetail from "../pages/AdminStudentDetail";
import OperatorLedgerSheet from '../pages/operator/OperatorLedgerSheet';
import AdminApprovals from '../pages/AdminApprovals';

import OperatorEvents from '../pages/operator/OperatorEvents';
import OperatorEventDetail from '../pages/operator/OperatorEventDetail';
import AdminEvents from '../pages/AdminEvents';
import AdminEventReview from '../pages/AdminEventReview';
import AdminRequests from '../pages/AdminRequests';

import Fees from "../pages/Fees";
import OperatorFeeCollection from "../pages/operator/OperatorFeeCollection";
export default function AppRoutes() {
  return (
    <Routes>

      {/* Public Routes */}
      <Route path="/" element={<Login />} />
      <Route path="/signup" element={<Signup />} />


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
          <ProtectedRoute allowedRole="ADMIN">
            <AdminLayout>
              <AdminStudentDetail />
            </AdminLayout>
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
        path="/fees/collect"
        element={
          <ProtectedRoute allowedRole="ADMIN">
            <AdminLayout>
              <FeeCollection />
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

      <Route
        path="/admin/requests"
        element={
          <ProtectedRoute allowedRole="ADMIN">
            <AdminLayout>
              <AdminRequests />
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
            <OperatorLayout>
              <OperatorStudentDetail />
            </OperatorLayout>
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
      <Route
        path="/fees/structure"
        element={
          <ProtectedRoute allowedRole="ADMIN">
            <AdminLayout>
              <Fees />
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/operator/fees/structure"
        element={
          <ProtectedRoute allowedRole="OPERATOR">
            <OperatorLayout>
              <Fees />
            </OperatorLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/operator/fees/collect"
        element={
          <ProtectedRoute allowedRole="OPERATOR">
            <OperatorLayout>
              <OperatorFeeCollection />
            </OperatorLayout>
          </ProtectedRoute>
        }
      />
      {/* 404 */}
      <Route path="*" element={<NotFound />} />


    </Routes>
  );
}