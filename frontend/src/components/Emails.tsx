import { useEffect, useState } from "react";
import { Mail, Info } from "lucide-react";
import * as api from "../api/client";

export default function Emails() {
  const [notifications, setNotifications] = useState<api.Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getNotifications();
      setNotifications(res.data);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
      setError("Failed to load notifications. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getTypeBadge = (type: string) => {
    if (type.includes("work_order") || type.includes("ticket")) return "badge-info";
    if (type.includes("invoice") || type.includes("payment")) return "badge-warning";
    if (type.includes("incident") || type.includes("alert")) return "badge-danger";
    return "badge-info";
  };

  const formatType = (type: string) => {
    return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500">Loading emails...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-900">Emails</h2>
      </div>

      {/* Coming Soon Banner */}
      <div className="card bg-blue-50 border border-blue-200">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
            <Info className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-blue-900">Email Integration Coming Soon</h3>
            <p className="text-blue-700 mt-1">
              Your notification emails are sent automatically when work orders and invoices are
              updated. Full email composition and management is coming in a future update.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Recent Notifications */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Mail className="w-5 h-5 text-gray-500" />
          <h3 className="text-lg font-semibold text-gray-900">Recent Notifications</h3>
          <span className="badge badge-info">{notifications.length}</span>
        </div>

        {notifications.length === 0 ? (
          <div className="card text-center py-12">
            <Mail className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No notifications yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className={`card p-4 ${!notif.isRead ? "border-l-4 border-l-blue-500" : ""}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`badge text-xs ${getTypeBadge(notif.type)}`}>
                        {formatType(notif.type)}
                      </span>
                      {!notif.isRead && (
                        <span className="w-2 h-2 bg-blue-500 rounded-full inline-block" title="Unread" />
                      )}
                    </div>
                    <p className="font-medium text-gray-900">{notif.title}</p>
                    <p className="text-sm text-gray-600 mt-1">{notif.message}</p>
                  </div>
                  <div className="text-xs text-gray-400 flex-shrink-0 text-right">
                    <p>{new Date(notif.createdAt).toLocaleDateString()}</p>
                    <p className="mt-0.5">
                      {new Date(notif.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
