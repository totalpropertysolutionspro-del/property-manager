import { useEffect, useState } from "react";
import {
  Building2,
  Users,
  ClipboardList,
  AlertTriangle,
  DollarSign,
  Bell,
  TrendingUp,
  Plus,
  FileText,
} from "lucide-react";
import * as api from "../api/client";

interface DashboardProps {
  setCurrentPage: (page: string) => void;
}

interface Stats {
  properties: number;
  tenants: number;
  openTickets: number;
  activeIncidents: number;
  monthlyRevenue: number;
  overdueInvoices: number;
  pendingReminders: number;
}

export default function Dashboard({ setCurrentPage }: DashboardProps) {
  const [stats, setStats] = useState<Stats>({
    properties: 0,
    tenants: 0,
    openTickets: 0,
    activeIncidents: 0,
    monthlyRevenue: 0,
    overdueInvoices: 0,
    pendingReminders: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const [propertiesRes, tenantsRes, workOrdersRes, invoicesRes, incidentsRes, remindersRes] =
        await Promise.all([
          api.getProperties(),
          api.getTenants(),
          api.getWorkOrders(),
          api.getInvoices(),
          api.getIncidents(),
          api.getReminders(),
        ]);

      const monthlyRevenue = tenantsRes.data.reduce((sum, t) => sum + t.rentAmount, 0);
      const openTickets = workOrdersRes.data.filter(
        (w) => w.status === "open" || w.status === "in_progress"
      ).length;
      const activeIncidents = incidentsRes.data.filter(
        (i) => i.status === "open" || i.status === "investigating"
      ).length;
      const overdueInvoices = invoicesRes.data.filter((i) => i.status === "overdue").length;
      const pendingReminders = remindersRes.data.filter((r) => r.status === "pending").length;

      setStats({
        properties: propertiesRes.data.length,
        tenants: tenantsRes.data.length,
        openTickets,
        activeIncidents,
        monthlyRevenue,
        overdueInvoices,
        pendingReminders,
      });
    } catch (err) {
      console.error("Failed to fetch stats:", err);
      setError("Failed to load dashboard data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card text-center py-12">
        <p className="text-red-600 mb-4">{error}</p>
        <button onClick={fetchStats} className="btn btn-primary">
          Retry
        </button>
      </div>
    );
  }

  const statCards = [
    {
      label: "Total Properties",
      value: stats.properties,
      icon: Building2,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Active Tenants",
      value: stats.tenants,
      icon: Users,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      label: "Open Tickets",
      value: stats.openTickets,
      icon: ClipboardList,
      color: "text-yellow-600",
      bg: "bg-yellow-50",
    },
    {
      label: "Active Incidents",
      value: stats.activeIncidents,
      icon: AlertTriangle,
      color: "text-red-600",
      bg: "bg-red-50",
    },
    {
      label: "Monthly Revenue",
      value: `$${stats.monthlyRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "Overdue Invoices",
      value: stats.overdueInvoices,
      icon: TrendingUp,
      color: stats.overdueInvoices > 0 ? "text-red-600" : "text-gray-600",
      bg: stats.overdueInvoices > 0 ? "bg-red-50" : "bg-gray-50",
    },
    {
      label: "Pending Reminders",
      value: stats.pendingReminders,
      icon: Bell,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-gray-500 mt-1">Welcome back to Total Property Solutions Pro</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="card">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">{card.label}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{card.value}</p>
                </div>
                <div className={`${card.bg} p-2 rounded-lg`}>
                  <Icon className={`w-6 h-6 ${card.color}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setCurrentPage("tickets")}
              className="btn btn-primary flex items-center gap-2 justify-center"
            >
              <Plus className="w-4 h-4" />
              Create Ticket
            </button>
            <button
              onClick={() => setCurrentPage("tenants")}
              className="btn btn-secondary flex items-center gap-2 justify-center"
            >
              <Users className="w-4 h-4" />
              Add Tenant
            </button>
            <button
              onClick={() => setCurrentPage("invoices")}
              className="btn btn-secondary flex items-center gap-2 justify-center"
            >
              <FileText className="w-4 h-4" />
              New Invoice
            </button>
            <button
              onClick={() => setCurrentPage("incidents")}
              className="btn btn-secondary flex items-center gap-2 justify-center"
            >
              <AlertTriangle className="w-4 h-4" />
              Report Incident
            </button>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System Status</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 text-sm">Database</span>
              <span className="badge badge-success">Connected</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 text-sm">API Server</span>
              <span className="badge badge-success">Running</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 text-sm">Email Service</span>
              <span className="badge badge-info">Configured</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 text-sm">Square Integration</span>
              <span className="badge badge-info">Configured</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
