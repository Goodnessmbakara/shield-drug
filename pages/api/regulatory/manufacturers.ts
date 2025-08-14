import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../src/lib/database';
import User from '../../../src/lib/models/User';
import Upload from '../../../src/lib/models/Upload';
import Report from '../../../src/lib/models/Report';
import { auditLogger } from '../../../src/lib/audit-logger';

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
      const { 
        page = '1', 
        limit = '20', 
        status, 
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      const skip = (pageNum - 1) * limitNum;

      // Build filter query for manufacturers
      const filter: any = { role: 'manufacturer' };
      
      if (status && status !== 'all') {
        filter.status = status;
      }
      
      if (search) {
        filter.$or = [
          { companyName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { location: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } }
        ];
      }

      // Build sort query
      const sort: any = {};
      sort[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

      // Get manufacturers with pagination
      const [manufacturers, totalManufacturers] = await Promise.all([
        User.find(filter)
          .select('-password -resetToken -resetTokenExpiry')
          .sort(sort)
          .skip(skip)
          .limit(limitNum)
          .lean(),
        User.countDocuments(filter)
      ]);

      // Get additional data for each manufacturer
      const manufacturersWithStats = await Promise.all(
        manufacturers.map(async (manufacturer) => {
          // Get upload statistics
          const [totalUploads, successfulUploads, failedUploads] = await Promise.all([
            Upload.countDocuments({ manufacturer: manufacturer.email }),
            Upload.countDocuments({ 
              manufacturer: manufacturer.email, 
              status: 'completed' 
            }),
            Upload.countDocuments({ 
              manufacturer: manufacturer.email, 
              status: 'failed' 
            })
          ]);

          // Get report statistics
          const [totalReports, openReports, resolvedReports] = await Promise.all([
            Report.countDocuments({ manufacturer: manufacturer.companyName || manufacturer.email }),
            Report.countDocuments({ 
              manufacturer: manufacturer.companyName || manufacturer.email, 
              status: 'open' 
            }),
            Report.countDocuments({ 
              manufacturer: manufacturer.companyName || manufacturer.email, 
              status: 'resolved' 
            })
          ]);

          // Calculate compliance status based on various factors
          let complianceStatus = 'compliant';
          if (failedUploads > successfulUploads * 0.2) {
            complianceStatus = 'violation';
          } else if (openReports > 0) {
            complianceStatus = 'pending';
          }

          // Get last activity
          const lastUpload = await Upload.findOne({ 
            manufacturer: manufacturer.email 
          }).sort({ createdAt: -1 }).select('createdAt').lean();

          const lastLogin = manufacturer.lastLogin || manufacturer.createdAt;

          return {
            id: manufacturer._id,
            name: manufacturer.companyName || manufacturer.email,
            email: manufacturer.email,
            status: complianceStatus,
            registeredDrugs: totalUploads,
            successfulUploads,
            failedUploads,
            totalReports,
            openReports,
            resolvedReports,
            lastAudit: (Array.isArray(lastUpload) ? lastUpload[0]?.createdAt : lastUpload?.createdAt) || manufacturer.createdAt,
            lastLogin,
            location: manufacturer.location || 'Unknown',
            contact: manufacturer.email,
            phone: manufacturer.phone || 'Not provided',
            isActive: manufacturer.isActive !== false,
            createdAt: manufacturer.createdAt,
            updatedAt: manufacturer.updatedAt
          };
        })
      );

      // Get summary statistics
      const stats = await User.aggregate([
        {
          $match: { role: 'manufacturer' }
        },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            active: { $sum: { $cond: [{ $ne: ['$isActive', false] }, 1, 0] } },
            inactive: { $sum: { $cond: [{ $eq: ['$isActive', false] }, 1, 0] } }
          }
        }
      ]);

      // Get recent activity (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentActivity = await User.countDocuments({
        role: 'manufacturer',
        lastLogin: { $gte: thirtyDaysAgo }
      });

      // Log the API call
      await auditLogger.log({
        action: 'VIEW_MANUFACTURERS',
        category: 'USER_ACTION',
        description: 'Regulatory user viewed manufacturers list',
        userEmail: Array.isArray(userEmail) ? userEmail[0] : userEmail,
        userRole: Array.isArray(userRole) ? userRole[0] : userRole,
        metadata: {
          filters: { status, search },
          resultsCount: manufacturersWithStats.length,
          totalCount: totalManufacturers
        }
      });

      res.status(200).json({
        manufacturers: manufacturersWithStats,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(totalManufacturers / limitNum),
          totalManufacturers,
          hasNextPage: pageNum * limitNum < totalManufacturers,
          hasPrevPage: pageNum > 1
        },
        statistics: stats[0] || {
          total: 0,
          active: 0,
          inactive: 0
        },
        recentActivity
      });

    } else {
      res.setHeader('Allow', ['GET']);
      res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Error in regulatory manufacturers API:', error);
    
    await auditLogger.log({
      action: 'ERROR',
      category: 'SYSTEM_EVENT',
      description: 'Error in regulatory manufacturers API',
      userEmail: Array.isArray(userEmail) ? userEmail[0] : userEmail,
      userRole: Array.isArray(userRole) ? userRole[0] : userRole,
      metadata: {
        error: error instanceof Error ? error.message : 'Unknown error',
        endpoint: '/api/regulatory/manufacturers'
      }
    });

    res.status(500).json({ 
      error: 'Failed to fetch manufacturers',
      timestamp: new Date().toISOString()
    });
  }
}
