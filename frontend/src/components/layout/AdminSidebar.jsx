import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  LayoutDashboard,
  Users,
  UserCheck,
  LogOut,
  X,
  Receipt,
  MessageSquare,
  ClipboardCheck,
  FolderKanban,
} from "lucide-react";

const menu = [
  { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { name: "Students", path: "/students", icon: Users },
  { name: "Expense Reports", path: "/expenses/reports", icon: Receipt },
  { name: "Events", path: "/admin/events", icon: FolderKanban },
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
        fixed md:sticky
        top-0 left-0
        z-40
        w-64
        h-screen
        bg-white
        px-4 md:px-5
        py-4 md:py-6
        transform transition-transform duration-200 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        md:translate-x-0
        flex flex-col
        border-r
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


      <nav className="space-y-1 flex-1 overflow-y-auto">

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

      <div className="pt-5 border-t mt-auto">

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-md hover:bg-gray-100"
        >

          <LogOut size={18}/>

          <span className="hidden md:inline">Logout</span>

        </button>

      </div>
    </aside>
  );
}