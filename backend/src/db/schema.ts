import { integer, real, text, sqliteTable } from "drizzle-orm/sqlite-core";

export const properties = sqliteTable("properties", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  type: text("type").notNull(), // "apartment", "house", "commercial"
  units: integer("units").notNull(),
  status: text("status").notNull(), // "active", "inactive", "maintenance"
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const tenants = sqliteTable("tenants", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  propertyId: text("property_id").notNull(),
  unit: text("unit").notNull(),
  leaseStart: text("lease_start").notNull(),
  leaseEnd: text("lease_end").notNull(),
  rentAmount: real("rent_amount").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const workOrders = sqliteTable("work_orders", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  propertyId: text("property_id").notNull(),
  priority: text("priority").notNull(), // "low", "medium", "high", "urgent"
  status: text("status").notNull(), // "open", "in_progress", "completed", "cancelled"
  assignedStaffId: text("assigned_staff_id"),
  notes: text("notes"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const invoices = sqliteTable("invoices", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").notNull(),
  amount: real("amount").notNull(),
  dueDate: text("due_date").notNull(),
  status: text("status").notNull(), // "paid", "unpaid", "overdue"
  squareInvoiceId: text("square_invoice_id"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const staff = sqliteTable("staff", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  role: text("role").notNull(), // "manager", "maintenance", "accountant"
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const notifications = sqliteTable("notifications", {
  id: text("id").primaryKey(),
  type: text("type").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  isRead: integer("is_read", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull(),
});

export const contacts = sqliteTable("contacts", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  company: text("company"),
  type: text("type").notNull(), // "client", "vendor", "pm", "subcontractor", "lead"
  notes: text("notes"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const vendors = sqliteTable("vendors", {
  id: text("id").primaryKey(),
  companyName: text("company_name").notNull(),
  contactPerson: text("contact_person").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  serviceType: text("service_type").notNull(),
  insuranceOnFile: integer("insurance_on_file", { mode: "boolean" }).notNull().default(false),
  notes: text("notes"),
  rating: integer("rating"), // 1-5
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const incidents = sqliteTable("incidents", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  propertyId: text("property_id"),
  type: text("type").notNull(), // "fire", "flood", "break_in", "injury", "complaint", "vandalism", "other"
  severity: text("severity").notNull(), // "low", "medium", "high", "critical"
  status: text("status").notNull(), // "open", "investigating", "resolved", "closed"
  reportedBy: text("reported_by"),
  description: text("description"),
  dateReported: text("date_reported").notNull(),
  dateResolved: text("date_resolved"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull(), // "admin", "manager", "staff"
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export type Property = typeof properties.$inferSelect;
export type NewProperty = typeof properties.$inferInsert;

export type Tenant = typeof tenants.$inferSelect;
export type NewTenant = typeof tenants.$inferInsert;

export type WorkOrder = typeof workOrders.$inferSelect;
export type NewWorkOrder = typeof workOrders.$inferInsert;

export type Invoice = typeof invoices.$inferSelect;
export type NewInvoice = typeof invoices.$inferInsert;

export type Staff = typeof staff.$inferSelect;
export type NewStaff = typeof staff.$inferInsert;

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;

export type Contact = typeof contacts.$inferSelect;
export type NewContact = typeof contacts.$inferInsert;

export type Vendor = typeof vendors.$inferSelect;
export type NewVendor = typeof vendors.$inferInsert;

export type Incident = typeof incidents.$inferSelect;
export type NewIncident = typeof incidents.$inferInsert;

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export const reminders = sqliteTable("reminders", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  dueDate: text("due_date").notNull(),
  type: text("type").notNull(), // "follow_up", "lease_renewal", "inspection", "payment", "maintenance", "custom"
  status: text("status").notNull(), // "pending", "completed", "dismissed"
  relatedTo: text("related_to"), // e.g. "property:uuid" or "tenant:uuid"
  calendarEventId: text("calendar_event_id"), // Google Calendar event ID if synced
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export type Reminder = typeof reminders.$inferSelect;
export type NewReminder = typeof reminders.$inferInsert;

export const files = sqliteTable("files", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // "lease", "contract", "inspection", "photo", "receipt", "other"
  url: text("url").notNull(), // File URL or path
  size: integer("size"), // in bytes
  relatedTo: text("related_to"), // e.g. "property:uuid" or "tenant:uuid"
  uploadedBy: text("uploaded_by"),
  notes: text("notes"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export type FileRecord = typeof files.$inferSelect;
export type NewFileRecord = typeof files.$inferInsert;
