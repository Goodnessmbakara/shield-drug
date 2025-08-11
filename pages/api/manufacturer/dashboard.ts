import type { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/lib/database";
import Upload from "@/lib/models/Upload";
import QRCode from "@/lib/models/QRCode";
import mongoose from "mongoose";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { userEmail } = req.query;

    if (!userEmail || typeof userEmail !== 'string') {
      return res.status(400).json({ message: 'User email is required' });
    }

    await dbConnect();

    // Fetch recent batches for the user
    const recentBatches = await Upload.find({ userEmail })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    // Calculate statistics
    const totalBatches = await Upload.countDocuments({ userEmail });
    const activeBatches = await Upload.countDocuments({ 
      userEmail, 
      status: { $in: ['completed', 'active'] } 
    });
    
    const totalQRCodes = await QRCode.countDocuments({ userEmail });
    const scannedQRCodes = await QRCode.countDocuments({ 
      userEmail, 
      scanned: true 
    });

    const verifications = scannedQRCodes;
    const authenticityRate = totalQRCodes > 0 ? (scannedQRCodes / totalQRCodes) * 100 : 0;

    // Format batches for frontend
    const formattedBatches = recentBatches.map(batch => ({
      id: (batch._id as mongoose.Types.ObjectId).toString(),
      drug: batch.drugName || batch.drug || 'Unknown Drug',
      quantity: batch.totalQuantity || batch.quantity || 0,
      status: batch.status || 'pending',
      qrGenerated: batch.qrCodesGenerated || false,
      verifications: batch.verificationCount || 0,
    }));

    const stats = {
      totalBatches,
      activeBatches,
      totalQRCodes,
      verifications,
      authenticityRate: Math.round(authenticityRate * 10) / 10, // Round to 1 decimal place
    };

    res.status(200).json({
      batches: formattedBatches,
      stats,
    });

  } catch (error) {
    console.error('Error fetching manufacturer dashboard data:', error);
    res.status(500).json({ 
      message: 'Failed to fetch dashboard data',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}