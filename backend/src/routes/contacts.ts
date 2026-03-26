import { Router, Request, Response } from "express";
import { db } from "../db/index.js";
import { contacts } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  try {
    const all = await db.select().from(contacts).all();
    res.json(all);
  } catch (error) {
    console.error("Error fetching contacts:", error);
    res.status(500).json({ error: "Failed to fetch contacts" });
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const contact = await db.select().from(contacts).where(eq(contacts.id, req.params.id)).get();
    if (!contact) return res.status(404).json({ error: "Contact not found" });
    res.json(contact);
  } catch (error) {
    console.error("Error fetching contact:", error);
    res.status(500).json({ error: "Failed to fetch contact" });
  }
});

router.post("/", async (req: Request, res: Response) => {
  try {
    const { name, email, phone, company, type, notes } = req.body;
    if (!name || !email || !phone || !type) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const now = new Date().toISOString();
    const newContact = { id: uuidv4(), name, email, phone, company: company || null, type, notes: notes || null, createdAt: now, updatedAt: now };
    await db.insert(contacts).values(newContact);
    res.status(201).json(newContact);
  } catch (error) {
    console.error("Error creating contact:", error);
    res.status(500).json({ error: "Failed to create contact" });
  }
});

router.put("/:id", async (req: Request, res: Response) => {
  try {
    const existing = await db.select().from(contacts).where(eq(contacts.id, req.params.id)).get();
    if (!existing) return res.status(404).json({ error: "Contact not found" });
    const { name, email, phone, company, type, notes } = req.body;
    const updated = {
      ...existing,
      ...(name && { name }),
      ...(email && { email }),
      ...(phone && { phone }),
      ...(company !== undefined && { company }),
      ...(type && { type }),
      ...(notes !== undefined && { notes }),
      updatedAt: new Date().toISOString(),
    };
    await db.update(contacts).set(updated).where(eq(contacts.id, req.params.id)).run();
    res.json(updated);
  } catch (error) {
    console.error("Error updating contact:", error);
    res.status(500).json({ error: "Failed to update contact" });
  }
});

router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const existing = await db.select().from(contacts).where(eq(contacts.id, req.params.id)).get();
    if (!existing) return res.status(404).json({ error: "Contact not found" });
    await db.delete(contacts).where(eq(contacts.id, req.params.id)).run();
    res.json({ message: "Contact deleted successfully" });
  } catch (error) {
    console.error("Error deleting contact:", error);
    res.status(500).json({ error: "Failed to delete contact" });
  }
});

export default router;
