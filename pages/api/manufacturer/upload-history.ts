import { NextApiRequest, NextApiResponse } from 'next';
import { getUploadsByUser, getUploadStats } from '@/lib/db-utils';

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

    // Get query parameters
    const { limit = '10', page = '1' } = req.query;
    const limitNum = parseInt(limit as string);
    const pageNum = parseInt(page as string);

    // Get upload history from database
    const uploads = await getUploadsByUser(userEmail as string, limitNum);
    
    // Transform the data to include proper id field and format dates
    const transformedUploads = uploads.map(upload => ({
      id: (upload._id as any).toString(),
      fileName: upload.fileName,
      drug: upload.drug,
      quantity: upload.quantity,
      status: upload.status,
      date: upload.createdAt ? new Date(upload.createdAt).toISOString() : new Date().toISOString(),
      size: upload.size,
      records: upload.records,
      blockchainTx: upload.blockchainTx,
      manufacturer: upload.manufacturer,
      batchId: upload.batchId,
      qrCodesGenerated: upload.qrCodesGenerated || 0,
      processingTime: upload.processingTime,
      userEmail: upload.userEmail
    }));
    
    // Get upload statistics
    const stats = await getUploadStats(userEmail as string);

    // Calculate pagination info
    const totalUploads = stats.totalUploads;
    const totalPages = Math.ceil(totalUploads / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    res.status(200).json({
      uploads: transformedUploads,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalUploads,
        hasNextPage,
        hasPrevPage,
        limit: limitNum
      },
      stats: {
        totalUploads: stats.totalUploads,
        successfulUploads: stats.successfulUploads,
        failedUploads: stats.failedUploads,
        totalRecords: stats.totalRecords,
        totalQuantity: stats.totalQuantity,
        successRate: stats.totalUploads > 0 ? (stats.successfulUploads / stats.totalUploads * 100).toFixed(1) : '0'
      }
    });

  } catch (error) {
    console.error('Error fetching upload history:', error);
    res.status(500).json({ 
      error: 'Internal server error while fetching upload history' 
    });
  }
}
