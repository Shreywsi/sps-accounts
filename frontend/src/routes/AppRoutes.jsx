import { Routes, Route } from "react-router-dom";

import Login from "../pages/Login";
import Signup from "../pages/Signup";
import Dashboard from "../pages/Dashboard";
import Students from "../pages/Students";
import PendingUsers from "../pages/PendingUsers";
import NotFound from "../pages/NotFound";
import FeeCollection from "../pages/FeeCollection";

import ProtectedRoute from "./ProtectedRoute";

import AdminLayout from "../layouts/AdminLayout";
import OperatorLayout from "../layouts/OperatorLayout";

import OperatorDashboard from "../pages/operator/OperatorDashboard";
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
  path="/operator/fees"
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