import { Router, Request, Response } from "express";
import { db } from "../db/index.js";
import { files } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

const router = Router();

// Get all file records
router.get("/", async (req: Request, res: Response) => {
  try {
    const all = await db.select().from(files).all();
    res.json(all);
  } catch (error) {
    console.error("Error fetching files:", error);
    res.status(500).json({ error: "Failed to fetch files" });
  }
});

// Get single file record
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const result = await db
      .select()
      .from(files)
      .where(eq(files.id, req.params.id))
      .all();

    const file = result[0];
    if (!file) {
      return res.status(404).json({ error: "File not found" });
    }

    res.json(file);
  } catch (error) {
    console.error("Error fetching file:", error);
    res.status(500).json({ error: "Failed to fetch file" });
  }
});

// Create file record (metadata only — actual upload handled separately)
router.post("/", async (req: Request, res: Response) => {
  try {
    const { name, type, url, size, relatedTo, uploadedBy, notes } = req.body;

    if (!name || !type || !url) {
      return res.status(400).json({ error: "Missing required fields: name, type, url" });
    }

    const id = uuidv4();
    const now = new Date().toISOString();

    const newFile = {
      id,
      name,
      type,
      url,
      size: size || null,
      relatedTo: relatedTo || null,
      uploadedBy: uploadedBy || null,
      notes: notes || null,
      createdAt: now,
      updatedAt: now,
    };

    await db.insert(files).values(newFile);

    res.status(201).json(newFile);
  } catch (error) {
    console.error("Error creating file record:", error);
    res.status(500).json({ error: "Failed to create file record" });
  }
});

// Update file record
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const { name, type, url, size, relatedTo, uploadedBy, notes } = req.body;

    const existing = await db
      .select()
      .from(files)
      .where(eq(files.id, req.params.id))
      .all();

    const existingFile = existing[0];
    if (!existingFile) {
      return res.status(404).json({ error: "File not found" });
    }

    const updatedFile = {
      ...existingFile,
      ...(name && { name }),
      ...(type && { type }),
      ...(url && { url }),
      ...(size !== undefined && { size }),
      ...(relatedTo !== undefined && { relatedTo }),
      ...(uploadedBy !== undefined && { uploadedBy }),
      ...(notes !== undefined && { notes }),
      updatedAt: new Date().toISOString(),
    };

    await db
      .update(files)
      .set(updatedFile)
      .where(eq(files.id, req.params.id))
      .run();

    res.json(updatedFile);
  } catch (error) {
    console.error("Error updating file record:", error);
    res.status(500).json({ error: "Failed to update file record" });
  }
});

// Delete file record
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const existing = await db
      .select()
      .from(files)
      .where(eq(files.id, req.params.id))
      .all();

    if (!existing[0]) {
      return res.status(404).json({ error: "File not found" });
    }

    await db
      .delete(files)
      .where(eq(files.id, req.params.id))
      .run();

    res.json({ message: "File record deleted successfully" });
  } catch (error) {
    console.error("Error deleting file record:", error);
    res.status(500).json({ error: "Failed to delete file record" });
  }
});

export default router;
