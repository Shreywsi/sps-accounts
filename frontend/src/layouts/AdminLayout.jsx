import { useState } from "react";
import AdminSidebar from "../components/layout/AdminSidebar";
import Navbar from "../components/layout/Navbar";

export default function AdminLayout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-50">

      <AdminSidebar isOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      {/* overlay for mobile when sidebar is open */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/40 z-30"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col relative z-0">

        <Navbar onToggleSidebar={() => setMobileOpen((s) => !s)} />

        <main className="flex-1 p-4 md:p-6 overflow-auto">
          {children}
        </main>

      </div>

    </div>
  );
}
