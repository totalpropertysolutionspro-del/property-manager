import { Router, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";

const router = Router();

const SQUARE_BASE_URL = "https://connect.squareup.com/v2";
const SQUARE_ACCESS_TOKEN = process.env.SQUARE_ACCESS_TOKEN || "";
const SQUARE_LOCATION_ID = process.env.SQUARE_LOCATION_ID || "L0TPJWTVTRA7B";

function squareHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${SQUARE_ACCESS_TOKEN}`,
    "Square-Version": "2024-01-18",
  };
}

async function squareFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${SQUARE_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...squareHeaders(),
      ...(options.headers || {}),
    },
  });

  const data = await res.json() as any;

  if (!res.ok) {
    const errorMsg =
      data?.errors?.[0]?.detail ||
      data?.errors?.[0]?.code ||
      `Square API error: ${res.status}`;
    throw new Error(errorMsg);
  }

  return data;
}

// Find or create a Square customer by email
async function findOrCreateCustomer(
  email: string,
  name: string
): Promise<string> {
  // Search for existing customer by email
  const searchRes = await squareFetch("/customers/search", {
    method: "POST",
    body: JSON.stringify({
      query: {
        filter: {
          email_address: {
            fuzzy: email,
          },
        },
      },
    }),
  });

  const customers: any[] = searchRes.customers || [];
  const existing = customers.find(
    (c: any) => c.email_address?.toLowerCase() === email.toLowerCase()
  );

  if (existing) {
    return existing.id;
  }

  // Create new customer
  const nameParts = name.trim().split(/\s+/);
  const givenName = nameParts[0] || name;
  const familyName = nameParts.slice(1).join(" ") || "";

  const createRes = await squareFetch("/customers", {
    method: "POST",
    body: JSON.stringify({
      idempotency_key: uuidv4(),
      given_name: givenName,
      family_name: familyName,
      email_address: email,
    }),
  });

  return createRes.customer.id;
}

// POST /api/square/create-invoice
router.post("/create-invoice", async (req: Request, res: Response) => {
  try {
    const { tenantName, tenantEmail, amount, description, dueDate } = req.body;

    if (!tenantName || !tenantEmail || !amount || !description || !dueDate) {
      return res.status(400).json({
        error: "Missing required fields: tenantName, tenantEmail, amount, description, dueDate",
      });
    }

    const amountCents = Math.round(parseFloat(amount) * 100);
    if (isNaN(amountCents) || amountCents <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    // Step 1: Find or create customer
    const customerId = await findOrCreateCustomer(tenantEmail, tenantName);

    // Step 2: Create an order
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
              base_price_money: {
                amount: amountCents,
                currency: "USD",
              },
            },
          ],
        },
      }),
    });

    const orderId: string = orderRes.order.id;

    // Step 3: Create invoice linked to the order
    const invoiceRes = await squareFetch("/invoices", {
      method: "POST",
      body: JSON.stringify({
        idempotency_key: uuidv4(),
        invoice: {
          location_id: SQUARE_LOCATION_ID,
          order_id: orderId,
          primary_recipient: {
            customer_id: customerId,
          },
          payment_requests: [
            {
              request_type: "BALANCE",
              due_date: dueDate, // "YYYY-MM-DD"
              reminders: [
                {
                  relative_scheduled_days: -1,
                  message: "Your invoice is due tomorrow.",
                },
              ],
            },
          ],
          delivery_method: "EMAIL",
          invoice_number: `TPS-${Date.now()}`,
          title: description,
          description: `Invoice from Total Property Solutions for ${tenantName}`,
        },
      }),
    });

    const invoiceId: string = invoiceRes.invoice.id;
    const invoiceVersion: number = invoiceRes.invoice.version;

    // Step 4: Publish the invoice (sends email to tenant)
    const publishRes = await squareFetch(`/invoices/${invoiceId}/publish`, {
      method: "POST",
      body: JSON.stringify({
        idempotency_key: uuidv4(),
        version: invoiceVersion,
      }),
    });

    const publishedInvoice = publishRes.invoice;

    res.status(201).json({
      squareInvoiceId: publishedInvoice.id,
      invoiceNumber: publishedInvoice.invoice_number,
      status: publishedInvoice.status,
      paymentUrl: publishedInvoice.public_url || null,
      amount: amountCents / 100,
      dueDate,
    });
  } catch (error: any) {
    console.error("Error creating Square invoice:", error);
    res.status(500).json({ error: error.message || "Failed to create Square invoice" });
  }
});

// GET /api/square/invoices
router.get("/invoices", async (_req: Request, res: Response) => {
  try {
    const data = await squareFetch(
      `/invoices?location_id=${SQUARE_LOCATION_ID}`
    );

    const invoices = (data.invoices || []).map((inv: any) => ({
      id: inv.id,
      invoiceNumber: inv.invoice_number,
      title: inv.title,
      status: inv.status,
      paymentUrl: inv.public_url || null,
      createdAt: inv.created_at,
      updatedAt: inv.updated_at,
      dueDate: inv.payment_requests?.[0]?.due_date || null,
      amountDue: inv.payment_requests?.[0]?.computed_amount_money
        ? inv.payment_requests[0].computed_amount_money.amount / 100
        : null,
    }));

    res.json(invoices);
  } catch (error: any) {
    console.error("Error fetching Square invoices:", error);
    res.status(500).json({ error: error.message || "Failed to fetch Square invoices" });
  }
});

// GET /api/square/invoice/:id
router.get("/invoice/:id", async (req: Request, res: Response) => {
  try {
    const data = await squareFetch(`/invoices/${req.params.id}`);

    const inv = data.invoice;
    res.json({
      id: inv.id,
      invoiceNumber: inv.invoice_number,
      title: inv.title,
      description: inv.description,
      status: inv.status,
      paymentUrl: inv.public_url || null,
      createdAt: inv.created_at,
      updatedAt: inv.updated_at,
      dueDate: inv.payment_requests?.[0]?.due_date || null,
      amountDue: inv.payment_requests?.[0]?.computed_amount_money
        ? inv.payment_requests[0].computed_amount_money.amount / 100
        : null,
    });
  } catch (error: any) {
    console.error("Error fetching Square invoice:", error);
    res.status(500).json({ error: error.message || "Failed to fetch Square invoice" });
  }
});

export default router;
