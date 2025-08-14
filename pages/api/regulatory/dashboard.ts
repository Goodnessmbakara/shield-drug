import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/database';
import User from '@/lib/models/User';
import Upload from '@/lib/models/Upload';
import QRCode from '@/lib/models/QRCode';
import Report from '@/lib/models/Report';
import Verification from '@/lib/models/Verification';
import AuditLog from '@/lib/models/AuditLog';
import { auditLogger } from '@/lib/audit-logger';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Check authentication
  const userRole = req.headers['x-user-role'];
  const userEmail = req.headers['x-user-email'];

  if (!userRole || userRole !== 'regulatory') {
    return res.status(401).json({ error: 'Unauthorized - Regulatory access required' });
  }

  if (!userEmail) {
    return res.status(401).json({ error: 'User email required' });
  }

  try {
    await dbConnect();

    if (req.method === 'GET') {
      // Calculate date ranges for analytics
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      // Get regulatory statistics
      const [
        totalReports,
        openReports,
        resolvedReports,
        investigatingReports,
        totalManufacturers,
        activeManufacturers,
        totalDrugs,
        totalBlockchainTx,
        recentReports,
        complianceStats,
        blockchainStats,
        auditStats
      ] = await Promise.all([
        // Report statistics
        Report.countDocuments(),
        Report.countDocuments({ status: 'open' }),
        Report.countDocuments({ status: 'resolved' }),
        Report.countDocuments({ status: 'investigating' }),
        
        // Manufacturer statistics
        User.countDocuments({ role: 'manufacturer' }),
        User.countDocuments({ 
          role: 'manufacturer', 
          lastLogin: { $gte: thirtyDaysAgo } 
        }),
        
        // Drug/Batch statistics
        Upload.countDocuments(),
        
        // Blockchain transactions (from audit logs)
        AuditLog.countDocuments({ 
          category: 'BLOCKCHAIN',
          action: { $regex: /record|verify|scan/i }
        }),
        
        // Recent reports
        Report.find()
          .sort({ createdAt: -1 })
          .limit(10)
          .populate('reportedBy', 'email companyName')
          .lean(),
        
        // Compliance statistics
        Report.aggregate([
          {
            $group: {
              _id: null,
              totalReports: { $sum: 1 },
              resolvedReports: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
              openReports: { $sum: { $cond: [{ $eq: ['$status', 'open'] }, 1, 0] } },
              investigatingReports: { $sum: { $cond: [{ $eq: ['$status', 'investigating'] }, 1, 0] } }
            }
          }
        ]),
        
        // Blockchain statistics
        AuditLog.aggregate([
          {
            $match: {
              category: 'BLOCKCHAIN',
              timestamp: { $gte: thirtyDaysAgo }
            }
          },
          {
            $group: {
              _id: null,
              totalTx: { $sum: 1 },
              successfulTx: { $sum: { $cond: [{ $eq: ['$level', 'INFO'] }, 1, 0] } },
              failedTx: { $sum: { $cond: [{ $eq: ['$level', 'ERROR'] }, 1, 0] } },
              avgResponseTime: { $avg: '$responseTime' }
            }
          }
        ]),
        
        // Audit statistics for regulatory oversight
        AuditLog.aggregate([
          {
            $match: {
              timestamp: { $gte: thirtyDaysAgo }
            }
          },
          {
            $group: {
              _id: null,
              totalAuditEvents: { $sum: 1 },
              securityEvents: { $sum: { $cond: [{ $eq: ['$category', 'SECURITY'] }, 1, 0] } },
              apiCalls: { $sum: { $cond: [{ $eq: ['$category', 'API_CALL'] }, 1, 0] } },
              userActions: { $sum: { $cond: [{ $eq: ['$category', 'USER_ACTION'] }, 1, 0] } },
              errors: { $sum: { $cond: [{ $eq: ['$level', 'ERROR'] }, 1, 0] } },
              warnings: { $sum: { $cond: [{ $eq: ['$level', 'WARN'] }, 1, 0] } }
            }
          }
        ])
      ]);

      // Calculate compliance rate
      const complianceData = complianceStats[0] || { totalReports: 0, resolvedReports: 0 };
      const complianceRate = complianceData.totalReports > 0 
        ? (complianceData.resolvedReports / complianceData.totalReports) * 100 
        : 0;
      const violationRate = 100 - complianceRate;

      // Get blockchain transaction details
      const blockchainData = blockchainStats[0] || { totalTx: 0, successfulTx: 0, failedTx: 0 };
      const blockchainSuccessRate = blockchainData.totalTx > 0 
        ? (blockchainData.successfulTx / blockchainData.totalTx) * 100 
        : 0;

      // Get recent blockchain transactions
      const recentBlockchainTx = await AuditLog.find({
        category: 'BLOCKCHAIN',
        timestamp: { $gte: sevenDaysAgo }
      })
      .sort({ timestamp: -1 })
      .limit(10)
      .lean();

      // Get manufacturer compliance data
      const manufacturerCompliance = await User.aggregate([
        {
          $match: { role: 'manufacturer' }
        },
        {
          $lookup: {
            from: 'uploads',
            localField: 'email',
            foreignField: 'userEmail',
            as: 'uploads'
          }
        },
        {
          $lookup: {
            from: 'reports',
            localField: 'email',
            foreignField: 'reportedBy',
            as: 'reports'
          }
        },
        {
          $project: {
            email: 1,
            companyName: 1,
            totalBatches: { $size: '$uploads' },
            totalReports: { $size: '$reports' },
            lastLogin: 1,
            isActive: 1
          }
        },
        {
          $sort: { totalBatches: -1 }
        },
        {
          $limit: 10
        }
      ]);

      // Get drug safety statistics
      const drugSafetyStats = await Upload.aggregate([
        {
          $group: {
            _id: null,
            totalDrugs: { $sum: 1 },
            activeDrugs: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
            pendingDrugs: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
            expiredDrugs: { $sum: { $cond: [{ $lt: ['$expiryDate', new Date()] }, 1, 0] } }
          }
        }
      ]);

      const safetyData = drugSafetyStats[0] || { totalDrugs: 0, activeDrugs: 0, pendingDrugs: 0, expiredDrugs: 0 };

      // Log this regulatory dashboard access
      await auditLogger.logUserAction({
        action: 'REGULATORY_DASHBOARD_ACCESS',
        description: 'Regulatory dashboard accessed',
        userEmail: userEmail as string,
        userRole: 'regulatory',
        ipAddress: req.headers['x-forwarded-for'] as string || req.socket.remoteAddress,
        userAgent: req.headers['user-agent'],
        metadata: {
          dashboardType: 'regulatory',
          dataRequested: 'overview'
        }
      });

      res.status(200).json({
        // Overview statistics
        overview: {
          totalReports,
          openReports,
          resolvedReports,
          investigatingReports,
          totalManufacturers,
          activeManufacturers,
          totalDrugs: safetyData.totalDrugs,
          totalBlockchainTx: blockchainData.totalTx,
          complianceRate: Math.round(complianceRate * 10) / 10,
          violationRate: Math.round(violationRate * 10) / 10,
          blockchainSuccessRate: Math.round(blockchainSuccessRate * 10) / 10
        },

        // Recent activity
        recentReports: recentReports.map(report => ({
          id: report._id,
          type: report.type,
          manufacturer: report.manufacturer,
          drug: report.drug,
          status: report.status,
          date: report.createdAt,
          reportedBy: report.reportedBy?.email || 'Unknown',
          description: report.description
        })),

        // Blockchain activity
        blockchainActivity: {
          totalTransactions: blockchainData.totalTx,
          successfulTransactions: blockchainData.successfulTx,
          failedTransactions: blockchainData.failedTx,
          successRate: blockchainSuccessRate,
          averageResponseTime: Math.round(blockchainData.avgResponseTime || 0),
          recentTransactions: recentBlockchainTx.map(tx => ({
            id: tx._id,
            action: tx.action,
            description: tx.description,
            timestamp: tx.timestamp,
            status: tx.level === 'INFO' ? 'success' : 'failed',
            responseTime: tx.responseTime
          }))
        },

        // Manufacturer compliance
        manufacturerCompliance: manufacturerCompliance.map(manufacturer => ({
          email: manufacturer.email,
          companyName: manufacturer.companyName || 'Unknown',
          totalBatches: manufacturer.totalBatches,
          totalReports: manufacturer.totalReports,
          lastLogin: manufacturer.lastLogin,
          isActive: manufacturer.isActive,
          complianceScore: manufacturer.totalBatches > 0 
            ? Math.max(0, 100 - (manufacturer.totalReports / manufacturer.totalBatches) * 100)
            : 100
        })),

        // Drug safety
        drugSafety: {
          totalDrugs: safetyData.totalDrugs,
          activeDrugs: safetyData.activeDrugs,
          pendingDrugs: safetyData.pendingDrugs,
          expiredDrugs: safetyData.expiredDrugs,
          safetyScore: safetyData.totalDrugs > 0 
            ? Math.round((safetyData.activeDrugs / safetyData.totalDrugs) * 100)
            : 100
        },

        // Audit statistics
        auditStats: {
          totalEvents: auditStats[0]?.totalAuditEvents || 0,
          securityEvents: auditStats[0]?.securityEvents || 0,
          apiCalls: auditStats[0]?.apiCalls || 0,
          userActions: auditStats[0]?.userActions || 0,
          errors: auditStats[0]?.errors || 0,
          warnings: auditStats[0]?.warnings || 0
        }
      });

    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Error fetching regulatory dashboard data:', error);
    res.status(500).json({ 
      error: 'Internal server error while fetching regulatory dashboard data' 
    });
  }
}
