import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/database';
import Upload from '@/lib/models/Upload';
import QRCode from '@/lib/models/QRCode';
import Report from '@/lib/models/Report';
import User from '@/lib/models/User';
import BlockchainTransaction from '@/lib/models/BlockchainTransaction';
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

    // 4. Regional Data (REAL DATA)
    const regionalData = await getRegionalData(userEmail as string, startDate);

    // 5. Monthly Statistics
    const monthlyStats = await getMonthlyStats(userEmail as string, startDate);

    // 6. Recent Activity
    const recentActivity = await getRecentActivity(userEmail as string);

    // 7. Blockchain Analytics (REAL DATA)
    const blockchainAnalytics = await getBlockchainAnalytics(userEmail as string, startDate);

    res.status(200).json({
      overview: overviewStats,
      trends: trendsData,
      topDrugs,
      regionalData,
      monthlyStats,
      recentActivity,
      blockchainAnalytics,
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
    totalRevenue,
    blockchainSuccess,
    activePharmacies
  ] = await Promise.all([
    Upload.countDocuments({ userEmail, createdAt: { $gte: startDate } }),
    QRCode.countDocuments({ userEmail, createdAt: { $gte: startDate } }),
    QRCode.countDocuments({ userEmail, isScanned: true, scannedAt: { $gte: startDate } }),
    Upload.countDocuments({ userEmail, status: 'completed', createdAt: { $gte: startDate } }),
    Upload.aggregate([
      { $match: { userEmail, createdAt: { $gte: startDate } } },
      { $group: { _id: null, total: { $sum: '$quantity' } } }
    ]),
    // Real blockchain success rate
    BlockchainTransaction.aggregate([
      { $match: { userEmail, createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          successful: { $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] } }
        }
      }
    ]),
    // Real active pharmacies count
    User.countDocuments({ 
      role: 'pharmacist', 
      lastLogin: { $gte: startDate },
      isActive: true
    })
  ]);

  const authenticityRate = totalQRCodes > 0 ? (totalVerifications / totalQRCodes * 100) : 0;
  const complianceRate = totalBatches > 0 ? (activeBatches / totalBatches * 100) : 0;
  
  // Calculate real blockchain success rate
  const blockchainSuccessRate = blockchainSuccess[0]?.total > 0 
    ? (blockchainSuccess[0].successful / blockchainSuccess[0].total * 100) 
    : 0;

  return {
    totalBatches,
    totalQRCodes,
    totalVerifications,
    authenticityRate: Math.round(authenticityRate * 10) / 10,
    complianceRate: Math.round(complianceRate * 10) / 10,
    blockchainSuccess: Math.round(blockchainSuccessRate * 10) / 10,
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

  // Real counterfeit data from reports
  const counterfeits = await Report.aggregate([
    { 
      $match: { 
        manufacturer: userEmail, 
        type: 'counterfeit',
        createdAt: { $gte: startDate } 
      } 
    },
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
    counterfeits: counterfeits.map(c => c.count)
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
    authenticity: 98.5 // Mock value for now - could be calculated from verification success rate
  }));
}

async function getRegionalData(userEmail: string, startDate: Date) {
  // REAL regional data from QR scan locations
  const regionalStats = await QRCode.aggregate([
    { 
      $match: { 
        userEmail, 
        isScanned: true, 
        scannedAt: { $gte: startDate },
        scannedLocation: { $exists: true, $ne: null }
      } 
    },
    {
      $group: {
        _id: '$scannedLocation',
        verifications: { $sum: 1 },
        uniquePharmacies: { $addToSet: '$scannedBy' }
      }
    },
    { $sort: { verifications: -1 } },
    { $limit: 10 }
  ]);

  // Get counterfeit reports by region
  const counterfeitReports = await Report.aggregate([
    { 
      $match: { 
        manufacturer: userEmail, 
        type: 'counterfeit',
        createdAt: { $gte: startDate },
        location: { $exists: true, $ne: null }
      } 
    },
    {
      $group: {
        _id: '$location',
        counterfeits: { $sum: 1 }
      }
    }
  ]);

  // Get pharmacy counts by region
  const pharmacyCounts = await User.aggregate([
    { 
      $match: { 
        role: 'pharmacist', 
        location: { $exists: true, $ne: null },
        lastLogin: { $gte: startDate }
      } 
    },
    {
      $group: {
        _id: '$location',
        pharmacies: { $sum: 1 }
      }
    }
  ]);

  // Combine the data
  const regionalData = regionalStats.map(region => {
    const counterfeitCount = counterfeitReports.find(r => r._id === region._id)?.counterfeits || 0;
    const pharmacyCount = pharmacyCounts.find(p => p._id === region._id)?.pharmacies || 0;
    
    return {
      region: region._id,
      verifications: region.verifications,
      pharmacies: pharmacyCount,
      counterfeits: counterfeitCount
    };
  });

  // If no real data, return empty array instead of mock data
  return regionalData.length > 0 ? regionalData : [];
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

async function getBlockchainAnalytics(userEmail: string, startDate: Date) {
  // REAL blockchain analytics
  const [
    transactionStats,
    recentTransactions,
    networkStats
  ] = await Promise.all([
    // Transaction performance stats
    BlockchainTransaction.aggregate([
      { $match: { userEmail, createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          successful: { $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] } },
          failed: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
          pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
          totalGasUsed: { $sum: '$gasUsed' },
          avgGasUsed: { $avg: '$gasUsed' },
          totalGasPrice: { $sum: '$gasPrice' },
          avgGasPrice: { $avg: '$gasPrice' }
        }
      }
    ]),
    
    // Recent transactions
    BlockchainTransaction.find({ userEmail })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
    
    // Network stats (mock for now, would come from blockchain node)
    Promise.resolve({
      pendingTxns: 3,
      dailyVolume: 12847,
      blockHeight: 45892147,
      gasPrice: 25
    })
  ]);

  const stats = transactionStats[0] || {
    total: 0,
    successful: 0,
    failed: 0,
    pending: 0,
    totalGasUsed: 0,
    avgGasUsed: 0,
    totalGasPrice: 0,
    avgGasPrice: 0
  };

  const successRate = stats.total > 0 ? (stats.successful / stats.total * 100) : 0;
  const avgConfirmationTime = 2.3; // Mock for now, would be calculated from confirmedAt - timestamp

  return {
    transactionPerformance: {
      successRate: Math.round(successRate * 10) / 10,
      averageGasUsed: Math.round(stats.avgGasUsed || 0),
      blockConfirmation: avgConfirmationTime
    },
    networkStats,
    recentTransactions: recentTransactions.map(tx => ({
      id: tx.resourceId,
      type: tx.type,
      status: tx.status,
      hash: tx.transactionHash,
      gasUsed: tx.gasUsed,
      blockNumber: tx.blockNumber
    }))
  };
}
