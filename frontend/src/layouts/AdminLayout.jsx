import { useState } from "react";
import AdminSidebar from "../components/layout/AdminSidebar";
import Navbar from "../components/layout/Navbar";

export default function AdminLayout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50">

      <AdminSidebar isOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      {/* overlay for mobile when sidebar is open */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/40 z-30"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div className="flex-1 relative z-0">

        <Navbar onToggleSidebar={() => setMobileOpen((s) => !s)} />

        <main className="p-4 md:p-6">
          {children}
        </main>

      </div>

    </div>
  );
}
