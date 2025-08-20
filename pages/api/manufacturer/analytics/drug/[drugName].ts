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
    const { drugName } = req.query;
    const { timeRange = '30d' } = req.query;

    if (!drugName) {
      return res.status(400).json({ error: 'Drug name is required' });
    }

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

    // 1. Overview Statistics for specific drug
    const overviewStats = await getDrugOverviewStats(userEmail as string, drugName as string, startDate);

    // 2. Trends Data for specific drug
    const trendsData = await getDrugTrendsData(userEmail as string, drugName as string, startDate, timeRange as string);

    // 3. Batch Performance for specific drug
    const batches = await getDrugBatches(userEmail as string, drugName as string, startDate);

    // 4. Regional Data for specific drug
    const regionalData = await getDrugRegionalData(userEmail as string, drugName as string, startDate);

    // 5. Monthly Statistics for specific drug
    const monthlyStats = await getDrugMonthlyStats(userEmail as string, drugName as string, startDate);

    // 6. Recent Activity for specific drug
    const recentActivity = await getDrugRecentActivity(userEmail as string, drugName as string);

    // 7. Blockchain Analytics for specific drug
    const blockchainAnalytics = await getDrugBlockchainAnalytics(userEmail as string, drugName as string, startDate);

    res.status(200).json({
      drugName: drugName as string,
      overview: overviewStats,
      trends: trendsData,
      batches,
      regionalData,
      monthlyStats,
      recentActivity,
      blockchainAnalytics,
      timeRange: timeRange as string,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching drug analytics data:', error);
    res.status(500).json({ 
      error: 'Internal server error while fetching drug analytics data' 
    });
  }
}

// Helper functions for drug-specific analytics
async function getDrugOverviewStats(userEmail: string, drugName: string, startDate: Date) {
  const [
    totalBatches,
    totalQRCodes,
    totalVerifications,
    activeBatches,
    totalRevenue,
    blockchainSuccess,
    firstUpload,
    lastUpload,
    averageBatchSize
  ] = await Promise.all([
    Upload.countDocuments({ 
      userEmail, 
      'metadata.drugName': drugName,
      createdAt: { $gte: startDate } 
    }),
    QRCode.countDocuments({ 
      userEmail, 
      'metadata.drugName': drugName,
      createdAt: { $gte: startDate } 
    }),
    QRCode.countDocuments({ 
      userEmail, 
      'metadata.drugName': drugName,
      isScanned: true, 
      scannedAt: { $gte: startDate } 
    }),
    Upload.countDocuments({ 
      userEmail, 
      'metadata.drugName': drugName,
      status: 'completed', 
      createdAt: { $gte: startDate } 
    }),
    Upload.aggregate([
      { $match: { 
        userEmail, 
        'metadata.drugName': drugName,
        createdAt: { $gte: startDate } 
      }},
      { $group: { _id: null, total: { $sum: '$quantity' } } }
    ]),
    BlockchainTransaction.aggregate([
      { $match: { 
        userEmail, 
        drugName,
        createdAt: { $gte: startDate } 
      }},
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          successful: { $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] } }
        }
      }
    ]),
    Upload.findOne({ 
      userEmail, 
      'metadata.drugName': drugName 
    }).sort({ createdAt: 1 }).select('createdAt'),
    Upload.findOne({ 
      userEmail, 
      'metadata.drugName': drugName 
    }).sort({ createdAt: -1 }).select('createdAt'),
    Upload.aggregate([
      { $match: { 
        userEmail, 
        'metadata.drugName': drugName,
        createdAt: { $gte: startDate } 
      }},
      { $group: { _id: null, avgSize: { $avg: '$quantity' } } }
    ])
  ]);

  const authenticityRate = totalQRCodes > 0 ? (totalVerifications / totalQRCodes * 100) : 0;
  const complianceRate = totalBatches > 0 ? (activeBatches / totalBatches * 100) : 0;
  
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
    totalRevenue: totalRevenue[0]?.total || 0,
    averageBatchSize: Math.round(averageBatchSize[0]?.avgSize || 0),
    firstUploadDate: firstUpload?.createdAt?.toISOString() || '',
    lastUploadDate: lastUpload?.createdAt?.toISOString() || ''
  };
}

async function getDrugTrendsData(userEmail: string, drugName: string, startDate: Date, timeRange: string) {
  const verifications = await QRCode.aggregate([
    { 
      $match: { 
        userEmail, 
        'metadata.drugName': drugName,
        isScanned: true, 
        scannedAt: { $gte: startDate } 
      } 
    },
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
    { 
      $match: { 
        userEmail, 
        'metadata.drugName': drugName,
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

  const uploads = await Upload.aggregate([
    { 
      $match: { 
        userEmail, 
        'metadata.drugName': drugName,
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

  const counterfeits = await Report.aggregate([
    { 
      $match: { 
        manufacturer: userEmail, 
        drugName,
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
    verifications: verifications.map(item => ({ date: item._id, count: item.count })),
    qrGenerations: qrGenerations.map(item => ({ date: item._id, count: item.count })),
    uploads: uploads.map(item => ({ date: item._id, count: item.count })),
    counterfeits: counterfeits.map(item => ({ date: item._id, count: item.count }))
  };
}

async function getDrugBatches(userEmail: string, drugName: string, startDate: Date) {
  const batches = await Upload.aggregate([
    { 
      $match: { 
        userEmail, 
        'metadata.drugName': drugName,
        createdAt: { $gte: startDate } 
      } 
    },
    {
      $lookup: {
        from: 'qrcodes',
        localField: '_id',
        foreignField: 'uploadId',
        as: 'qrCodes'
      }
    },
    {
      $addFields: {
        qrCodesGenerated: { $size: '$qrCodes' },
        verifications: {
          $size: {
            $filter: {
              input: '$qrCodes',
              cond: { $eq: ['$$this.isScanned', true] }
            }
          }
        }
      }
    },
    {
      $project: {
        batchId: 1,
        uploadDate: '$createdAt',
        quantity: 1,
        qrCodesGenerated: 1,
        verifications: 1,
        status: 1,
        authenticityRate: {
          $cond: [
            { $gt: ['$qrCodesGenerated', 0] },
            { $multiply: [{ $divide: ['$verifications', '$qrCodesGenerated'] }, 100] },
            0
          ]
        }
      }
    },
    { $sort: { uploadDate: -1 } },
    { $limit: 20 }
  ]);

  return batches.map(batch => ({
    ...batch,
    uploadDate: batch.uploadDate.toISOString(),
    authenticityRate: Math.round(batch.authenticityRate * 10) / 10
  }));
}

async function getDrugRegionalData(userEmail: string, drugName: string, startDate: Date) {
  // This would typically come from verification data with location information
  // For now, we'll return mock data structure
  return [
    {
      region: 'Lagos',
      verifications: 150,
      counterfeits: 2,
      authenticityRate: 98.7
    },
    {
      region: 'Abuja',
      verifications: 89,
      counterfeits: 1,
      authenticityRate: 98.9
    },
    {
      region: 'Kano',
      verifications: 67,
      counterfeits: 0,
      authenticityRate: 100.0
    }
  ];
}

async function getDrugMonthlyStats(userEmail: string, drugName: string, startDate: Date) {
  const monthlyStats = await Upload.aggregate([
    { 
      $match: { 
        userEmail, 
        'metadata.drugName': drugName,
        createdAt: { $gte: startDate } 
      } 
    },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
        batches: { $sum: 1 },
        qrCodes: { $sum: '$quantity' },
        revenue: { $sum: '$quantity' } // Assuming $1 per unit for revenue calculation
      }
    },
    { $sort: { _id: 1 } },
    { $limit: 12 }
  ]);

  return monthlyStats.map(stat => ({
    month: stat._id,
    batches: stat.batches,
    qrCodes: stat.qrCodes,
    verifications: 0, // This would need to be calculated from QR code verification data
    revenue: stat.revenue
  }));
}

async function getDrugRecentActivity(userEmail: string, drugName: string) {
  const recentUploads = await Upload.find({ 
    userEmail, 
    'metadata.drugName': drugName 
  })
  .sort({ createdAt: -1 })
  .limit(5)
  .select('batchId createdAt status');

  const recentVerifications = await QRCode.find({ 
    userEmail, 
    'metadata.drugName': drugName,
    isScanned: true 
  })
  .sort({ scannedAt: -1 })
  .limit(5)
  .select('qrCodeId scannedAt');

  const activities = [
    ...recentUploads.map(upload => ({
      type: 'upload',
      description: `Batch ${upload.batchId} uploaded`,
      timestamp: upload.createdAt.toISOString(),
      status: upload.status
    })),
    ...recentVerifications.map(qr => ({
      type: 'verification',
      description: `QR Code ${qr.qrCodeId} verified`,
      timestamp: qr.scannedAt?.toISOString() || new Date().toISOString(),
      status: 'success'
    }))
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
   .slice(0, 10);

  return activities;
}

async function getDrugBlockchainAnalytics(userEmail: string, drugName: string, startDate: Date) {
  const transactions = await BlockchainTransaction.find({ 
    userEmail, 
    drugName,
    createdAt: { $gte: startDate } 
  }).sort({ createdAt: -1 });

  const totalTransactions = transactions.length;
  const successfulTransactions = transactions.filter(tx => tx.status === 'confirmed').length;
  const failedTransactions = totalTransactions - successfulTransactions;

  // Calculate average confirmation time (mock data for now)
  const averageConfirmationTime = 2.5; // seconds

  const recentTransactions = transactions.slice(0, 5).map(tx => ({
    hash: tx.hash || 'N/A',
    status: tx.status,
    timestamp: tx.createdAt.toISOString(),
    batchId: tx.batchId || 'N/A'
  }));

  return {
    totalTransactions,
    successfulTransactions,
    failedTransactions,
    averageConfirmationTime,
    recentTransactions
  };
}
