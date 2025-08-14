import { NextApiRequest, NextApiResponse } from 'next';
import { auditLogger } from '@/lib/audit-logger';
import dbConnect from '@/lib/database';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Check authentication
  const userRole = req.headers['x-user-role'];
  const userEmail = req.headers['x-user-email'];

  if (!userRole || userRole !== 'admin') {
    return res.status(401).json({ error: 'Unauthorized - Admin access required' });
  }

  if (!userEmail) {
    return res.status(401).json({ error: 'User email required' });
  }

  try {
    await dbConnect();

    if (req.method === 'GET') {
      const {
        page = '1',
        limit = '50',
        level = 'all',
        category = 'all',
        search = '',
        startDate,
        endDate,
        userEmail: filterUserEmail
      } = req.query;

      const pageNum = parseInt(page as string, 10);
      const limitNum = Math.min(parseInt(limit as string, 10), 100); // Max 100 logs per request
      const skip = (pageNum - 1) * limitNum;

      // Build filter conditions
      const filter: any = {};

      if (level !== 'all') {
        filter.level = (Array.isArray(level) ? level[0] : level).toUpperCase();
      }

      if (category !== 'all') {
        filter.category = (Array.isArray(category) ? category[0] : category).toUpperCase();
      }

      if (filterUserEmail) {
        filter.userEmail = Array.isArray(filterUserEmail) ? filterUserEmail[0] : filterUserEmail;
      }

      if (startDate || endDate) {
        filter.timestamp = {};
        if (startDate) {
          filter.timestamp.$gte = new Date(startDate as string);
        }
        if (endDate) {
          filter.timestamp.$lte = new Date(endDate as string);
        }
      }

      if (search) {
        filter.$or = [
          { action: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { userEmail: { $regex: search, $options: 'i' } },
          { endpoint: { $regex: search, $options: 'i' } }
        ];
      }

      // Get audit logs with pagination
      const logsResult = await auditLogger.getAuditLogs({
        category: filter.category,
        level: filter.level,
        userEmail: filter.userEmail,
        action: Array.isArray(search) ? search[0] : search,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        skip: skip,
        limit: limitNum
      });

      const logs = logsResult.logs;
      const totalLogs = logsResult.total;

      // Get audit statistics
      const stats = await auditLogger.getAuditStats();

      // Calculate pagination info
      const totalPages = Math.ceil(totalLogs / limitNum);
      const hasNextPage = pageNum < totalPages;
      const hasPrevPage = pageNum > 1;

      res.status(200).json({
        logs: logs.map(log => ({
          id: log._id,
          timestamp: log.timestamp,
          level: log.level,
          category: log.category,
          action: log.action,
          description: log.description,
          userEmail: log.userEmail,
          userRole: log.userRole,
          ipAddress: log.ipAddress,
          endpoint: log.endpoint,
          method: log.method,
          statusCode: log.statusCode,
          responseTime: log.responseTime,
          requestId: log.requestId,
          metadata: log.metadata,
          error: log.error
        })),
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalLogs,
          hasNextPage,
          hasPrevPage,
          limit: limitNum
        },
        stats
      });

    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ 
      error: 'Internal server error while fetching audit logs' 
    });
  }
}
