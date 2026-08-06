import { Bell, UserCircle } from "lucide-react";

export default function Header() {
  return (
    <header className="h-16 bg-white border-b flex items-center justify-between px-8">
      <h1 className="text-2xl font-semibold">
        Dashboard
      </h1>

      <div className="flex items-center gap-6">
        <Bell />

        <div className="flex items-center gap-2">
          <UserCircle size={34} />
          <div>
            <p className="font-medium">Shreyasi</p>
            <p className="text-sm text-gray-500">Administrator</p>
          </div>
        </div>
      </div>
    </header>
  );
}