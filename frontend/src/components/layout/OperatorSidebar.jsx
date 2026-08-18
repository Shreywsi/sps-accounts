import {
  LayoutDashboard,
  Users,
  LogOut,
} from "lucide-react";

import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const menu = [
  {
    name: "Dashboard",
    path: "/operator/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Students",
    path: "/operator/students",
    icon: Users,
  },
];

export default function OperatorSidebar() {

  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <aside className="w-64 h-screen sticky top-0 border-r bg-white px-5 py-6 flex flex-col">

      <div className="mb-10">
        <h1 className="text-xl font-semibold">
          SPS Accounts
        </h1>

        <p className="text-sm text-gray-500">
          Operator Panel
        </p>
      </div>

      <nav className="space-y-1 flex-1">

        {menu.map((item) => {

          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm ${
                  isActive
                    ? "bg-blue-50 text-blue-600"
                    : "hover:bg-gray-100"
                }`
              }
            >
              <Icon size={18} />
              {item.name}
            </NavLink>
          );

        })}

      </nav>

      <div className="pt-5 border-t">

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-md hover:bg-gray-100"
        >
          <LogOut size={18} />
          Logout
        </button>

      </div>

    </aside>
  );
}