import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/database';
import User from '@/lib/models/User';
import Upload from '@/lib/models/Upload';
import QRCode from '@/lib/models/QRCode';
import Report from '@/lib/models/Report';
import Verification from '@/lib/models/Verification';
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
    
    if (userRole !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin role required.' });
    }

    if (!userEmail) {
      return res.status(401).json({ error: 'User email required' });
    }

    await dbConnect();

    // Get date ranges for analytics
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    // Aggregate user statistics
    const userStats = await User.aggregate([
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          activeUsers: { $sum: { $cond: ['$isActive', 1, 0] } },
          verifiedUsers: { $sum: { $cond: ['$isVerified', 1, 0] } },
          usersByRole: {
            $push: {
              role: '$role',
              email: '$email',
              isActive: '$isActive',
              lastLogin: '$lastLogin',
              createdAt: '$createdAt'
            }
          }
        }
      }
    ]);

    // Get role distribution
    const roleDistribution = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get recent users (last 30 days)
    const recentUsers = await User.find({
      createdAt: { $gte: thirtyDaysAgo }
    })
    .sort({ createdAt: -1 })
    .limit(10)
    .select('email role isActive lastLogin createdAt')
    .lean();

    // Aggregate upload/batch statistics
    const uploadStats = await Upload.aggregate([
      {
        $group: {
          _id: null,
          totalBatches: { $sum: 1 },
          totalQuantity: { $sum: { $ifNull: ['$quantity', 0] } },
          totalQRCodesGenerated: { $sum: { $ifNull: ['$qrCodesGenerated', 0] } },
          batchesByStatus: {
            $push: {
              status: '$status',
              drug: '$drug',
              manufacturer: '$manufacturer'
            }
          }
        }
      }
    ]);

    // Get recent batches
    const recentBatches = await Upload.find({
      createdAt: { $gte: thirtyDaysAgo }
    })
    .sort({ createdAt: -1 })
    .limit(5)
    .select('drug batchId manufacturer status quantity createdAt')
    .lean();

    // Aggregate QR code statistics
    const qrCodeStats = await QRCode.aggregate([
      {
        $group: {
          _id: null,
          totalQRCodes: { $sum: 1 },
          totalDownloads: { $sum: { $ifNull: ['$downloadCount', 0] } },
          totalVerifications: { $sum: { $ifNull: ['$verificationCount', 0] } },
          scannedQRCodes: { $sum: { $cond: ['$isScanned', 1, 0] } }
        }
      }
    ]);

    // Get verification statistics
    const verificationStats = await Verification.aggregate([
      {
        $group: {
          _id: null,
          totalVerifications: { $sum: 1 },
          successfulVerifications: { $sum: { $cond: ['$isValid', 1, 0] } },
          failedVerifications: { $sum: { $cond: ['$isValid', 0, 1] } }
        }
      }
    ]);

    // Get report statistics
    const reportStats = await Report.aggregate([
      {
        $group: {
          _id: null,
          totalReports: { $sum: 1 },
          reportsByType: {
            $push: {
              type: '$type',
              status: '$status'
            }
          }
        }
      }
    ]);

    // Calculate system metrics (mock for now, could be enhanced with real system monitoring)
    const systemMetrics = {
      uptime: 99.98, // Mock - could be calculated from server start time
      responseTime: 45, // Mock - could be calculated from request logs
      storageUsed: 67, // Mock - could be calculated from disk usage
      memoryUsage: 78, // Mock - could be calculated from system metrics
      cpuUsage: 45, // Mock - could be calculated from system metrics
      networkStatus: 'optimal'
    };

    // Calculate security metrics
    const securityMetrics = {
      twoFactorEnabled: 89, // Mock - could be calculated from user preferences
      strongPasswords: 94, // Mock - could be calculated from password strength
      sessionSecurity: 100, // Mock - could be calculated from session data
      sslActive: 100,
      ddosProtection: 100,
      firewallStatus: 100,
      encryption: 'AES-256',
      backupStatus: 'Daily',
      compliance: 'GDPR Ready'
    };

    // Calculate activity metrics
    const activityMetrics = {
      activeUsersLastHour: await User.countDocuments({
        lastLogin: { $gte: oneHourAgo }
      }),
      activeUsersLastDay: await User.countDocuments({
        lastLogin: { $gte: oneDayAgo }
      }),
      activeUsersLastWeek: await User.countDocuments({
        lastLogin: { $gte: sevenDaysAgo }
      }),
      newUsersLastMonth: await User.countDocuments({
        createdAt: { $gte: thirtyDaysAgo }
      }),
      newBatchesLastMonth: await Upload.countDocuments({
        createdAt: { $gte: thirtyDaysAgo }
      }),
      newQRCodesLastMonth: await QRCode.countDocuments({
        createdAt: { $gte: thirtyDaysAgo }
      })
    };

    // Format the response
    const response = {
      stats: {
        totalUsers: userStats[0]?.totalUsers || 0,
        activeUsers: userStats[0]?.activeUsers || 0,
        verifiedUsers: userStats[0]?.verifiedUsers || 0,
        systemUptime: systemMetrics.uptime,
        securityIncidents: 0, // Mock - could be calculated from security logs
        auditLogs: activityMetrics.activeUsersLastDay * 10, // Mock calculation
        apiCalls: activityMetrics.activeUsersLastHour * 100, // Mock calculation
      },
      roleDistribution: roleDistribution.reduce((acc, role) => {
        acc[role._id] = role.count;
        return acc;
      }, {} as Record<string, number>),
      recentUsers: recentUsers.map(user => ({
        id: (user._id as mongoose.Types.ObjectId).toString(),
        name: user.email.split('@')[0], // Use email prefix as name
        role: user.role,
        status: user.isActive ? 'active' : 'inactive',
        lastLogin: user.lastLogin ? 
          `${Math.floor((now.getTime() - user.lastLogin.getTime()) / (1000 * 60 * 60))} hours ago` : 
          'Never'
      })),
      systemHealth: {
        uptime: `${systemMetrics.uptime}%`,
        responseTime: `${systemMetrics.responseTime}ms`,
        activeUsers: activityMetrics.activeUsersLastHour,
        totalUsers: userStats[0]?.totalUsers || 0,
        storageUsed: systemMetrics.storageUsed,
        memoryUsage: systemMetrics.memoryUsage,
        cpuUsage: systemMetrics.cpuUsage,
        networkStatus: systemMetrics.networkStatus,
      },
      securityOverview: {
        authentication: {
          twoFactorEnabled: securityMetrics.twoFactorEnabled,
          strongPasswords: securityMetrics.strongPasswords,
          sessionSecurity: securityMetrics.sessionSecurity
        },
        networkSecurity: {
          sslActive: securityMetrics.sslActive,
          ddosProtection: securityMetrics.ddosProtection,
          firewallStatus: securityMetrics.firewallStatus
        },
        dataProtection: {
          encryption: securityMetrics.encryption,
          backupStatus: securityMetrics.backupStatus,
          compliance: securityMetrics.compliance
        }
      },
      activityMetrics,
      uploadStats: {
        totalBatches: uploadStats[0]?.totalBatches || 0,
        totalQuantity: uploadStats[0]?.totalQuantity || 0,
        totalQRCodesGenerated: uploadStats[0]?.totalQRCodesGenerated || 0,
        recentBatches: recentBatches.map(batch => ({
          id: (batch._id as mongoose.Types.ObjectId).toString(),
          drug: batch.drug,
          batchId: batch.batchId,
          manufacturer: batch.manufacturer,
          status: batch.status,
          quantity: batch.quantity,
          dateCreated: batch.createdAt
        }))
      },
      qrCodeStats: {
        totalQRCodes: qrCodeStats[0]?.totalQRCodes || 0,
        totalDownloads: qrCodeStats[0]?.totalDownloads || 0,
        totalVerifications: qrCodeStats[0]?.totalVerifications || 0,
        scannedQRCodes: qrCodeStats[0]?.scannedQRCodes || 0
      },
      verificationStats: {
        totalVerifications: verificationStats[0]?.totalVerifications || 0,
        successfulVerifications: verificationStats[0]?.successfulVerifications || 0,
        failedVerifications: verificationStats[0]?.failedVerifications || 0,
        successRate: verificationStats[0]?.totalVerifications ? 
          ((verificationStats[0].successfulVerifications / verificationStats[0].totalVerifications) * 100).toFixed(1) : 
          '0'
      },
      reportStats: {
        totalReports: reportStats[0]?.totalReports || 0
      }
    };

    res.status(200).json(response);

  } catch (error) {
    console.error('Error fetching admin dashboard data:', error);
    res.status(500).json({ 
      error: 'Internal server error while fetching admin dashboard data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
