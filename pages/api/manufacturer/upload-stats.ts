import { NextApiRequest, NextApiResponse } from 'next';
import { getUploadStats, getQRCodeStats } from '@/lib/db-utils';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { userEmail } = req.query;

    if (!userEmail || typeof userEmail !== 'string') {
      return res.status(400).json({ message: 'User email is required' });
    }

    let uploadStats, qrStats;

    try {
      // Get upload statistics for this manufacturer
      uploadStats = await getUploadStats(userEmail);
      
      // Get QR code statistics (for all users, not filtered by userEmail)
      qrStats = await getQRCodeStats();
    } catch (dbError) {
      console.warn('Database connection failed:', dbError);
      
      // Return empty stats when database is not available
      uploadStats = {
        totalUploads: 0,
        successfulUploads: 0,
        failedUploads: 0,
        totalRecords: 0,
        totalQuantity: 0
      };
      
      qrStats = {
        totalQRCodes: 0,
        scannedQRCodes: 0,
        unScannedQRCodes: 0
      };
    }

    // Calculate additional metrics
    const uploadSuccessRate = uploadStats.totalUploads > 0 
      ? Math.round((uploadStats.successfulUploads / uploadStats.totalUploads) * 100 * 10) / 10
      : 0;

    const averageFileSize = uploadStats.totalUploads > 0 
      ? `${Math.round((uploadStats.totalRecords / uploadStats.totalUploads / 1000) * 10) / 10} KB`
      : "0 KB";

    // Blockchain success rate (this would come from blockchain service)
    const blockchainSuccessRate = 0; // Will be calculated from actual blockchain data

    const stats = {
      totalUploads: uploadStats.totalUploads,
      successfulUploads: uploadStats.successfulUploads,
      failedUploads: uploadStats.failedUploads,
      totalRecords: uploadStats.totalRecords,
      averageFileSize,
      uploadSuccessRate,
      blockchainSuccessRate,
      totalQRCodes: qrStats.totalQRCodes,
      scannedQRCodes: qrStats.scannedQRCodes,
      unScannedQRCodes: qrStats.unScannedQRCodes
    };

    res.status(200).json(stats);
  } catch (error) {
    console.error('Error fetching upload stats:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 