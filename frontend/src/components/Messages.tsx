import { useEffect, useState } from "react";
import { MessageSquare, Send, ChevronDown, CheckCircle, AlertCircle, Phone } from "lucide-react";
import * as api from "../api/client";

export default function Messages() {
  const [tenants, setTenants] = useState<api.Tenant[]>([]);
  const [staff, setStaff] = useState<api.Staff[]>([]);
  const [loading, setLoading] = useState(true);

  const [to, setTo] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [sendStatus, setSendStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [sent, setSent] = useState<{ to: string; body: string; time: string }[]>([]);

  useEffect(() => {
    Promise.all([
      api.getTenants().then((r) => setTenants(r.data)),
      api.getStaff().then((r) => setStaff(r.data)),
    ]).finally(() => setLoading(false));
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!to || !body) return;
    setSending(true);
    setSendStatus(null);
    try {
      await api.sendSMSMessage({ to, body });
      setSendStatus({ type: "success", msg: `SMS sent to ${to}` });
      setSent((prev) => [{ to, body, time: new Date().toLocaleTimeString() }, ...prev]);
      setBody("");
    } catch (err: any) {
      const msg = err.response?.data?.error || "Failed to send SMS. Check Twilio settings.";
      setSendStatus({ type: "error", msg });
    } finally {
      setSending(false);
    }
  };

  const recipientOptions = [
    ...tenants.map((t) => ({ label: `${t.name} (Tenant) — ${t.phone}`, value: t.phone })),
    ...staff.map((s) => ({ label: `${s.name} (Staff) — ${s.phone}`, value: s.phone })),
  ].filter((r) => r.value);

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
        <MessageSquare className="w-7 h-7 text-blue-600" />
        <h2 className="text-3xl font-bold text-gray-900">Messages</h2>
      </div>

      {/* SMS Compose */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Send SMS</h3>
        <p className="text-sm text-gray-500 mb-4">Send a text message to a tenant or staff member via Twilio.</p>
        <form onSubmit={handleSend} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
            <div className="flex gap-2">
              <div className="relative flex-shrink-0">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="tel"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  placeholder="+1 555 000 0000"
                  className="input pl-9 w-52"
                  required
                />
              </div>
              {recipientOptions.length > 0 && (
                <div className="relative flex-1">
                  <select
                    value=""
                    onChange={(e) => { if (e.target.value) setTo(e.target.value); }}
                    className="input w-full pr-8 appearance-none cursor-pointer"
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              maxLength={1600}
              placeholder="Type your message..."
              className="input w-full resize-y"
              required
            />
            <p className="text-xs text-gray-400 mt-1 text-right">{body.length}/1600</p>
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
              {sending ? "Sending..." : "Send SMS"}
            </button>
          </div>
        </form>
      </div>

      {/* Sent log */}
      {sent.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Sent This Session</h3>
          <div className="space-y-2">
            {sent.map((m, i) => (
              <div key={i} className="card p-4 flex items-start gap-3">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-700">To: {m.to}</p>
                  <p className="text-sm text-gray-600 mt-0.5">{m.body}</p>
                </div>
                <span className="text-xs text-gray-400 flex-shrink-0">{m.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
