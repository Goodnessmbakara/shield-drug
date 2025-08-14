import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../src/lib/database';
import Report from '../../../src/lib/models/Report';
import User from '../../../src/lib/models/User';
import Upload from '../../../src/lib/models/Upload';
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
        type, 
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      const skip = (pageNum - 1) * limitNum;

      // Build filter query
      const filter: any = {};
      
      if (status && status !== 'all') {
        filter.status = status;
      }
      
      if (type && type !== 'all') {
        filter.type = type;
      }
      
      if (search) {
        filter.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { drugName: { $regex: search, $options: 'i' } },
          { manufacturer: { $regex: search, $options: 'i' } },
          { location: { $regex: search, $options: 'i' } }
        ];
      }

      // Build sort query
      const sort: any = {};
      sort[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

      // Get reports with pagination
      const [reports, totalReports] = await Promise.all([
        Report.find(filter)
          .populate('reportedBy', 'email companyName role')
          .populate('batchId', 'drugName manufacturer batchNumber')
          .sort(sort)
          .skip(skip)
          .limit(limitNum)
          .lean(),
        Report.countDocuments(filter)
      ]);

      // Get summary statistics
      const stats = await Report.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            open: { $sum: { $cond: [{ $eq: ['$status', 'open'] }, 1, 0] } },
            investigating: { $sum: { $cond: [{ $eq: ['$status', 'investigating'] }, 1, 0] } },
            resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
            counterfeit: { $sum: { $cond: [{ $eq: ['$type', 'counterfeit'] }, 1, 0] } },
            quality: { $sum: { $cond: [{ $eq: ['$type', 'quality'] }, 1, 0] } },
            compliance: { $sum: { $cond: [{ $eq: ['$type', 'compliance'] }, 1, 0] } }
          }
        }
      ]);

      // Get recent activity (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const recentActivity = await Report.countDocuments({
        createdAt: { $gte: sevenDaysAgo }
      });

      // Format reports for frontend
      const formattedReports = reports.map(report => ({
        id: report._id,
        type: report.type,
        title: report.title || `${report.type} Report - ${report.drugName || 'Unknown Drug'}`,
        status: report.status,
        submitted: report.createdAt,
        location: report.location || 'Unknown Location',
        reporter: report.reportedBy?.companyName || report.reportedBy?.email || 'Unknown Reporter',
        description: report.description,
        drugName: report.drugName,
        manufacturer: report.manufacturer,
        batchNumber: report.batchId?.batchNumber,
        evidence: report.evidence || [],
        priority: report.priority || 'medium',
        assignedTo: report.assignedTo,
        updatedAt: report.updatedAt
      }));

      // Log the API call
      await auditLogger.log({
        action: 'VIEW_REPORTS',
        category: 'USER_ACTION',
        description: 'Regulatory user viewed reports list',
        userEmail: Array.isArray(userEmail) ? userEmail[0] : userEmail,
        userRole: Array.isArray(userRole) ? userRole[0] : userRole,
        metadata: {
          filters: { status, type, search },
          resultsCount: formattedReports.length,
          totalCount: totalReports
        }
      });

      res.status(200).json({
        reports: formattedReports,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(totalReports / limitNum),
          totalReports,
          hasNextPage: pageNum * limitNum < totalReports,
          hasPrevPage: pageNum > 1
        },
        statistics: stats[0] || {
          total: 0,
          open: 0,
          investigating: 0,
          resolved: 0,
          counterfeit: 0,
          quality: 0,
          compliance: 0
        },
        recentActivity
      });

    } else {
      res.setHeader('Allow', ['GET']);
      res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Error in regulatory reports API:', error);
    
    await auditLogger.log({
      action: 'ERROR',
      category: 'SYSTEM_EVENT',
      description: 'Error in regulatory reports API',
      userEmail: Array.isArray(userEmail) ? userEmail[0] : userEmail,
      userRole: Array.isArray(userRole) ? userRole[0] : userRole,
      metadata: {
        error: error instanceof Error ? error.message : 'Unknown error',
        endpoint: '/api/regulatory/reports'
      }
    });

    res.status(500).json({ 
      error: 'Failed to fetch reports',
      timestamp: new Date().toISOString()
    });
  }
}
