import axios from "axios";

const API_BASE = import.meta.env.DEV ? "http://localhost:5001/api" : "/api";

const client = axios.create({ baseURL: API_BASE });

// Auth interceptor — attach token to every request
client.interceptors.request.use((config) => {
  const token = localStorage.getItem("tps_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-logout on 401
client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("tps_token");
      localStorage.removeItem("tps_user");
      window.location.reload();
    }
    return Promise.reject(err);
  }
);

// === TYPES ===

export interface Property {
  id: string; name: string; address: string; type: string; units: number; status: string; createdAt: string; updatedAt: string;
}
export interface Tenant {
  id: string; name: string; email: string; phone: string; propertyId: string; unit: string; leaseStart: string; leaseEnd: string; rentAmount: number; createdAt: string; updatedAt: string;
}
export interface WorkOrder {
  id: string; title: string; propertyId: string; priority: string; status: string; assignedStaffId?: string; notes?: string; createdAt: string; updatedAt: string;
}
export interface Invoice {
  id: string; tenantId: string; amount: number; dueDate: string; status: string; squareInvoiceId?: string; createdAt: string; updatedAt: string;
}
export interface Staff {
  id: string; name: string; role: string; phone: string; email: string; createdAt: string; updatedAt: string;
}
export interface Contact {
  id: string; name: string; email: string; phone: string; company?: string; type: string; notes?: string; createdAt: string; updatedAt: string;
}
export interface Vendor {
  id: string; companyName: string; contactPerson: string; email: string; phone: string; serviceType: string; insuranceOnFile: boolean; notes?: string; rating?: number; createdAt: string; updatedAt: string;
}
export interface Incident {
  id: string; title: string; propertyId: string; type: string; severity: string; status: string; reportedBy: string; description?: string; dateReported: string; dateResolved?: string; createdAt: string; updatedAt: string;
}
export interface Reminder {
  id: string; title: string; description?: string; dueDate: string; type: string; status: string; relatedTo?: string; calendarEventId?: string; createdAt: string; updatedAt: string;
}
export interface FileRecord {
  id: string; name: string; type: string; url: string; size?: number; relatedTo?: string; uploadedBy?: string; notes?: string; createdAt: string; updatedAt: string;
}
export interface Notification {
  id: string; type: string; title: string; message: string; isRead: boolean; createdAt: string;
}
export interface AuthUser {
  id: string; name: string; email: string; role: string;
}

// === AUTH ===
export const login = (email: string, password: string) => client.post<{ token: string; user: AuthUser }>("/auth/login", { email, password });
export const register = (data: { name: string; email: string; password: string; role?: string }) => client.post<{ token: string; user: AuthUser }>("/auth/register", data);
export const getMe = () => client.get<AuthUser>("/auth/me");

// === CRUD HELPERS ===
export const getProperties = () => client.get<Property[]>("/properties");
export const createProperty = (d: any) => client.post<Property>("/properties", d);
export const updateProperty = (id: string, d: any) => client.put<Property>(`/properties/${id}`, d);
export const deleteProperty = (id: string) => client.delete(`/properties/${id}`);

export const getTenants = () => client.get<Tenant[]>("/tenants");
export const createTenant = (d: any) => client.post<Tenant>("/tenants", d);
export const updateTenant = (id: string, d: any) => client.put<Tenant>(`/tenants/${id}`, d);
export const deleteTenant = (id: string) => client.delete(`/tenants/${id}`);

export const getWorkOrders = () => client.get<WorkOrder[]>("/work-orders");
export const createWorkOrder = (d: any) => client.post<WorkOrder>("/work-orders", d);
export const updateWorkOrder = (id: string, d: any) => client.put<WorkOrder>(`/work-orders/${id}`, d);
export const deleteWorkOrder = (id: string) => client.delete(`/work-orders/${id}`);

export const getInvoices = () => client.get<Invoice[]>("/invoices");
export const createInvoice = (d: any) => client.post<Invoice>("/invoices", d);
export const updateInvoice = (id: string, d: any) => client.put<Invoice>(`/invoices/${id}`, d);
export const deleteInvoice = (id: string) => client.delete(`/invoices/${id}`);

export const getStaff = () => client.get<Staff[]>("/staff");
export const createStaffMember = (d: any) => client.post<Staff>("/staff", d);
export const updateStaffMember = (id: string, d: any) => client.put<Staff>(`/staff/${id}`, d);
export const deleteStaffMember = (id: string) => client.delete(`/staff/${id}`);

export const getContacts = () => client.get<Contact[]>("/contacts");
export const createContact = (d: any) => client.post<Contact>("/contacts", d);
export const updateContact = (id: string, d: any) => client.put<Contact>(`/contacts/${id}`, d);
export const deleteContact = (id: string) => client.delete(`/contacts/${id}`);

export const getVendors = () => client.get<Vendor[]>("/vendors");
export const createVendor = (d: any) => client.post<Vendor>("/vendors", d);
export const updateVendor = (id: string, d: any) => client.put<Vendor>(`/vendors/${id}`, d);
export const deleteVendor = (id: string) => client.delete(`/vendors/${id}`);

export const getIncidents = () => client.get<Incident[]>("/incidents");
export const createIncident = (d: any) => client.post<Incident>("/incidents", d);
export const updateIncident = (id: string, d: any) => client.put<Incident>(`/incidents/${id}`, d);
export const deleteIncident = (id: string) => client.delete(`/incidents/${id}`);

export const getReminders = () => client.get<Reminder[]>("/reminders");
export const createReminder = (d: any) => client.post<Reminder>("/reminders", d);
export const updateReminder = (id: string, d: any) => client.put<Reminder>(`/reminders/${id}`, d);
export const deleteReminder = (id: string) => client.delete(`/reminders/${id}`);

export const getFiles = () => client.get<FileRecord[]>("/files");
export const createFile = (d: any) => client.post<FileRecord>("/files", d);
export const updateFile = (id: string, d: any) => client.put<FileRecord>(`/files/${id}`, d);
export const deleteFile = (id: string) => client.delete(`/files/${id}`);

export const getNotifications = () => client.get<Notification[]>("/notifications");
export const getUnreadNotifications = () => client.get<Notification[]>("/notifications?unread=true");
export const getUnreadCount = () => client.get<{ count: number }>("/notifications/unread/count");
export const markAsRead = (id: string) => client.put(`/notifications/${id}/read`);
export const markAllAsRead = () => client.put("/notifications/all/read");
