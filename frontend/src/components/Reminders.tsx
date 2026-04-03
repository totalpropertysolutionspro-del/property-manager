import { useEffect, useState } from "react";
import { Trash2, Edit2, Plus, Bell } from "lucide-react";
import * as api from "../api/client";

export default function Reminders() {
  const [reminders, setReminders] = useState<api.Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    dueDate: new Date().toISOString().split("T")[0],
    type: "follow_up",
    status: "pending",
  });

  useEffect(() => {
    fetchReminders();
  }, []);

  const fetchReminders = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getReminders();
      setReminders(res.data);
    } catch (err) {
      console.error("Failed to fetch reminders:", err);
      setError("Failed to load reminders. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.updateReminder(editingId, formData);
      } else {
        await api.createReminder(formData as any);
      }
      resetForm();
      fetchReminders();
    } catch (err) {
      console.error("Failed to save reminder:", err);
      setError("Failed to save reminder. Please try again.");
    }
  };

  const handleEdit = (reminder: api.Reminder) => {
    setFormData({
      title: reminder.title,
      description: reminder.description || "",
      dueDate: reminder.dueDate ? reminder.dueDate.split("T")[0] : "",
      type: reminder.type,
      status: reminder.status,
    });
    setEditingId(reminder.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this reminder?")) {
      try {
        await api.deleteReminder(id);
        fetchReminders();
      } catch (err) {
        console.error("Failed to delete reminder:", err);
        setError("Failed to delete reminder.");
      }
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      dueDate: new Date().toISOString().split("T")[0],
      type: "follow_up",
      status: "pending",
    });
    setShowForm(false);
    setEditingId(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return "badge-success";
      case "dismissed":
        return "badge bg-gray-100 text-gray-700";
      default:
        return "badge-warning";
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "lease_renewal":
        return "badge-danger";
      case "payment":
        return "badge-warning";
      case "inspection":
        return "badge-info";
      case "maintenance":
        return "badge-warning";
      default:
        return "badge-info";
    }
  };

  const isOverdue = (dueDate: string, status: string) => {
    return status === "pending" && new Date(dueDate) < new Date();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500">Loading reminders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-900">Reminders</h2>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Reminder
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
            {editingId ? "Edit Reminder" : "New Reminder"}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Reminder title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="input"
                required
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="input"
                >
                  <option value="follow_up">Follow Up</option>
                  <option value="lease_renewal">Lease Renewal</option>
                  <option value="inspection">Inspection</option>
                  <option value="payment">Payment</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="input"
                >
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="dismissed">Dismissed</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                placeholder="Optional description..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input"
                rows={3}
              />
            </div>
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

      {reminders.length === 0 ? (
        <div className="card text-center py-12">
          <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No reminders yet. Add one to stay on top of things!</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Due Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {reminders.map((reminder) => (
                <tr
                  key={reminder.id}
                  className={`hover:bg-gray-50 ${
                    isOverdue(reminder.dueDate, reminder.status) ? "bg-red-50" : ""
                  }`}
                >
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {reminder.title}
                    {isOverdue(reminder.dueDate, reminder.status) && (
                      <span className="ml-2 badge badge-danger text-xs">Overdue</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`badge ${getTypeBadge(reminder.type)}`}>
                      {reminder.type.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(reminder.dueDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`badge ${getStatusBadge(reminder.status)}`}>
                      {reminder.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 max-w-[200px] truncate">
                    {reminder.description || <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-6 py-4 text-sm space-x-2">
                    <button
                      onClick={() => handleEdit(reminder)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(reminder.id)}
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
