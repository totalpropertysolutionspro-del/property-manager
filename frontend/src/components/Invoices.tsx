import { useEffect, useState } from "react";
import { Trash2, Edit2, Plus, ExternalLink } from "lucide-react";
import * as api from "../api/client";

export default function Invoices() {
  const [invoices, setInvoices] = useState<api.Invoice[]>([]);
  const [tenants, setTenants] = useState<api.Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    tenantId: "",
    amount: 0,
    dueDate: "",
    status: "unpaid",
    sendToSquare: false,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [invoicesRes, tenantsRes] = await Promise.all([
        api.getInvoices(),
        api.getTenants(),
      ]);
      setInvoices(invoicesRes.data);
      setTenants(tenantsRes.data);
    } catch (err) {
      console.error("Failed to fetch data:", err);
      setError("Failed to load invoices. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = {
        tenantId: formData.tenantId,
        amount: formData.amount,
        dueDate: formData.dueDate,
        status: formData.status,
      };
      if (!editingId && formData.sendToSquare) {
        payload.sendToSquare = true;
      }
      if (editingId) {
        await api.updateInvoice(editingId, payload);
      } else {
        await api.createInvoice(payload);
      }
      resetForm();
      fetchData();
    } catch (err) {
      console.error("Failed to save invoice:", err);
      setError("Failed to save invoice. Please try again.");
    }
  };

  const handleEdit = (invoice: api.Invoice) => {
    setFormData({
      tenantId: invoice.tenantId,
      amount: invoice.amount,
      dueDate: invoice.dueDate ? invoice.dueDate.split("T")[0] : "",
      status: invoice.status,
      sendToSquare: false,
    });
    setEditingId(invoice.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this invoice?")) {
      try {
        await api.deleteInvoice(id);
        fetchData();
      } catch (err) {
        console.error("Failed to delete invoice:", err);
        setError("Failed to delete invoice.");
      }
    }
  };

  const resetForm = () => {
    setFormData({
      tenantId: "",
      amount: 0,
      dueDate: "",
      status: "unpaid",
      sendToSquare: false,
    });
    setShowForm(false);
    setEditingId(null);
  };

  const getTenantName = (id: string) =>
    tenants.find((t) => t.id === id)?.name || "Unknown";

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return "badge-success";
      case "overdue":
        return "badge-danger";
      default:
        return "badge-warning";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500">Loading invoices...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-900">Invoices</h2>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Create Invoice
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {showForm && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">
            {editingId ? "Edit Invoice" : "New Invoice"}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tenant <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.tenantId}
                onChange={(e) => setFormData({ ...formData, tenantId: e.target.value })}
                className="input"
                required
              >
                <option value="">Select Tenant</option>
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount ($) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })
                  }
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="input"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="input"
              >
                <option value="unpaid">Unpaid</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
            {!editingId && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="sendToSquare"
                  checked={formData.sendToSquare}
                  onChange={(e) => setFormData({ ...formData, sendToSquare: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <label htmlFor="sendToSquare" className="text-sm font-medium text-gray-700">
                  Send to Square (create Square invoice)
                </label>
              </div>
            )}
            <div className="flex gap-2">
              <button type="submit" className="btn btn-primary">
                {editingId ? "Update" : "Create"}
              </button>
              <button type="button" onClick={resetForm} className="btn btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {invoices.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500">No invoices yet. Create one to get started!</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Tenant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Due Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Square ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {getTenantName(invoice.tenantId)}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    ${invoice.amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(invoice.dueDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`badge ${getStatusBadge(invoice.status)}`}>
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {invoice.squareInvoiceId ? (
                      <span className="flex items-center gap-1 text-blue-600">
                        <ExternalLink className="w-3 h-3" />
                        {invoice.squareInvoiceId.substring(0, 12)}...
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm space-x-2">
                    <button
                      onClick={() => handleEdit(invoice)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(invoice.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
