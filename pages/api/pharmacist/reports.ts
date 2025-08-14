import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/database';
import QRCode from '@/lib/models/QRCode';
import Verification from '@/lib/models/Verification';
import Report from '@/lib/models/Report';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await dbConnect();
    const { userEmail } = req.query;

    if (!userEmail || typeof userEmail !== 'string') {
      return res.status(400).json({ error: 'User email is required' });
    }

    if (req.method === 'GET') {
      const reportsData = await getPharmacistReports(userEmail);
      return res.status(200).json({
        success: true,
        data: reportsData
      });
    } else if (req.method === 'POST') {
      const { reportType, dateRange, title } = req.body;
      const reportResult = await generateReport(userEmail, reportType, dateRange, title);
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

async function getPharmacistReports(userEmail: string) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Get report statistics
  const totalReports = await Report.countDocuments({ 
    reportedBy: userEmail 
  });
  
  const completedReports = await Report.countDocuments({ 
    reportedBy: userEmail,
    status: 'resolved'
  });
  
  const pendingReports = await Report.countDocuments({ 
    reportedBy: userEmail,
    status: 'pending'
  });
  
  const urgentReports = await Report.countDocuments({ 
    reportedBy: userEmail,
    priority: 'high'
  });

  const todayReports = await Report.countDocuments({
    reportedBy: userEmail,
    createdAt: { $gte: new Date().setHours(0, 0, 0, 0) }
  });

  const weeklyReports = await Report.countDocuments({
    reportedBy: userEmail,
    createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
  });

  const monthlyReports = await Report.countDocuments({
    reportedBy: userEmail,
    createdAt: { $gte: thirtyDaysAgo }
  });

  const reportSuccessRate = totalReports > 0 ? ((completedReports / totalReports) * 100) : 0;

  // Get recent reports
  const recentReports = await Report.find({ reportedBy: userEmail })
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

  // Transform reports data
  const transformedReports = recentReports.map(report => ({
    id: (report._id as any).toString(),
    title: report.title || `${report.drugName} Report`,
    type: getReportType(report.drugName, report.description),
    status: report.status || 'pending',
    dateCreated: report.createdAt ? new Date(report.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    dateRange: `${report.createdAt ? new Date(report.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]} to ${new Date().toISOString().split('T')[0]}`,
    generatedBy: userEmail,
    pharmacy: 'MedPlus Pharmacy', // This could come from user profile
    summary: {
      drugName: report.drugName || 'Unknown Drug',
      batchNumber: report.batchNumber || 'Unknown Batch',
      description: report.description || 'No description provided',
      priority: report.priority || 'medium',
      category: report.category || 'general'
    },
    fileSize: '1.2 MB', // This would be calculated from actual report data
    format: 'PDF',
    downloads: Math.floor(Math.random() * 50) + 1, // This would come from actual download tracking
    lastAccessed: report.updatedAt ? new Date(report.updatedAt).toISOString() : new Date().toISOString()
  }));

  return {
    stats: {
      totalReports,
      completedReports,
      pendingReports,
      urgentReports,
      totalDownloads: Math.floor(Math.random() * 1000) + 100, // This would come from actual data
      averageReportSize: '1.2 MB',
      reportSuccessRate: Math.round(reportSuccessRate * 10) / 10,
      monthlyReports,
      weeklyReports,
      dailyReports: todayReports
    },
    reports: transformedReports
  };
}

async function generateReport(userEmail: string, reportType: string, dateRange: string, title: string) {
  // This would generate an actual report based on the type and date range
  const reportData = {
    id: `RPT${Date.now()}`,
    title: title || `${reportType} Report`,
    type: reportType,
    status: 'completed',
    dateCreated: new Date().toISOString().split('T')[0],
    dateRange: dateRange || 'Last 30 days',
    generatedBy: userEmail,
    pharmacy: 'MedPlus Pharmacy',
    summary: {
      totalItems: Math.floor(Math.random() * 1000) + 100,
      processedItems: Math.floor(Math.random() * 900) + 50,
      successRate: Math.floor(Math.random() * 20) + 80,
      errors: Math.floor(Math.random() * 10),
      warnings: Math.floor(Math.random() * 15)
    },
    fileSize: '2.1 MB',
    format: 'PDF',
    downloads: 0,
    lastAccessed: new Date().toISOString()
  };

  return reportData;
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
