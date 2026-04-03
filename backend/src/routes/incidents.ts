import { Router, Request, Response } from "express";
import { db } from "../db/index.js";
import { incidents } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { createNotification } from "../services/notification.js";

const router = Router();

// Get all incidents
router.get("/", async (req: Request, res: Response) => {
  try {
    const all = await db.select().from(incidents).all();
    res.json(all);
  } catch (error) {
    console.error("Error fetching incidents:", error);
    res.status(500).json({ error: "Failed to fetch incidents" });
  }
});

// Get single incident
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const result = await db
      .select()
      .from(incidents)
      .where(eq(incidents.id, req.params.id))
      .all();

    const incident = result[0];
    if (!incident) {
      return res.status(404).json({ error: "Incident not found" });
    }

    res.json(incident);
  } catch (error) {
    console.error("Error fetching incident:", error);
    res.status(500).json({ error: "Failed to fetch incident" });
  }
});

// Create incident
router.post("/", async (req: Request, res: Response) => {
  try {
    const { title, propertyId, type, severity, status, reportedBy, description, dateReported } = req.body;

    if (!title || !propertyId || !type || !severity || !reportedBy) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const id = uuidv4();
    const now = new Date().toISOString();

    const newIncident = {
      id,
      title,
      propertyId,
      type,
      severity,
      status: status || "open",
      reportedBy,
      description: description || null,
      dateReported: dateReported || now,
      dateResolved: null,
      createdAt: now,
      updatedAt: now,
    };

    await db.insert(incidents).values(newIncident);

    // Create notification for new incident
    await createNotification({
      type: "work_order_created" as any,
      title: `Incident Reported: ${title}`,
      message: `A ${severity} severity ${type} incident has been reported by ${reportedBy}`,
      shouldSendEmail: severity === "high" || severity === "critical",
      shouldSendSMS: severity === "critical",
      email: process.env.ADMIN_EMAIL,
      phone: process.env.ADMIN_PHONE,
    });

    res.status(201).json(newIncident);
  } catch (error) {
    console.error("Error creating incident:", error);
    res.status(500).json({ error: "Failed to create incident" });
  }
});

// Update incident
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const { title, propertyId, type, severity, status, reportedBy, description, dateReported, dateResolved } = req.body;

    const existing = await db
      .select()
      .from(incidents)
      .where(eq(incidents.id, req.params.id))
      .all();

    const existingIncident = existing[0];
    if (!existingIncident) {
      return res.status(404).json({ error: "Incident not found" });
    }

    const updatedIncident = {
      ...existingIncident,
      ...(title && { title }),
      ...(propertyId && { propertyId }),
      ...(type && { type }),
      ...(severity && { severity }),
      ...(status && { status }),
      ...(reportedBy && { reportedBy }),
      ...(description !== undefined && { description }),
      ...(dateReported && { dateReported }),
      ...(dateResolved !== undefined && { dateResolved }),
      updatedAt: new Date().toISOString(),
    };

    // Auto-set dateResolved when status changes to resolved or closed
    if (status && (status === "resolved" || status === "closed") && !existingIncident.dateResolved) {
      updatedIncident.dateResolved = new Date().toISOString();
    }

    await db
      .update(incidents)
      .set(updatedIncident)
      .where(eq(incidents.id, req.params.id))
      .run();

    res.json(updatedIncident);
  } catch (error) {
    console.error("Error updating incident:", error);
    res.status(500).json({ error: "Failed to update incident" });
  }
});

// Delete incident
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const existing = await db
      .select()
      .from(incidents)
      .where(eq(incidents.id, req.params.id))
      .all();

    if (!existing[0]) {
      return res.status(404).json({ error: "Incident not found" });
    }

    await db
      .delete(incidents)
      .where(eq(incidents.id, req.params.id))
      .run();

    res.json({ message: "Incident deleted successfully" });
  } catch (error) {
    console.error("Error deleting incident:", error);
    res.status(500).json({ error: "Failed to delete incident" });
  }
});

export default router;
