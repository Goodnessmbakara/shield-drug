import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/database';
import QRCode from '@/lib/models/QRCode';
import Verification from '@/lib/models/Verification';
import Report from '@/lib/models/Report';
import Batch from '@/lib/models/Batch';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await dbConnect();
    const { userEmail, type, dateRange } = req.query;

    if (!userEmail || typeof userEmail !== 'string') {
      return res.status(400).json({ error: 'User email is required' });
    }

    if (req.method === 'GET') {
      const reportsData = await getPharmacistReports(
        userEmail, 
        type as string, 
        dateRange as string
      );
      return res.status(200).json({
        success: true,
        data: reportsData
      });
    } else if (req.method === 'POST') {
      const { reportType, dateRange: bodyDateRange, title, description } = req.body;
      const reportResult = await generateReport(
        userEmail, 
        reportType, 
        bodyDateRange, 
        title,
        description
      );
      return res.status(200).json({
        success: true,
        data: reportResult
      });
    }
  } catch (error) {
    console.error('Error handling pharmacist reports:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function getPharmacistReports(userEmail: string, type?: string, dateRangeFilter?: string) {
  // Calculate date range
  let startDate = new Date();
  switch (dateRangeFilter) {
    case '7d':
      startDate.setDate(startDate.getDate() - 7);
      break;
    case '30d':
    default:
      startDate.setDate(startDate.getDate() - 30);
      break;
    case '90d':
      startDate.setDate(startDate.getDate() - 90);
      break;
    case '1y':
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
  }

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Build query for reports
  const reportQuery: any = { 
    $or: [
      { reportedBy: userEmail },
      { userEmail: userEmail }
    ]
  };
  
  if (type && type !== 'all') {
    reportQuery.type = type;
  }

  // Get report statistics
  const totalReports = await Report.countDocuments(reportQuery);
  
  const completedReports = await Report.countDocuments({ 
    ...reportQuery,
    status: { $in: ['resolved', 'completed'] }
  });
  
  const pendingReports = await Report.countDocuments({ 
    ...reportQuery,
    status: 'pending'
  });
  
  const urgentReports = await Report.countDocuments({ 
    ...reportQuery,
    $or: [{ priority: 'high' }, { status: 'urgent' }]
  });

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayReports = await Report.countDocuments({
    ...reportQuery,
    createdAt: { $gte: todayStart }
  });

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const weeklyReports = await Report.countDocuments({
    ...reportQuery,
    createdAt: { $gte: sevenDaysAgo }
  });

  const monthlyReports = await Report.countDocuments({
    ...reportQuery,
    createdAt: { $gte: thirtyDaysAgo }
  });

  // Calculate total downloads from all reports
  const downloadStats = await Report.aggregate([
    { $match: reportQuery },
    { $group: { _id: null, totalDownloads: { $sum: '$downloads' } } }
  ]);
  const totalDownloads = downloadStats.length > 0 ? downloadStats[0].totalDownloads : 0;

  const reportSuccessRate = totalReports > 0 ? ((completedReports / totalReports) * 100) : 0;

  // Get recent reports with date filter
  const reportFetchQuery = {
    ...reportQuery,
    createdAt: { $gte: startDate }
  };

  const recentReports = await Report.find(reportFetchQuery)
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  // Get verification data for analytics
  const verificationStats = await Verification.aggregate([
    {
      $match: {
        userEmail: userEmail,
        verifiedAt: { $gte: thirtyDaysAgo }
      }
    },
    {
      $group: {
        _id: null,
        totalScans: { $sum: 1 },
        authentic: { 
          $sum: { $cond: [{ $eq: ['$result', 'authentic'] }, 1, 0] } 
        },
        suspicious: { 
          $sum: { $cond: [{ $eq: ['$result', 'suspicious'] }, 1, 0] } 
        },
        counterfeit: { 
          $sum: { $cond: [{ $eq: ['$result', 'counterfeit'] }, 1, 0] } 
        }
      }
    }
  ]);

  const verificationData = verificationStats.length > 0 ? verificationStats[0] : {
    totalScans: 0,
    authentic: 0,
    suspicious: 0,
    counterfeit: 0
  };

  // Transform reports data
  const transformedReports = recentReports.map(report => ({
    id: (report._id as any).toString(),
    title: report.title || `${report.drugName} Report`,
    type: report.type || getReportType(report.drugName, report.description),
    status: report.status || 'pending',
    dateCreated: report.createdAt ? new Date(report.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    dateRange: report.dateRange || `${report.createdAt ? new Date(report.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]} to ${new Date().toISOString().split('T')[0]}`,
    generatedBy: report.reportedBy || userEmail,
    pharmacy: report.pharmacy || 'Pharmacy',
    summary: report.summary || {
      drugName: report.drugName || 'Unknown Drug',
      batchNumber: report.batchNumber || 'Unknown Batch',
      description: report.description || 'No description provided',
      priority: report.priority || 'medium',
      category: report.category || 'general'
    },
    fileSize: report.fileSize || '1.2 MB',
    format: report.format || 'PDF',
    downloads: report.downloads || 0,
    lastAccessed: report.lastAccessed ? new Date(report.lastAccessed).toISOString() : (report.updatedAt ? new Date(report.updatedAt).toISOString() : new Date().toISOString())
  }));

  return {
    stats: {
      totalReports,
      completedReports,
      pendingReports,
      urgentReports,
      totalDownloads,
      averageReportSize: '1.5 MB',
      reportSuccessRate: Math.round(reportSuccessRate * 10) / 10,
      monthlyReports,
      weeklyReports,
      dailyReports: todayReports
    },
    reports: transformedReports,
    verificationData
  };
}

async function generateReport(
  userEmail: string, 
  reportType: string, 
  dateRange: string, 
  title: string,
  description?: string
) {
  // Create a new report in the database
  const newReport = await Report.create({
    userEmail,
    reportedBy: userEmail,
    title: title || `${reportType} Report`,
    type: reportType,
    status: 'completed',
    priority: 'medium',
    category: reportType,
    drugName: 'Multiple',
    batchNumber: 'Various',
    description: description || `Generated ${reportType} report for ${dateRange}`,
    dateRange: dateRange || 'Last 30 days',
    pharmacy: 'Pharmacy',
    summary: {
      totalItems: 0,
      processedItems: 0,
      successRate: 0,
      errors: 0,
      warnings: 0,
      generatedAt: new Date().toISOString()
    },
    fileSize: '2.1 MB',
    format: 'PDF',
    downloads: 0,
    lastAccessed: new Date()
  });

  return {
    id: newReport._id.toString(),
    title: newReport.title,
    type: newReport.type,
    status: newReport.status,
    dateCreated: new Date(newReport.createdAt).toISOString().split('T')[0],
    dateRange: newReport.dateRange,
    generatedBy: newReport.reportedBy,
    pharmacy: newReport.pharmacy,
    summary: newReport.summary,
    fileSize: newReport.fileSize,
    format: newReport.format,
    downloads: newReport.downloads,
    lastAccessed: new Date(newReport.lastAccessed || newReport.createdAt).toISOString()
  };
}

function getReportType(drugName: string, description: string): string {
  if (description?.toLowerCase().includes('counterfeit') || description?.toLowerCase().includes('fake')) {
    return 'security';
  } else if (description?.toLowerCase().includes('expiry') || description?.toLowerCase().includes('expired')) {
    return 'compliance';
  } else if (description?.toLowerCase().includes('stock') || description?.toLowerCase().includes('inventory')) {
    return 'inventory';
  } else if (description?.toLowerCase().includes('verification') || description?.toLowerCase().includes('authentic')) {
    return 'verification';
  } else {
    return 'general';
  }
}
