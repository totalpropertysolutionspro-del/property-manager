import { LogOut } from "lucide-react";
import NotificationBell from "./NotificationBell";
import type { AuthUser } from "../api/client";

export default function Navbar() {
  const userRaw = localStorage.getItem("tps_user");
  const user: AuthUser | null = userRaw ? JSON.parse(userRaw) : null;

  const handleLogout = () => {
    localStorage.removeItem("tps_token");
    localStorage.removeItem("tps_user");
    window.location.reload();
  };

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0">
      <h1 className="text-lg font-semibold text-gray-900">
        Total Property Solutions Pro
      </h1>

      <div className="flex items-center gap-4">
        <NotificationBell />

        {user && (
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-medium text-gray-900">{user.name}</div>
              <div className="text-xs text-gray-500 capitalize">{user.role}</div>
            </div>
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
              {user.name?.charAt(0).toUpperCase() || "U"}
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-600 transition-colors"
          title="Log out"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}
