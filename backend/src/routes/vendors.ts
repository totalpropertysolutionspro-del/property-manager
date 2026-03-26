import { Router, Request, Response } from "express";
import { db } from "../db/index.js";
import { vendors } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  try {
    const all = await db.select().from(vendors).all();
    res.json(all);
  } catch (error) {
    console.error("Error fetching vendors:", error);
    res.status(500).json({ error: "Failed to fetch vendors" });
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const vendor = await db.select().from(vendors).where(eq(vendors.id, req.params.id)).get();
    if (!vendor) return res.status(404).json({ error: "Vendor not found" });
    res.json(vendor);
  } catch (error) {
    console.error("Error fetching vendor:", error);
    res.status(500).json({ error: "Failed to fetch vendor" });
  }
});

router.post("/", async (req: Request, res: Response) => {
  try {
    const { companyName, contactPerson, email, phone, serviceType, insuranceOnFile, notes, rating } = req.body;
    if (!companyName || !contactPerson || !email || !phone || !serviceType) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const now = new Date().toISOString();
    const newVendor = {
      id: uuidv4(),
      companyName,
      contactPerson,
      email,
      phone,
      serviceType,
      insuranceOnFile: insuranceOnFile || false,
      notes: notes || null,
      rating: rating || null,
      createdAt: now,
      updatedAt: now,
    };
    await db.insert(vendors).values(newVendor);
    res.status(201).json(newVendor);
  } catch (error) {
    console.error("Error creating vendor:", error);
    res.status(500).json({ error: "Failed to create vendor" });
  }
});

router.put("/:id", async (req: Request, res: Response) => {
  try {
    const existing = await db.select().from(vendors).where(eq(vendors.id, req.params.id)).get();
    if (!existing) return res.status(404).json({ error: "Vendor not found" });
    const { companyName, contactPerson, email, phone, serviceType, insuranceOnFile, notes, rating } = req.body;
    const updated = {
      ...existing,
      ...(companyName && { companyName }),
      ...(contactPerson && { contactPerson }),
      ...(email && { email }),
      ...(phone && { phone }),
      ...(serviceType && { serviceType }),
      ...(insuranceOnFile !== undefined && { insuranceOnFile }),
      ...(notes !== undefined && { notes }),
      ...(rating !== undefined && { rating }),
      updatedAt: new Date().toISOString(),
    };
    await db.update(vendors).set(updated).where(eq(vendors.id, req.params.id)).run();
    res.json(updated);
  } catch (error) {
    console.error("Error updating vendor:", error);
    res.status(500).json({ error: "Failed to update vendor" });
  }
});

router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const existing = await db.select().from(vendors).where(eq(vendors.id, req.params.id)).get();
    if (!existing) return res.status(404).json({ error: "Vendor not found" });
    await db.delete(vendors).where(eq(vendors.id, req.params.id)).run();
    res.json({ message: "Vendor deleted successfully" });
  } catch (error) {
    console.error("Error deleting vendor:", error);
    res.status(500).json({ error: "Failed to delete vendor" });
  }
});

export default router;
