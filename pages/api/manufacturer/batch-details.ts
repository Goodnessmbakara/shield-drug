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

    // Get batch ID from query parameters
    const { batchId } = req.query;
    
    if (!batchId || typeof batchId !== 'string') {
      return res.status(400).json({ error: 'Batch ID is required' });
    }

    await dbConnect();

    // Find the batch by batchId and userEmail
    const batch = await Upload.findOne({ 
      batchId: batchId,
      userEmail: userEmail as string 
    }).lean() as any;

    if (!batch) {
      return res.status(404).json({ error: 'Batch not found' });
    }

    // Get QR codes for this batch
    const qrCodes = await QRCode.find({ 
      'metadata.batchId': batchId,
      userEmail: userEmail as string 
    }).lean();

    // Calculate verification statistics
    const verificationStats = await QRCode.aggregate([
      { 
        $match: { 
          'metadata.batchId': batchId,
          userEmail: userEmail as string 
        } 
      },
      {
        $group: {
          _id: null,
          totalQRCodes: { $sum: 1 },
          totalVerifications: { $sum: { $ifNull: ['$verificationCount', 0] } },
          totalDownloads: { $sum: { $ifNull: ['$downloadCount', 0] } },
          scannedCount: { $sum: { $cond: ['$isScanned', 1, 0] } }
        }
      }
    ]);

    const stats = verificationStats[0] || {
      totalQRCodes: 0,
      totalVerifications: 0,
      totalDownloads: 0,
      scannedCount: 0
    };

    // Calculate authenticity rate (percentage of scanned codes)
    const authenticityRate = stats.totalQRCodes > 0 
      ? Math.round((stats.scannedCount / stats.totalQRCodes) * 100 * 10) / 10
      : 0;

    // Calculate quality score based on various factors
    const qualityScore = calculateQualityScore(batch, stats);

    // Map the batch data to the expected BatchDetails format
    const batchDetails = {
      // Core drug information
      id: (batch._id as mongoose.Types.ObjectId).toString(),
      drugName: batch.drug || 'Unknown Drug',
      batchId: batch.batchId,
      quantity: batch.quantity || 0,
      manufacturer: batch.manufacturer || 'Unknown Manufacturer',
      location: batch.location || 'Unknown Location',
      expiryDate: batch.expiryDate ? new Date(batch.expiryDate).toISOString().split('T')[0] : '',
      nafdacNumber: batch.nafdacNumber || 'NAFDAC-2024-001', // Default value
      manufacturingDate: batch.manufacturingDate || batch.createdAt ? new Date(batch.createdAt).toISOString().split('T')[0] : '',
      activeIngredient: batch.activeIngredient || 'Unknown',
      dosageForm: batch.dosageForm || 'Unknown',
      strength: batch.strength || 'Unknown',
      packageSize: batch.packageSize || 'Unknown',
      storageConditions: batch.storageConditions || 'Store in a cool, dry place',
      description: batch.description || '',
      createdAt: batch.createdAt ? new Date(batch.createdAt).toISOString() : '',
      updatedAt: batch.updatedAt ? new Date(batch.updatedAt).toISOString() : '',

      // Status and processing information
      status: mapStatus(batch.status),
      blockchainTx: batch.blockchainTx || '',
      qrCodesGenerated: batch.qrCodesGenerated || stats.totalQRCodes,
      processingTime: batch.processingTime || null,
      fileHash: batch.fileHash || '',

      // Validation results
      validationResult: batch.validationResult || {
        isValid: true,
        errors: [],
        warnings: []
      },

      // Quality and compliance metrics
      qualityScore: qualityScore,
      complianceStatus: batch.complianceStatus || 'Compliant',
      regulatoryApproval: batch.regulatoryApproval || 'Approved',

      // Verification statistics
      verifications: stats.totalVerifications,
      authenticityRate: authenticityRate,

      // Additional metadata
      fileName: batch.fileName,
      records: batch.records || 0,
      size: batch.size,
      temperature: batch.temperature,
      humidity: batch.humidity
    };

    res.status(200).json(batchDetails);

  } catch (error) {
    console.error('Error fetching batch details:', error);
    res.status(500).json({ 
      error: 'Internal server error while fetching batch details' 
    });
  }
}

// Helper function to map upload status to batch status
function mapStatus(uploadStatus: string): string {
  switch (uploadStatus) {
    case 'completed':
      return 'active';
    case 'pending':
    case 'validating':
    case 'uploading':
    case 'in-progress':
      return 'pending';
    case 'failed':
      return 'expired';
    default:
      return 'pending';
  }
}

// Helper function to calculate quality score
function calculateQualityScore(batch: any, stats: any): number {
  let score = 0;
  let factors = 0;

  // Factor 1: Validation success (30 points)
  if (batch.validationResult?.isValid) {
    score += 30;
  }
  factors++;

  // Factor 2: QR codes generated (20 points)
  if (stats.totalQRCodes > 0) {
    score += 20;
  }
  factors++;

  // Factor 3: Blockchain transaction (20 points)
  if (batch.blockchainTx) {
    score += 20;
  }
  factors++;

  // Factor 4: Verification activity (15 points)
  if (stats.totalVerifications > 0) {
    score += Math.min(15, (stats.totalVerifications / stats.totalQRCodes) * 15);
  }
  factors++;

  // Factor 5: Completeness of data (15 points)
  const requiredFields = ['drug', 'manufacturer', 'batchId', 'quantity', 'expiryDate'];
  const completedFields = requiredFields.filter(field => batch[field]);
  score += (completedFields.length / requiredFields.length) * 15;
  factors++;

  // Calculate average score
  return factors > 0 ? Math.round(score / factors) : 0;
}
