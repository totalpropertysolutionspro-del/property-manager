import { useEffect, useState } from "react";
import { Mail, Send, ChevronDown, CheckCircle, AlertCircle } from "lucide-react";
import * as api from "../api/client";

export default function Emails() {
  const [notifications, setNotifications] = useState<api.Notification[]>([]);
  const [tenants, setTenants] = useState<api.Tenant[]>([]);
  const [staff, setStaff] = useState<api.Staff[]>([]);
  const [loading, setLoading] = useState(true);

  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [sendStatus, setSendStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  useEffect(() => {
    Promise.all([
      api.getNotifications().then((r) => setNotifications(r.data)),
      api.getTenants().then((r) => setTenants(r.data)),
      api.getStaff().then((r) => setStaff(r.data)),
    ]).finally(() => setLoading(false));
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!to || !subject || !body) return;
    setSending(true);
    setSendStatus(null);
    try {
      await api.sendEmailMessage({ to, subject, body });
      setSendStatus({ type: "success", msg: `Email sent to ${to}` });
      setSubject("");
      setBody("");
    } catch (err: any) {
      const msg = err.response?.data?.error || "Failed to send email. Check SMTP settings.";
      setSendStatus({ type: "error", msg });
    } finally {
      setSending(false);
    }
  };

  const recipientOptions = [
    ...tenants.map((t) => ({ label: `${t.name} (Tenant)`, value: t.email })),
    ...staff.map((s) => ({ label: `${s.name} (Staff)`, value: s.email })),
  ];

  const getTypeBadge = (type: string) => {
    if (type.includes("work_order") || type.includes("ticket")) return "badge-info";
    if (type.includes("invoice") || type.includes("payment")) return "badge-warning";
    if (type.includes("incident") || type.includes("alert")) return "badge-danger";
    return "badge-info";
  };

  const formatType = (type: string) =>
    type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Mail className="w-7 h-7 text-blue-600" />
        <h2 className="text-3xl font-bold text-gray-900">Emails</h2>
      </div>

      {/* Compose Email */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Compose Email</h3>
        <form onSubmit={handleSend} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
            <div className="flex gap-2">
              <input
                type="email"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="recipient@email.com"
                className="input flex-1"
                required
              />
              {recipientOptions.length > 0 && (
                <div className="relative">
                  <select
                    value=""
                    onChange={(e) => { if (e.target.value) setTo(e.target.value); }}
                    className="input pr-8 appearance-none cursor-pointer"
                  >
                    <option value="">Pick recipient</option>
                    {recipientOptions.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject"
              className="input w-full"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={5}
              placeholder="Write your message here..."
              className="input w-full resize-y"
              required
            />
          </div>

          {sendStatus && (
            <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
              sendStatus.type === "success"
                ? "bg-green-50 border border-green-200 text-green-700"
                : "bg-red-50 border border-red-200 text-red-700"
            }`}>
              {sendStatus.type === "success"
                ? <CheckCircle className="w-4 h-4 flex-shrink-0" />
                : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
              {sendStatus.msg}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={sending}
              className="btn btn-primary flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              {sending ? "Sending..." : "Send Email"}
            </button>
          </div>
        </form>
      </div>

      {/* Notification History */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Notification History</h3>
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
                        <span className="w-2 h-2 bg-blue-500 rounded-full inline-block" />
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
