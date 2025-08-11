import dbConnect from "@/lib/database";
import Verification from "@/lib/models/Verification";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await dbConnect();
  const userEmail = req.query.userEmail;
  const verifications = await Verification.find({ userEmail })
    .sort({ createdAt: -1 })
    .limit(10);
  res.status(200).json(verifications);
}
