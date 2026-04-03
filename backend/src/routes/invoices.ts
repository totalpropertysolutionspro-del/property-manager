import { Router, Request, Response } from "express";
import { db } from "../db/index.js";
import { invoices, tenants } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { createNotification } from "../services/notification.js";

const router = Router();

const SQUARE_BASE_URL = "https://connect.squareup.com/v2";
const SQUARE_LOCATION_ID = process.env.SQUARE_LOCATION_ID || "L0TPJWTVTRA7B";

async function createSquareInvoice(
  tenantName: string,
  tenantEmail: string,
  amount: number,
  description: string,
  dueDate: string
): Promise<{ squareInvoiceId: string; paymentUrl: string | null }> {
  const accessToken = process.env.SQUARE_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error("SQUARE_ACCESS_TOKEN not configured");
  }

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken}`,
    "Square-Version": "2024-01-18",
  };

  async function squareFetch(path: string, options: RequestInit = {}) {
    const res = await fetch(`${SQUARE_BASE_URL}${path}`, {
      ...options,
      headers: { ...headers, ...(options.headers || {}) },
    });
    const data = await res.json() as any;
    if (!res.ok) {
      const msg =
        data?.errors?.[0]?.detail ||
        data?.errors?.[0]?.code ||
        `Square API error: ${res.status}`;
      throw new Error(msg);
    }
    return data;
  }

  // Find or create customer
  const searchRes = await squareFetch("/customers/search", {
    method: "POST",
    body: JSON.stringify({
      query: {
        filter: { email_address: { fuzzy: tenantEmail } },
      },
    }),
  });

  const customers: any[] = searchRes.customers || [];
  const existingCustomer = customers.find(
    (c: any) => c.email_address?.toLowerCase() === tenantEmail.toLowerCase()
  );

  let customerId: string;
  if (existingCustomer) {
    customerId = existingCustomer.id;
  } else {
    const nameParts = tenantName.trim().split(/\s+/);
    const createRes = await squareFetch("/customers", {
      method: "POST",
      body: JSON.stringify({
        idempotency_key: uuidv4(),
        given_name: nameParts[0] || tenantName,
        family_name: nameParts.slice(1).join(" ") || "",
        email_address: tenantEmail,
      }),
    });
    customerId = createRes.customer.id;
  }

  // Create order
  const amountCents = Math.round(amount * 100);
  const orderRes = await squareFetch("/orders", {
    method: "POST",
    body: JSON.stringify({
      idempotency_key: uuidv4(),
      order: {
        location_id: SQUARE_LOCATION_ID,
        customer_id: customerId,
        line_items: [
          {
            name: description,
            quantity: "1",
            base_price_money: { amount: amountCents, currency: "USD" },
          },
        ],
      },
    }),
  });

  const orderId: string = orderRes.order.id;

  // Create invoice
  const invoiceRes = await squareFetch("/invoices", {
    method: "POST",
    body: JSON.stringify({
      idempotency_key: uuidv4(),
      invoice: {
        location_id: SQUARE_LOCATION_ID,
        order_id: orderId,
        primary_recipient: { customer_id: customerId },
        payment_requests: [
          {
            request_type: "BALANCE",
            due_date: dueDate,
          },
        ],
        delivery_method: "EMAIL",
        invoice_number: `TPS-${Date.now()}`,
        title: description,
        description: `Invoice from Total Property Solutions for ${tenantName}`,
      },
    }),
  });

  const squareInvoiceId: string = invoiceRes.invoice.id;
  const invoiceVersion: number = invoiceRes.invoice.version;

  // Publish invoice
  const publishRes = await squareFetch(`/invoices/${squareInvoiceId}/publish`, {
    method: "POST",
    body: JSON.stringify({
      idempotency_key: uuidv4(),
      version: invoiceVersion,
    }),
  });

  return {
    squareInvoiceId,
    paymentUrl: publishRes.invoice.public_url || null,
  };
}

// Get all invoices
router.get("/", async (req: Request, res: Response) => {
  try {
    const allInvoices = await db.select().from(invoices).all();
    res.json(allInvoices);
  } catch (error) {
    console.error("Error fetching invoices:", error);
    res.status(500).json({ error: "Failed to fetch invoices" });
  }
});

// Get single invoice
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const result = await db
      .select()
      .from(invoices)
      .where(eq(invoices.id, req.params.id))
      .all();

    const invoice = result[0];
    if (!invoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    res.json(invoice);
  } catch (error) {
    console.error("Error fetching invoice:", error);
    res.status(500).json({ error: "Failed to fetch invoice" });
  }
});

// Create invoice
router.post("/", async (req: Request, res: Response) => {
  try {
    const { tenantId, amount, dueDate, status, description, sendToSquare } = req.body;

    if (!tenantId || !amount || !dueDate) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const tenantResult = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .all();

    const tenant = tenantResult[0];
    if (!tenant) {
      return res.status(404).json({ error: "Tenant not found" });
    }

    const id = uuidv4();
    const now = new Date().toISOString();

    const newInvoice: any = {
      id,
      tenantId,
      amount: parseFloat(amount),
      dueDate,
      status: status || "unpaid",
      squareInvoiceId: null,
      createdAt: now,
      updatedAt: now,
    };

    // Optionally create Square invoice
    if (sendToSquare) {
      try {
        const invoiceDescription = description || `Rent - ${tenant.name}`;
        const { squareInvoiceId } = await createSquareInvoice(
          tenant.name,
          tenant.email,
          parseFloat(amount),
          invoiceDescription,
          dueDate
        );
        newInvoice.squareInvoiceId = squareInvoiceId;
      } catch (squareError: any) {
        console.error("Square invoice creation failed:", squareError.message);
        // Don't fail the whole request; log it and continue without squareInvoiceId
      }
    }

    await db.insert(invoices).values(newInvoice);

    // Create notification
    await createNotification({
      type: "invoice_created",
      title: "Invoice Created",
      message: `Invoice for ${amount} created for ${tenant.name}${newInvoice.squareInvoiceId ? " (Square invoice sent)" : ""}`,
      shouldSendEmail: true,
      email: tenant.email,
    });

    res.status(201).json(newInvoice);
  } catch (error) {
    console.error("Error creating invoice:", error);
    res.status(500).json({ error: "Failed to create invoice" });
  }
});

// Update invoice
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const { tenantId, amount, dueDate, status } = req.body;

    const existingResult = await db
      .select()
      .from(invoices)
      .where(eq(invoices.id, req.params.id))
      .all();

    const existingInvoice = existingResult[0];
    if (!existingInvoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    const tenantResult = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, existingInvoice.tenantId))
      .all();

    const tenant = tenantResult[0];

    const updatedInvoice = {
      ...existingInvoice,
      ...(tenantId && { tenantId }),
      ...(amount && { amount: parseFloat(amount) }),
      ...(dueDate && { dueDate }),
      ...(status && { status }),
      updatedAt: new Date().toISOString(),
    };

    // Create notification if status changed
    if (status && status !== existingInvoice.status) {
      let notificationType = "invoice_paid" as string;
      let notificationMessage = `Invoice has been marked as ${status}`;

      if (status === "paid") {
        notificationType = "invoice_paid";
        notificationMessage = "Invoice payment received";
      } else if (status === "overdue") {
        notificationType = "invoice_overdue";
        notificationMessage = "Invoice is overdue";
      }

      await createNotification({
        type: notificationType as any,
        title: `Invoice ${status.charAt(0).toUpperCase() + status.slice(1)}`,
        message: notificationMessage,
        shouldSendEmail: true,
        shouldSendSMS: status === "overdue",
        email: tenant?.email,
        phone: tenant?.phone,
      });
    }

    await db
      .update(invoices)
      .set(updatedInvoice)
      .where(eq(invoices.id, req.params.id))
      .run();

    res.json(updatedInvoice);
  } catch (error) {
    console.error("Error updating invoice:", error);
    res.status(500).json({ error: "Failed to update invoice" });
  }
});

// Delete invoice
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const existing = await db
      .select()
      .from(invoices)
      .where(eq(invoices.id, req.params.id))
      .all();

    if (!existing[0]) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    await db
      .delete(invoices)
      .where(eq(invoices.id, req.params.id))
      .run();

    res.json({ message: "Invoice deleted successfully" });
  } catch (error) {
    console.error("Error deleting invoice:", error);
    res.status(500).json({ error: "Failed to delete invoice" });
  }
});

export default router;
