import { useEffect, useState } from "react";
import { Trash2, Edit2, Plus } from "lucide-react";
import * as api from "../api/client";

export default function Incidents() {
  const [incidents, setIncidents] = useState<api.Incident[]>([]);
  const [properties, setProperties] = useState<api.Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    propertyId: "",
    type: "other",
    severity: "medium",
    status: "open",
    reportedBy: "",
    description: "",
    dateReported: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [incidentsRes, propertiesRes] = await Promise.all([
        api.getIncidents(),
        api.getProperties(),
      ]);
      setIncidents(incidentsRes.data);
      setProperties(propertiesRes.data);
    } catch (err) {
      console.error("Failed to fetch data:", err);
      setError("Failed to load incidents. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.updateIncident(editingId, formData);
      } else {
        await api.createIncident(formData as any);
      }
      resetForm();
      fetchData();
    } catch (err) {
      console.error("Failed to save incident:", err);
      setError("Failed to save incident. Please try again.");
    }
  };

  const handleEdit = (incident: api.Incident) => {
    setFormData({
      title: incident.title,
      propertyId: incident.propertyId,
      type: incident.type,
      severity: incident.severity,
      status: incident.status,
      reportedBy: incident.reportedBy,
      description: incident.description || "",
      dateReported: incident.dateReported
        ? incident.dateReported.split("T")[0]
        : new Date().toISOString().split("T")[0],
    });
    setEditingId(incident.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this incident?")) {
      try {
        await api.deleteIncident(id);
        fetchData();
      } catch (err) {
        console.error("Failed to delete incident:", err);
        setError("Failed to delete incident.");
      }
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      propertyId: "",
      type: "other",
      severity: "medium",
      status: "open",
      reportedBy: "",
      description: "",
      dateReported: new Date().toISOString().split("T")[0],
    });
    setShowForm(false);
    setEditingId(null);
  };

  const getPropertyName = (id: string) =>
    properties.find((p) => p.id === id)?.name || "Unknown";

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "critical":
        return "badge-danger";
      case "high":
        return "badge-danger";
      case "medium":
        return "badge-warning";
      case "low":
        return "badge-info";
      default:
        return "badge-info";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "resolved":
        return "badge-success";
      case "closed":
        return "badge-success";
      case "investigating":
        return "badge-warning";
      case "open":
        return "badge-info";
      default:
        return "badge-info";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500">Loading incidents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-900">Incidents</h2>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Report Incident
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
            {editingId ? "Edit Incident" : "Report New Incident"}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Incident title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="input"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Property <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.propertyId}
                  onChange={(e) => setFormData({ ...formData, propertyId: e.target.value })}
                  className="input"
                  required
                >
                  <option value="">Select Property</option>
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reported By <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Name of reporter"
                  value={formData.reportedBy}
                  onChange={(e) => setFormData({ ...formData, reportedBy: e.target.value })}
                  className="input"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="input"
                >
                  <option value="fire">Fire</option>
                  <option value="flood">Flood</option>
                  <option value="break_in">Break In</option>
                  <option value="injury">Injury</option>
                  <option value="complaint">Complaint</option>
                  <option value="vandalism">Vandalism</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
                <select
                  value={formData.severity}
                  onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                  className="input"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="input"
                >
                  <option value="open">Open</option>
                  <option value="investigating">Investigating</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date Reported <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.dateReported}
                onChange={(e) => setFormData({ ...formData, dateReported: e.target.value })}
                className="input"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                placeholder="Describe the incident..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input"
                rows={4}
              />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="btn btn-primary">
                {editingId ? "Update" : "Submit Report"}
              </button>
              <button type="button" onClick={resetForm} className="btn btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {incidents.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500">No incidents reported. All clear!</p>
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
                  Property
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Severity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Reported By
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {incidents.map((incident) => (
                <tr key={incident.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {incident.title}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {getPropertyName(incident.propertyId)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 capitalize">
                    {incident.type.replace("_", " ")}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`badge ${getSeverityBadge(incident.severity)}`}>
                      {incident.severity}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`badge ${getStatusBadge(incident.status)}`}>
                      {incident.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{incident.reportedBy}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(incident.dateReported).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm space-x-2">
                    <button
                      onClick={() => handleEdit(incident)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(incident.id)}
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
