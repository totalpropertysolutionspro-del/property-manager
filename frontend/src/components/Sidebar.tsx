import {
  LayoutDashboard,
  Building2,
  Users,
  ClipboardList,
  AlertTriangle,
  DollarSign,
  Truck,
  BookUser,
  UserCog,
  CalendarDays,
  FolderOpen,
  Bell,
  Mail,
} from "lucide-react";

interface SidebarProps {
  currentPage: string;
  setCurrentPage: (page: string) => void;
}

const mainItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "properties", label: "Properties", icon: Building2 },
  { id: "tenants", label: "Tenants", icon: Users },
  { id: "tickets", label: "Tickets", icon: ClipboardList },
  { id: "incidents", label: "Incidents", icon: AlertTriangle },
  { id: "invoices", label: "Invoices", icon: DollarSign },
  { id: "vendors", label: "Vendors", icon: Truck },
  { id: "contacts", label: "Contacts", icon: BookUser },
  { id: "staff", label: "Staff", icon: UserCog },
];

const toolItems = [
  { id: "calendar", label: "Calendar", icon: CalendarDays },
  { id: "files", label: "Files", icon: FolderOpen },
  { id: "reminders", label: "Reminders", icon: Bell },
  { id: "emails", label: "Emails", icon: Mail },
];

export default function Sidebar({ currentPage, setCurrentPage }: SidebarProps) {
  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col h-full">
      {/* Header */}
      <div className="p-5 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-sm font-bold text-white leading-tight">TPS Pro</div>
            <div className="text-xs text-gray-400 leading-tight">Manager</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {mainItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              }`}
            >
              <Icon className="w-4.5 h-4.5 w-[18px] h-[18px] flex-shrink-0" />
              <span>{item.label}</span>
            </button>
          );
        })}

        {/* Divider */}
        <div className="my-3 border-t border-gray-700" />

        {toolItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              }`}
            >
              <Icon className="w-[18px] h-[18px] flex-shrink-0" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
