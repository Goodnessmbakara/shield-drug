import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/database';
import Upload from '@/lib/models/Upload';
import QRCode from '@/lib/models/QRCode';
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
    
    if (userRole !== 'manufacturer') {
      return res.status(403).json({ error: 'Access denied. Manufacturer role required.' });
    }

    if (!userEmail) {
      return res.status(401).json({ error: 'User email required' });
    }

    await dbConnect();

    // Get query parameters
    const { 
      page = '1', 
      limit = '10', 
      search = '', 
      status = 'all', 
      drug = 'all',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build filter conditions
    const filter: any = { userEmail: userEmail as string };
    
    if (search) {
      filter.$or = [
        { drug: { $regex: search, $options: 'i' } },
        { fileName: { $regex: search, $options: 'i' } },
        { batchId: { $regex: search, $options: 'i' } }
      ];
    }

    if (status !== 'all') {
      filter.status = status;
    }

    if (drug !== 'all') {
      filter.drug = drug;
    }

    // Build sort conditions
    const sort: any = {};
    sort[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

    // Get batches with pagination
    const batches = await Upload.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Get total count for pagination
    const totalBatches = await Upload.countDocuments(filter);

    // Get statistics
    const stats = await getBatchStats(userEmail as string);

    // Get unique drugs for filter dropdown
    const drugs = await Upload.distinct('drug', { userEmail: userEmail as string });

    // Get unique statuses for filter dropdown
    const statuses = await Upload.distinct('status', { userEmail: userEmail as string });

    // Calculate pagination info
    const totalPages = Math.ceil(totalBatches / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    res.status(200).json({
      batches: batches.map(batch => ({
        id: (batch._id as mongoose.Types.ObjectId).toString(),
        drug: batch.drug || 'Unknown Drug',
        quantity: batch.quantity || 0,
        status: batch.status || 'pending',
        qrGenerated: batch.qrCodesGenerated > 0,
        verifications: batch.verificationCount || 0,
        dateCreated: batch.createdAt,
        expiryDate: batch.expiryDate || null,
        manufacturer: batch.manufacturer || 'Unknown',
        location: batch.location || 'Unknown',
        compliance: batch.compliance || 'Pending',
        fileName: batch.fileName,
        batchId: batch.batchId,
        records: batch.records || 0,
        blockchainTx: batch.blockchainTx
      })),
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalBatches,
        hasNextPage,
        hasPrevPage,
        limit: limitNum
      },
      stats,
      filters: {
        drugs,
        statuses
      }
    });

  } catch (error) {
    console.error('Error fetching batches:', error);
    res.status(500).json({ 
      error: 'Internal server error while fetching batches' 
    });
  }
}

async function getBatchStats(userEmail: string) {
  const [
    totalBatches,
    activeBatches,
    pendingBatches,
    expiredBatches,
    totalQRCodes,
    totalVerifications,
    totalQuantity
  ] = await Promise.all([
    Upload.countDocuments({ userEmail }),
    Upload.countDocuments({ userEmail, status: 'active' }),
    Upload.countDocuments({ userEmail, status: 'pending' }),
    Upload.countDocuments({ userEmail, status: 'expired' }),
    Upload.aggregate([
      { $match: { userEmail } },
      { $group: { _id: null, total: { $sum: { $ifNull: ['$qrCodesGenerated', 0] } } } }
    ]),
    Upload.aggregate([
      { $match: { userEmail } },
      { $group: { _id: null, total: { $sum: { $ifNull: ['$verificationCount', 0] } } } }
    ]),
    Upload.aggregate([
      { $match: { userEmail } },
      { $group: { _id: null, total: { $sum: { $ifNull: ['$quantity', 0] } } } }
    ])
  ]);

  const qrCodesCount = totalQRCodes[0]?.total || 0;
  const verificationsCount = totalVerifications[0]?.total || 0;
  const quantityCount = totalQuantity[0]?.total || 0;

  // Calculate rates (mock values for now)
  const authenticityRate = totalBatches > 0 ? 98.7 : 0;
  const complianceRate = totalBatches > 0 ? 94.2 : 0;

  return {
    totalBatches,
    activeBatches,
    pendingBatches,
    expiredBatches,
    totalQRCodes: qrCodesCount,
    verifications: verificationsCount,
    totalQuantity: quantityCount,
    authenticityRate,
    complianceRate
  };
}
