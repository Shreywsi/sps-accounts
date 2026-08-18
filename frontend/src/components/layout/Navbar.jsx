import { Languages, Bell, CircleUserRound, Menu } from "lucide-react";

export default function Navbar({ onToggleSidebar = () => {} }) {
  return (
    <header
      className={
        `
      h-16
      bg-white
      border-b
      px-4 md:px-8
      flex
      items-center
      justify-between
      sticky
      top-0
      z-20
      `
      }
    >
      <div className="flex items-center gap-3">
        <button
          className="md:hidden p-2 rounded-md text-gray-700"
          onClick={onToggleSidebar}
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>

        <div>
          <h1 className="text-xl font-semibold text-gray-800">
            Dashboard
          </h1>

          <p className="text-sm text-gray-500">
            School Financial Overview
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4 md:gap-6">
        <button
          className="
          flex
          items-center
          gap-2
          text-sm
          text-gray-600
          hover:text-blue-600
          "
        >
          <Languages size={18} />
          English
        </button>

        <Bell
          size={19}
          className="text-gray-500 cursor-pointer"
        />

        <div className="flex items-center gap-2">
          <CircleUserRound
            size={24}
            className="text-gray-500"
          />

          <div>
            <p className="text-sm font-medium">
              Admin
            </p>

            <p className="text-xs text-gray-500">
              Administrator
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}