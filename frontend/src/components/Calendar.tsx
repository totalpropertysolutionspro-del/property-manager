import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, CalendarDays, Plus } from "lucide-react";
import * as api from "../api/client";

export default function Calendar() {
  const [reminders, setReminders] = useState<api.Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showAddForm, setShowAddForm] = useState(false);
  const [newReminder, setNewReminder] = useState({
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
      setError("Failed to load calendar data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createReminder(newReminder as any);
      setNewReminder({
        title: "",
        description: "",
        dueDate: new Date().toISOString().split("T")[0],
        type: "follow_up",
        status: "pending",
      });
      setShowAddForm(false);
      fetchReminders();
    } catch (err) {
      console.error("Failed to create reminder:", err);
      setError("Failed to create reminder.");
    }
  };

  // Calendar calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = currentDate.toLocaleString("default", { month: "long" });

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () =>
    setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () =>
    setCurrentDate(new Date(year, month + 1, 1));

  const getRemindersForDay = (day: number) => {
    return reminders.filter((r) => {
      const d = new Date(r.dueDate);
      return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
    });
  };

  const today = new Date();

  // Upcoming reminders sorted by date
  const upcomingReminders = [...reminders]
    .filter((r) => r.status === "pending" && new Date(r.dueDate) >= today)
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 10);

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "lease_renewal":
        return "badge-danger";
      case "payment":
        return "badge-warning";
      case "inspection":
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
          <p className="text-gray-500">Loading calendar...</p>
        </div>
      </div>
    );
  }

  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-900">Calendar</h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
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

      {showAddForm && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Add Reminder to Calendar</h3>
          <form onSubmit={handleAddReminder} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Reminder title"
                value={newReminder.title}
                onChange={(e) => setNewReminder({ ...newReminder, title: e.target.value })}
                className="input"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={newReminder.dueDate}
                  onChange={(e) => setNewReminder({ ...newReminder, dueDate: e.target.value })}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={newReminder.type}
                  onChange={(e) => setNewReminder({ ...newReminder, type: e.target.value })}
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
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                placeholder="Optional description..."
                value={newReminder.description}
                onChange={(e) => setNewReminder({ ...newReminder, description: e.target.value })}
                className="input"
                rows={2}
              />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="btn btn-primary">
                Add to Calendar
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-2 card">
          {/* Month Header */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={prevMonth}
              className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-semibold text-gray-900">
              {monthName} {year}
            </h3>
            <button
              onClick={nextMonth}
              className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 mb-2">
            {days.map((d) => (
              <div
                key={d}
                className="text-center text-xs font-semibold text-gray-400 uppercase py-2"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Calendar Cells */}
          <div className="grid grid-cols-7 gap-px bg-gray-200 border border-gray-200 rounded-lg overflow-hidden">
            {/* Empty cells before first day */}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="bg-gray-50 min-h-[70px] p-1" />
            ))}

            {/* Day cells */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dayReminders = getRemindersForDay(day);
              const isToday =
                today.getFullYear() === year &&
                today.getMonth() === month &&
                today.getDate() === day;

              return (
                <div
                  key={day}
                  className={`bg-white min-h-[70px] p-1 ${isToday ? "ring-2 ring-inset ring-blue-500" : ""}`}
                >
                  <div
                    className={`text-sm font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full ${
                      isToday ? "bg-blue-600 text-white" : "text-gray-700"
                    }`}
                  >
                    {day}
                  </div>
                  <div className="space-y-0.5">
                    {dayReminders.slice(0, 2).map((r) => (
                      <div
                        key={r.id}
                        className="text-xs bg-blue-100 text-blue-800 rounded px-1 truncate"
                        title={r.title}
                      >
                        {r.title}
                      </div>
                    ))}
                    {dayReminders.length > 2 && (
                      <div className="text-xs text-gray-500">
                        +{dayReminders.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming Reminders */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <CalendarDays className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Upcoming</h3>
          </div>

          {upcomingReminders.length === 0 ? (
            <p className="text-gray-500 text-sm py-4 text-center">
              No upcoming reminders
            </p>
          ) : (
            <div className="space-y-3">
              {upcomingReminders.map((r) => (
                <div
                  key={r.id}
                  className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{r.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {new Date(r.dueDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                    <span className={`badge text-xs mt-1 ${getTypeBadge(r.type)}`}>
                      {r.type.replace("_", " ")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
