import AdminSidebar from "../components/layout/AdminSidebar";
import Navbar from "../components/layout/Navbar";

export default function AdminLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-gray-50">

      <AdminSidebar />

      <div className="flex-1">

        <Navbar />

        <main className="p-6">
          {children}
        </main>

      </div>

    </div>
  );
}
