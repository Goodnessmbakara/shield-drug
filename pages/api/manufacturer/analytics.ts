import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/database';
import Upload from '@/lib/models/Upload';
import QRCode from '@/lib/models/QRCode';
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
    
    if (userRole !== 'manufacturer') {
      return res.status(403).json({ error: 'Access denied. Manufacturer role required.' });
    }

    if (!userEmail) {
      return res.status(401).json({ error: 'User email required' });
    }

    await dbConnect();

    // Get query parameters
    const { timeRange = '30d', metric = 'verifications' } = req.query;

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
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // 1. Overview Statistics
    const overviewStats = await getOverviewStats(userEmail as string, startDate);

    // 2. Trends Data
    const trendsData = await getTrendsData(userEmail as string, startDate, timeRange as string);

    // 3. Top Drugs
    const topDrugs = await getTopDrugs(userEmail as string, startDate);

    // 4. Regional Data
    const regionalData = await getRegionalData(userEmail as string, startDate);

    // 5. Monthly Statistics
    const monthlyStats = await getMonthlyStats(userEmail as string, startDate);

    // 6. Recent Activity
    const recentActivity = await getRecentActivity(userEmail as string);

    res.status(200).json({
      overview: overviewStats,
      trends: trendsData,
      topDrugs,
      regionalData,
      monthlyStats,
      recentActivity,
      timeRange: timeRange as string,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching analytics data:', error);
    res.status(500).json({ 
      error: 'Internal server error while fetching analytics data' 
    });
  }
}

// Helper functions to fetch different analytics data
async function getOverviewStats(userEmail: string, startDate: Date) {
  const [
    totalBatches,
    totalQRCodes,
    totalVerifications,
    activeBatches,
    totalRevenue
  ] = await Promise.all([
    Upload.countDocuments({ userEmail, createdAt: { $gte: startDate } }),
    QRCode.countDocuments({ userEmail, createdAt: { $gte: startDate } }),
    QRCode.countDocuments({ userEmail, isScanned: true, scannedAt: { $gte: startDate } }),
    Upload.countDocuments({ userEmail, status: 'completed', createdAt: { $gte: startDate } }),
    Upload.aggregate([
      { $match: { userEmail, createdAt: { $gte: startDate } } },
      { $group: { _id: null, total: { $sum: '$quantity' } } }
    ])
  ]);

  const authenticityRate = totalQRCodes > 0 ? (totalVerifications / totalQRCodes * 100) : 0;
  const complianceRate = totalBatches > 0 ? (activeBatches / totalBatches * 100) : 0;
  const blockchainSuccess = 99.8; // Mock value for now
  const activePharmacies = 2047; // Mock value for now

  return {
    totalBatches,
    totalQRCodes,
    totalVerifications,
    authenticityRate: Math.round(authenticityRate * 10) / 10,
    complianceRate: Math.round(complianceRate * 10) / 10,
    blockchainSuccess,
    activePharmacies,
    totalRevenue: totalRevenue[0]?.total || 0
  };
}

async function getTrendsData(userEmail: string, startDate: Date, timeRange: string) {
  // Get daily/weekly/monthly data based on time range
  const groupBy = timeRange === '7d' ? '$dayOfYear' : timeRange === '30d' ? '$week' : '$month';
  
  const verifications = await QRCode.aggregate([
    { $match: { userEmail, isScanned: true, scannedAt: { $gte: startDate } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$scannedAt" } },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } },
    { $limit: 7 }
  ]);

  const qrGenerations = await QRCode.aggregate([
    { $match: { userEmail, createdAt: { $gte: startDate } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } },
    { $limit: 7 }
  ]);

  const uploads = await Upload.aggregate([
    { $match: { userEmail, createdAt: { $gte: startDate } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } },
    { $limit: 7 }
  ]);

  return {
    verifications: verifications.map(v => v.count),
    qrGenerations: qrGenerations.map(q => q.count),
    uploads: uploads.map(u => u.count),
    counterfeits: [3, 5, 2, 8, 4, 6, 3] // Mock data for now
  };
}

async function getTopDrugs(userEmail: string, startDate: Date) {
  const topDrugs = await Upload.aggregate([
    { $match: { userEmail, createdAt: { $gte: startDate } } },
    {
      $group: {
        _id: '$drug',
        verifications: { $sum: { $ifNull: ['$verificationCount', 0] } },
        qrCodes: { $sum: { $ifNull: ['$qrCodesGenerated', 0] } },
        batches: { $sum: 1 }
      }
    },
    { $sort: { verifications: -1 } },
    { $limit: 5 }
  ]);

  return topDrugs.map(drug => ({
    name: drug._id,
    verifications: drug.verifications,
    qrCodes: drug.qrCodes,
    authenticity: 98.5 // Mock value for now
  }));
}

async function getRegionalData(userEmail: string, startDate: Date) {
  // Mock regional data for now - in a real app, this would come from QR scan locations
  return [
    {
      region: "Lagos",
      verifications: 45620,
      pharmacies: 450,
      counterfeits: 12,
    },
    {
      region: "Abuja",
      verifications: 34200,
      pharmacies: 320,
      counterfeits: 8,
    },
    {
      region: "Port Harcourt",
      verifications: 28900,
      pharmacies: 280,
      counterfeits: 15,
    },
    {
      region: "Kano",
      verifications: 21000,
      pharmacies: 220,
      counterfeits: 6,
    },
    {
      region: "Ibadan",
      verifications: 15950,
      pharmacies: 180,
      counterfeits: 9,
    },
  ];
}

async function getMonthlyStats(userEmail: string, startDate: Date) {
  const monthlyStats = await Upload.aggregate([
    { $match: { userEmail, createdAt: { $gte: startDate } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
        verifications: { $sum: { $ifNull: ['$verificationCount', 0] } },
        qrCodes: { $sum: { $ifNull: ['$qrCodesGenerated', 0] } },
        uploads: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } },
    { $limit: 7 }
  ]);

  return monthlyStats.map(stat => ({
    month: new Date(stat._id + '-01').toLocaleDateString('en-US', { month: 'short' }),
    verifications: stat.verifications,
    qrCodes: stat.qrCodes,
    uploads: stat.uploads
  }));
}

async function getRecentActivity(userEmail: string) {
  const recentUploads = await Upload.find({ userEmail })
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

  return recentUploads.map(upload => ({
    id: (upload._id as mongoose.Types.ObjectId).toString(),
    type: 'upload',
    action: `Uploaded ${upload.drug || 'Unknown Drug'}`,
    description: `${upload.quantity} units, ${upload.records} records`,
    status: upload.status,
    timestamp: upload.createdAt,
    details: {
      fileName: upload.fileName,
      batchId: upload.batchId,
      blockchainTx: upload.blockchainTx
    }
  }));
}
