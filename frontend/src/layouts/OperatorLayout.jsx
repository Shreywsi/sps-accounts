import OperatorSidebar from "../components/layout/OperatorSidebar";
import Navbar from "../components/layout/Navbar";

export default function OperatorLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-gray-50">

      <OperatorSidebar />

      <div className="flex-1">

        <Navbar />

        <main className="p-6">
          {children}
        </main>

      </div>

    </div>
  );
}