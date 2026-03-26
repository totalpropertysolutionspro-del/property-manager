import { useEffect, useState } from "react";
import { Trash2, Edit2, Plus, Search, Star } from "lucide-react";
import * as api from "../api/client";

const SERVICE_TYPES = [
  "plumber",
  "electrician",
  "hvac",
  "landscaping",
  "roofer",
  "painter",
  "general contractor",
  "pest control",
  "cleaning",
  "other",
];

export default function Vendors() {
  const [vendors, setVendors] = useState<api.Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterService, setFilterService] = useState("all");
  const [formData, setFormData] = useState({
    companyName: "",
    contactPerson: "",
    email: "",
    phone: "",
    serviceType: "plumber",
    insuranceOnFile: false,
    notes: "",
    rating: 0,
  });

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const res = await api.getVendors();
      setVendors(res.data);
    } catch (error) {
      console.error("Failed to fetch vendors:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { ...formData, rating: formData.rating || undefined };
      if (editingId) {
        await api.updateVendor(editingId, payload);
      } else {
        await api.createVendor(payload as any);
      }
      resetForm();
      fetchVendors();
    } catch (error) {
      console.error("Failed to save vendor:", error);
    }
  };

  const handleEdit = (vendor: api.Vendor) => {
    setFormData({
      companyName: vendor.companyName,
      contactPerson: vendor.contactPerson,
      email: vendor.email,
      phone: vendor.phone,
      serviceType: vendor.serviceType,
      insuranceOnFile: vendor.insuranceOnFile,
      notes: vendor.notes || "",
      rating: vendor.rating || 0,
    });
    setEditingId(vendor.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this vendor?")) {
      try {
        await api.deleteVendor(id);
        fetchVendors();
      } catch (error) {
        console.error("Failed to delete vendor:", error);
      }
    }
  };

  const resetForm = () => {
    setFormData({ companyName: "", contactPerson: "", email: "", phone: "", serviceType: "plumber", insuranceOnFile: false, notes: "", rating: 0 });
    setShowForm(false);
    setEditingId(null);
  };

  const filtered = vendors.filter((v) => {
    const matchService = filterService === "all" || v.serviceType === filterService;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      v.companyName.toLowerCase().includes(q) ||
      v.contactPerson.toLowerCase().includes(q) ||
      v.email.toLowerCase().includes(q) ||
      v.serviceType.toLowerCase().includes(q);
    return matchService && matchSearch;
  });

  const renderStars = (rating: number | undefined) => {
    if (!rating) return <span className="text-gray-400 text-xs">No rating</span>;
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star
            key={s}
            className={`w-4 h-4 ${s <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return <div className="text-center py-12">Loading vendors...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-900">Vendors</h2>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Vendor
        </button>
      </div>

      {showForm && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">
            {editingId ? "Edit Vendor" : "New Vendor"}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Company Name *"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                className="input"
                required
              />
              <input
                type="text"
                placeholder="Contact Person *"
                value={formData.contactPerson}
                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                className="input"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="email"
                placeholder="Email *"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="input"
                required
              />
              <input
                type="tel"
                placeholder="Phone *"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="input"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <select
                value={formData.serviceType}
                onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
                className="input"
              >
                {SERVICE_TYPES.map((s) => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
              <select
                value={formData.rating}
                onChange={(e) => setFormData({ ...formData, rating: Number(e.target.value) })}
                className="input"
              >
                <option value={0}>No Rating</option>
                <option value={1}>★ 1</option>
                <option value={2}>★★ 2</option>
                <option value={3}>★★★ 3</option>
                <option value={4}>★★★★ 4</option>
                <option value={5}>★★★★★ 5</option>
              </select>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.insuranceOnFile}
                onChange={(e) => setFormData({ ...formData, insuranceOnFile: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-sm text-gray-700">Insurance on File</span>
            </label>
            <textarea
              placeholder="Notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="input"
              rows={3}
            />
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

      <div className="card">
        <div className="flex gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search vendors..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-9"
            />
          </div>
          <select
            value={filterService}
            onChange={(e) => setFilterService(e.target.value)}
            className="input w-52"
          >
            <option value="all">All Services</option>
            {SERVICE_TYPES.map((s) => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Service</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Insurance</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rating</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((vendor) => (
                <tr key={vendor.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{vendor.companyName}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{vendor.contactPerson}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 capitalize">{vendor.serviceType}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{vendor.email}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{vendor.phone}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${vendor.insuranceOnFile ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                      {vendor.insuranceOnFile ? "Yes" : "No"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">{renderStars(vendor.rating)}</td>
                  <td className="px-6 py-4 text-sm space-x-2">
                    <button onClick={() => handleEdit(vendor)} className="text-blue-600 hover:text-blue-900">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(vendor.id)} className="text-red-600 hover:text-red-900">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No vendors found. Add one to get started!</p>
          </div>
        )}
      </div>
    </div>
  );
}
