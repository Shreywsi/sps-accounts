import AdminSidebar from "../components/layout/AdminSidebar";
import OperatorSidebar from "../components/layout/OperatorSidebar";
import Navbar from "../components/layout/Navbar";

import { useAuth } from "../context/AuthContext";

export default function AdminLayout({ children }) {

  const { user } = useAuth();

  return (
    <div className="flex min-h-screen bg-gray-50">

      {user?.role === "ADMIN" ? (
        <AdminSidebar />
      ) : (
        <OperatorSidebar />
      )}

      <div className="flex-1">

        <Navbar />

        <main className="p-6">
          {children}
        </main>

      </div>

    </div>
  );
}