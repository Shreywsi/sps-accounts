import {
  LayoutDashboard,
  Users,
  UserCheck,
  LogOut,
  X,
  Receipt,
  MessageSquare,
  ClipboardCheck,
} from "lucide-react";

import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const menu = [
  { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { name: "Students", path: "/students", icon: Users },
  { name: "Expense Reports", path: "/expenses/reports", icon: Receipt },
  { name: "Messages", path: "/messages", icon: MessageSquare },
  { name: "Pending Operators", path: "/pending-users", icon: UserCheck },
  { name: "Transaction Approvals", path: "/admin/approvals", icon: ClipboardCheck },
];


export default function AdminSidebar({ isOpen = false, onClose = () => {} }) {

  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <aside
      className={`
        fixed md:static
        top-0 left-0
        z-40
        w-64 md:w-64
        h-full md:h-auto
        bg-white
        px-4 md:px-5
        py-4 md:py-6
        transform transition-transform duration-200 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        md:translate-x-0 md:relative md:top-auto md:left-auto md:z-auto
        flex md:flex-col flex-col
      `}
    >

      <div className="mb-4 md:mb-10 flex items-center justify-between w-full">
        <div>
          <h1 className="text-lg md:text-xl font-semibold text-gray-900">
            SPS
          </h1>
          <p className="text-xs md:text-sm text-gray-500 hidden md:block">
            Management System
          </p>
        </div>

        {/* close button on mobile */}
        <button
          className="md:hidden p-2 rounded-md text-gray-600"
          onClick={onClose}
          aria-label="Close menu"
        >
          <X size={18} />
        </button>
      </div>


      <nav className="space-y-0 md:space-y-1 flex-1 flex md:flex-col gap-2 md:gap-0">

        {menu.map((item)=>{

          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({isActive}) =>
                  `
                  flex items-center gap-3 px-3 py-2.5
                  rounded-md text-sm transition
                  ${
                    isActive
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-700 hover:bg-gray-100"
                  }
                  `
                }
            >

              <Icon size={18}/>

              <span className="hidden md:inline">
                {item.name}
              </span>

            </NavLink>
          )

        })}

      </nav>
        <div className="pt-5 md:pt-5 border-t md:border-t mt-2 md:mt-6 w-full md:w-auto">

  <button
    onClick={handleLogout}
    className={
      `
      flex items-center gap-3 md:gap-2
      px-3 py-2.5
      text-sm md:text-sm
      text-gray-700
      hover:bg-gray-100
      rounded-md
      transition
      w-full md:w-auto
      `
    }
  >

    <LogOut size={18}/>

    <span className="hidden md:inline">Logout</span>

  </button>

</div>
    </aside>
  );
}