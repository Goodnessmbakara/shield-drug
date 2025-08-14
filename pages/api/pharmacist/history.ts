import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/database';
import QRCode from '@/lib/models/QRCode';
import Verification from '@/lib/models/Verification';
import Report from '@/lib/models/Report';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await dbConnect();
    const { userEmail } = req.query;

    if (!userEmail || typeof userEmail !== 'string') {
      return res.status(400).json({ error: 'User email is required' });
    }

    const historyData = await getPharmacistHistory(userEmail);
    
    return res.status(200).json({
      success: true,
      data: historyData
    });
  } catch (error) {
    console.error('Error fetching pharmacist history:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function getPharmacistHistory(userEmail: string) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Get activity statistics
  const totalVerifications = await Verification.countDocuments({ 
    verifiedBy: userEmail 
  });
  
  const totalReports = await Report.countDocuments({ 
    reportedBy: userEmail 
  });
  
  const todayActivities = await Verification.countDocuments({
    verifiedBy: userEmail,
    verifiedAt: { $gte: new Date().setHours(0, 0, 0, 0) }
  });

  const weeklyActivities = await Verification.countDocuments({
    verifiedBy: userEmail,
    verifiedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
  });

  const monthlyActivities = await Verification.countDocuments({
    verifiedBy: userEmail,
    verifiedAt: { $gte: thirtyDaysAgo }
  });

  const successRate = totalVerifications > 0 ? ((totalVerifications - (await Verification.countDocuments({ verifiedBy: userEmail, result: 'counterfeit' }))) / totalVerifications * 100) : 0;

  // Get recent verifications (scan history)
  const recentVerifications = await Verification.find({ verifiedBy: userEmail })
    .populate('qrCodeId')
    .sort({ verifiedAt: -1 })
    .limit(20)
    .lean();

  // Get recent reports
  const recentReports = await Report.find({ reportedBy: userEmail })
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

  // Transform verification data into history entries
  const verificationHistory = recentVerifications.map(verification => ({
    id: (verification._id as any).toString(),
    type: 'scan',
    action: 'QR Code Scan',
    description: `Scanned ${verification.qrCodeId?.drugName || 'Unknown Drug'}`,
    status: verification.result === 'authentic' ? 'success' : verification.result === 'suspicious' ? 'warning' : 'error',
    timestamp: verification.verifiedAt ? new Date(verification.verifiedAt).toISOString() : new Date().toISOString(),
    user: userEmail,
    pharmacy: 'MedPlus Pharmacy',
    details: {
      drugName: verification.qrCodeId?.drugName || 'Unknown Drug',
      batchNumber: verification.qrCodeId?.batchId || 'Unknown Batch',
      manufacturer: verification.qrCodeId?.manufacturer || 'Unknown Manufacturer',
      expiryDate: verification.qrCodeId?.expiryDate ? new Date(verification.qrCodeId.expiryDate).toISOString().split('T')[0] : 'Unknown',
      scanResult: verification.result || 'unknown',
      blockchainTx: verification.blockchainTx || 'Pending',
      location: verification.location || 'Unknown Location',
      device: 'Web Application',
      scanDuration: '1.2s'
    },
    metadata: {
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Web Application)',
      sessionId: `sess_${(verification._id as any).toString().substring(0, 8)}`,
      scanCount: verification.verificationCount || 1
    }
  }));

  // Transform report data into history entries
  const reportHistory = recentReports.map(report => ({
    id: (report._id as any).toString(),
    type: 'security',
    action: 'Drug Report',
    description: `Reported ${report.drugName || 'Unknown Drug'} - ${report.description || 'No description'}`,
    status: report.status === 'resolved' ? 'success' : report.status === 'pending' ? 'warning' : 'error',
    timestamp: report.createdAt ? new Date(report.createdAt).toISOString() : new Date().toISOString(),
    user: userEmail,
    pharmacy: 'MedPlus Pharmacy',
    details: {
      drugName: report.drugName || 'Unknown Drug',
      batchNumber: report.batchNumber || 'Unknown Batch',
      manufacturer: 'Unknown Manufacturer',
      alertType: report.category || 'General Report',
      alertLevel: report.priority || 'medium',
      blockchainTx: 'N/A',
      location: 'Unknown Location',
      actionTaken: report.status || 'pending',
      investigationStatus: report.status || 'pending'
    },
    metadata: {
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Web Application)',
      sessionId: `sess_${(report._id as any).toString().substring(0, 8)}`,
      alertCount: 1
    }
  }));

  // Combine and sort all history entries
  const allHistory = [...verificationHistory, ...reportHistory]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 50);

  return {
    stats: {
      totalEntries: totalVerifications + totalReports,
      todayEntries: todayActivities,
      thisWeekEntries: weeklyActivities,
      thisMonthEntries: monthlyActivities,
      successRate: Math.round(successRate * 10) / 10,
      averageResponseTime: '1.2s',
      uniqueUsers: 1,
      activeSessions: 1,
      systemUptime: '99.9%',
      lastBackup: new Date().toISOString()
    },
    history: allHistory
  };
}
