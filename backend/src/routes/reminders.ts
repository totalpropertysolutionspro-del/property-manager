import { Router, Request, Response } from "express";
import { db } from "../db/index.js";
import { reminders } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

const router = Router();

// Get all reminders
router.get("/", async (req: Request, res: Response) => {
  try {
    const all = await db.select().from(reminders).all();
    res.json(all);
  } catch (error) {
    console.error("Error fetching reminders:", error);
    res.status(500).json({ error: "Failed to fetch reminders" });
  }
});

// Get single reminder
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const result = await db
      .select()
      .from(reminders)
      .where(eq(reminders.id, req.params.id))
      .all();

    const reminder = result[0];
    if (!reminder) {
      return res.status(404).json({ error: "Reminder not found" });
    }

    res.json(reminder);
  } catch (error) {
    console.error("Error fetching reminder:", error);
    res.status(500).json({ error: "Failed to fetch reminder" });
  }
});

// Create reminder
router.post("/", async (req: Request, res: Response) => {
  try {
    const { title, description, dueDate, type, status, relatedTo, calendarEventId } = req.body;

    if (!title || !dueDate || !type) {
      return res.status(400).json({ error: "Missing required fields: title, dueDate, type" });
    }

    const id = uuidv4();
    const now = new Date().toISOString();

    const newReminder = {
      id,
      title,
      description: description || null,
      dueDate,
      type,
      status: status || "pending",
      relatedTo: relatedTo || null,
      calendarEventId: calendarEventId || null,
      createdAt: now,
      updatedAt: now,
    };

    await db.insert(reminders).values(newReminder);

    res.status(201).json(newReminder);
  } catch (error) {
    console.error("Error creating reminder:", error);
    res.status(500).json({ error: "Failed to create reminder" });
  }
});

// Update reminder
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const { title, description, dueDate, type, status, relatedTo, calendarEventId } = req.body;

    const existing = await db
      .select()
      .from(reminders)
      .where(eq(reminders.id, req.params.id))
      .all();

    const existingReminder = existing[0];
    if (!existingReminder) {
      return res.status(404).json({ error: "Reminder not found" });
    }

    const updatedReminder = {
      ...existingReminder,
      ...(title && { title }),
      ...(description !== undefined && { description }),
      ...(dueDate && { dueDate }),
      ...(type && { type }),
      ...(status && { status }),
      ...(relatedTo !== undefined && { relatedTo }),
      ...(calendarEventId !== undefined && { calendarEventId }),
      updatedAt: new Date().toISOString(),
    };

    await db
      .update(reminders)
      .set(updatedReminder)
      .where(eq(reminders.id, req.params.id))
      .run();

    res.json(updatedReminder);
  } catch (error) {
    console.error("Error updating reminder:", error);
    res.status(500).json({ error: "Failed to update reminder" });
  }
});

// Delete reminder
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const existing = await db
      .select()
      .from(reminders)
      .where(eq(reminders.id, req.params.id))
      .all();

    if (!existing[0]) {
      return res.status(404).json({ error: "Reminder not found" });
    }

    await db
      .delete(reminders)
      .where(eq(reminders.id, req.params.id))
      .run();

    res.json({ message: "Reminder deleted successfully" });
  } catch (error) {
    console.error("Error deleting reminder:", error);
    res.status(500).json({ error: "Failed to delete reminder" });
  }
});

export default router;
