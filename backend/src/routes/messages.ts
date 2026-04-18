import { Router, Request, Response } from "express";
import { sendEmail } from "../services/email.js";
import { sendSMS } from "../services/sms.js";

const router = Router();

// Send email
router.post("/email", async (req: Request, res: Response) => {
  try {
    const { to, subject, body } = req.body;
    if (!to || !subject || !body) {
      return res.status(400).json({ error: "Missing required fields: to, subject, body" });
    }
    await sendEmail(to, subject, body);
    res.json({ message: "Email sent successfully" });
  } catch (error: any) {
    console.error("Error sending email:", error);
    res.status(500).json({ error: error.message || "Failed to send email" });
  }
});

// Send SMS
router.post("/sms", async (req: Request, res: Response) => {
  try {
    const { to, body } = req.body;
    if (!to || !body) {
      return res.status(400).json({ error: "Missing required fields: to, body" });
    }
    await sendSMS(to, body);
    res.json({ message: "SMS sent successfully" });
  } catch (error: any) {
    console.error("Error sending SMS:", error);
    res.status(500).json({ error: error.message || "Failed to send SMS" });
  }
});

export default router;
