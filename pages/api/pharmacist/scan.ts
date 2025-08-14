import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/database';
import QRCode from '@/lib/models/QRCode';
import Verification from '@/lib/models/Verification';
import Report from '@/lib/models/Report';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await dbConnect();
    const { userEmail } = req.query;

    if (!userEmail || typeof userEmail !== 'string') {
      return res.status(400).json({ error: 'User email is required' });
    }

    const scanData = await getPharmacistScanData(userEmail);
    
    return res.status(200).json({
      success: true,
      data: scanData
    });
  } catch (error) {
    console.error('Error fetching pharmacist scan data:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function getPharmacistScanData(userEmail: string) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Get scan statistics
  const totalScans = await Verification.countDocuments({ 
    verifiedBy: userEmail 
  });
  
  const authenticScans = await Verification.countDocuments({ 
    verifiedBy: userEmail, 
    result: 'authentic' 
  });
  
  const suspiciousScans = await Verification.countDocuments({ 
    verifiedBy: userEmail, 
    result: 'suspicious' 
  });
  
  const counterfeitScans = await Verification.countDocuments({ 
    verifiedBy: userEmail, 
    result: 'counterfeit' 
  });

  const todayScans = await Verification.countDocuments({
    verifiedBy: userEmail,
    verifiedAt: { $gte: new Date().setHours(0, 0, 0, 0) }
  });

  const weeklyScans = await Verification.countDocuments({
    verifiedBy: userEmail,
    verifiedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
  });

  const monthlyScans = await Verification.countDocuments({
    verifiedBy: userEmail,
    verifiedAt: { $gte: thirtyDaysAgo }
  });

  const successRate = totalScans > 0 ? ((authenticScans / totalScans) * 100) : 0;

  // Get latest scan results (last 10 verifications)
  const latestScans = await Verification.find({ verifiedBy: userEmail })
    .populate('qrCodeId')
    .sort({ verifiedAt: -1 })
    .limit(10)
    .lean();

  // Get scan history (last 50 verifications)
  const scanHistory = await Verification.find({ verifiedBy: userEmail })
    .populate('qrCodeId')
    .sort({ verifiedAt: -1 })
    .limit(50)
    .lean();

  // Transform scan data
  const transformedLatestScans = latestScans.map(scan => ({
    id: (scan._id as any).toString(),
    drugName: scan.qrCodeId?.drugName || 'Unknown Drug',
    batchId: scan.qrCodeId?.batchId || 'Unknown Batch',
    qrCode: scan.qrCodeId?.qrCode || 'Unknown QR',
    result: scan.result || 'unknown',
    timestamp: scan.verifiedAt ? new Date(scan.verifiedAt).toISOString() : new Date().toISOString(),
    location: scan.location || 'Unknown Location',
    pharmacist: userEmail,
    pharmacy: 'MedPlus Pharmacy', // This could come from user profile
    verificationDetails: {
      manufacturer: scan.qrCodeId?.manufacturer || 'Unknown Manufacturer',
      expiryDate: scan.qrCodeId?.expiryDate ? new Date(scan.qrCodeId.expiryDate).toISOString().split('T')[0] : 'Unknown',
      quantity: scan.qrCodeId?.quantity || 0,
      blockchainTx: scan.blockchainTx || 'Pending',
      verificationCount: scan.verificationCount || 1,
      firstVerified: scan.qrCodeId?.createdAt ? new Date(scan.qrCodeId.createdAt).toISOString().split('T')[0] : 'Unknown',
      lastVerified: scan.verifiedAt ? new Date(scan.verifiedAt).toISOString().split('T')[0] : 'Unknown'
    }
  }));

  const transformedScanHistory = scanHistory.map(scan => ({
    id: (scan._id as any).toString(),
    drugName: scan.qrCodeId?.drugName || 'Unknown Drug',
    batchId: scan.qrCodeId?.batchId || 'Unknown Batch',
    qrCode: scan.qrCodeId?.qrCode || 'Unknown QR',
    result: scan.result || 'unknown',
    timestamp: scan.verifiedAt ? new Date(scan.verifiedAt).toISOString() : new Date().toISOString(),
    location: scan.location || 'Unknown Location',
    pharmacist: userEmail,
    pharmacy: 'MedPlus Pharmacy',
    verificationDetails: {
      manufacturer: scan.qrCodeId?.manufacturer || 'Unknown Manufacturer',
      expiryDate: scan.qrCodeId?.expiryDate ? new Date(scan.qrCodeId.expiryDate).toISOString().split('T')[0] : 'Unknown',
      quantity: scan.qrCodeId?.quantity || 0,
      blockchainTx: scan.blockchainTx || 'Pending',
      verificationCount: scan.verificationCount || 1,
      firstVerified: scan.qrCodeId?.createdAt ? new Date(scan.qrCodeId.createdAt).toISOString().split('T')[0] : 'Unknown',
      lastVerified: scan.verifiedAt ? new Date(scan.verifiedAt).toISOString().split('T')[0] : 'Unknown'
    }
  }));

  return {
    stats: {
      totalScans,
      authenticScans,
      suspiciousScans,
      counterfeitScans,
      successRate: Math.round(successRate * 10) / 10,
      averageScanTime: 2.3, // This could be calculated from actual data
      todayScans,
      weeklyScans,
      monthlyScans
    },
    latestScanResult: transformedLatestScans[0] || null,
    scanHistory: transformedScanHistory
  };
}
