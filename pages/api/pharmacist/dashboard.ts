import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/database';
import QRCode from '@/lib/models/QRCode';
import Verification from '@/lib/models/Verification';
import Report from '@/lib/models/Report';
import mongoose from 'mongoose';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check authentication
    const userRole = req.headers['x-user-role'];
    const userEmail = req.headers['x-user-email'];
    
    if (userRole !== 'pharmacist') {
      return res.status(403).json({ error: 'Access denied. Pharmacist role required.' });
    }

    if (!userEmail) {
      return res.status(401).json({ error: 'User email required' });
    }

    await dbConnect();

    // Get query parameters
    const { timeRange = '30d' } = req.query;

    // Calculate date range
    const now = new Date();
    let startDate: Date;
    
    switch (timeRange) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get statistics
    const stats = await getPharmacistStats(userEmail as string, startDate);

    // Get recent verifications
    const recentVerifications = await getRecentVerifications(userEmail as string);

    // Get inventory alerts
    const inventoryAlerts = await getInventoryAlerts(userEmail as string);

    res.status(200).json({
      success: true,
      stats,
      recentVerifications,
      inventoryAlerts,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Pharmacist dashboard API error:', error);
    res.status(500).json({ 
      error: 'Internal server error while fetching pharmacist dashboard data' 
    });
  }
}

async function getPharmacistStats(userEmail: string, startDate: Date) {
  // Get verification statistics
  const [
    totalVerifications,
    authenticVerifications,
    suspiciousVerifications,
    counterfeitVerifications
  ] = await Promise.all([
    Verification.countDocuments({ 
      userEmail, 
      createdAt: { $gte: startDate } 
    }),
    Verification.countDocuments({ 
      userEmail, 
      status: { $in: ['authentic', 'verified', 'valid'] },
      createdAt: { $gte: startDate }
    }),
    Verification.countDocuments({ 
      userEmail, 
      status: { $in: ['suspicious', 'questionable'] },
      createdAt: { $gte: startDate }
    }),
    Verification.countDocuments({ 
      userEmail, 
      status: { $in: ['counterfeit', 'invalid', 'fake'] },
      createdAt: { $gte: startDate }
    })
  ]);

  // Get QR code scan statistics
  const [
    totalQRCodes,
    scannedQRCodes
  ] = await Promise.all([
    QRCode.countDocuments({ 
      userEmail, 
      createdAt: { $gte: startDate } 
    }),
    QRCode.countDocuments({ 
      userEmail, 
      isScanned: true,
      createdAt: { $gte: startDate }
    })
  ]);

  // Get report statistics
  const totalReports = await Report.countDocuments({ 
    userEmail, 
    createdAt: { $gte: startDate } 
  });

  // Calculate percentages
  const authenticityRate = totalVerifications > 0 
    ? Math.round((authenticVerifications / totalVerifications) * 100 * 10) / 10
    : 0;

  const scanRate = totalQRCodes > 0 
    ? Math.round((scannedQRCodes / totalQRCodes) * 100 * 10) / 10
    : 0;

  return {
    totalScans: totalVerifications + scannedQRCodes,
    authenticDrugs: authenticVerifications,
    suspiciousDrugs: suspiciousVerifications,
    counterfeitDrugs: counterfeitVerifications,
    inventoryItems: totalQRCodes, // Using QR codes as inventory items
    authenticityRate,
    scanRate,
    totalReports
  };
}

async function getRecentVerifications(userEmail: string) {
  const verifications = await Verification.find({ userEmail })
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

  return verifications.map(verification => ({
    id: (verification._id as any).toString(),
    drugName: verification.drugName,
    result: verification.status,
    time: verification.createdAt,
    batchId: verification.batchId || 'N/A',
    method: verification.method
  }));
}

async function getInventoryAlerts(userEmail: string) {
  // Get QR codes that might be expiring soon or have low scan rates
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  
  const qrCodes = await QRCode.find({ 
    userEmail,
    'metadata.expiryDate': { $lte: thirtyDaysFromNow }
  })
  .limit(5)
  .lean();

  const alerts = qrCodes.map(qrCode => {
    const expiryDate = qrCode.metadata?.expiryDate;
    const daysUntilExpiry = expiryDate 
      ? Math.ceil((new Date(expiryDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    return {
      drug: qrCode.metadata?.drugName || 'Unknown Drug',
      status: daysUntilExpiry <= 0 ? 'expired' : 'expiring',
      days: Math.max(0, daysUntilExpiry),
      quantity: 1, // Each QR code represents one unit
      batchId: qrCode.metadata?.batchId || 'N/A'
    };
  });

  // Add low stock alerts (QR codes with no scans)
  const unscannedQRCodes = await QRCode.find({ 
    userEmail,
    isScanned: false,
    createdAt: { $lte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } // Older than 7 days
  })
  .limit(3)
  .lean();

  const lowStockAlerts = unscannedQRCodes.map(qrCode => ({
    drug: qrCode.metadata?.drugName || 'Unknown Drug',
    status: 'low-stock',
    days: 0,
    quantity: 1,
    batchId: qrCode.metadata?.batchId || 'N/A'
  }));

  return [...alerts, ...lowStockAlerts].slice(0, 5);
}
