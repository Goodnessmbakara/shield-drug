import dbConnect from "@/lib/database";
import Report from "../../../src/lib/models/Report";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();

  if (req.method === "POST") {
    // Submit a new report
    const { userEmail, drugName, batchNumber, description } = req.body;
    if (!userEmail || !drugName || !batchNumber || !description) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    try {
      const report = await Report.create({
        userEmail,
        drugName,
        batchNumber,
        description,
        status: "pending",
      });
      return res.status(201).json({ success: true, report });
    } catch (error) {
      return res.status(500).json({ error: "Failed to submit report" });
    }
  }

  if (req.method === "GET") {
    // Get previous reports for a user
    const { userEmail } = req.query;
    if (!userEmail) {
      return res.status(400).json({ error: "Missing userEmail" });
    }
    try {
      const reports = await Report.find({ userEmail }).sort({ createdAt: -1 });
      return res.status(200).json({ success: true, reports });
    } catch (error) {
      return res.status(500).json({ error: "Failed to fetch reports" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
