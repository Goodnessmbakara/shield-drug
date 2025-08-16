import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../src/lib/database';
import Upload from '../../../src/lib/models/Upload';
import QRCode from '../../../src/lib/models/QRCode';
import mongoose from 'mongoose';
import { BatchDetails } from '../../../src/lib/types';



// Generate request ID for correlation
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Helper function to format date to ISO string
function formatISO(date: Date | string | null | undefined): string {
  if (!date) return '';
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return '';
    return dateObj.toISOString();
  } catch (error) {
    return '';
  }
}

// Helper function to format date to YYYY-MM-DD format
function formatYMD(date: Date | string | null | undefined): string {
  if (!date) return '';
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return '';
    return dateObj.toISOString().split('T')[0];
  } catch (error) {
    return '';
  }
}

function log(level: 'ERROR' | 'WARN' | 'INFO', message: string, context: any = {}) {
  const logData = {
    level,
    ts: new Date().toISOString(),
    message,
    requestId: context.requestId,
    userEmail: context.userEmail,
    userRole: context.userRole,
    batchId: context.batchId,
    ...context
  };
  
  if (level === 'ERROR') {
    console.error(JSON.stringify(logData));
  } else if (level === 'WARN') {
    console.warn(JSON.stringify(logData));
  } else {
    console.log(JSON.stringify(logData));
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const requestId = generateRequestId();
  const startTime = Date.now();
  
  // Import Error Logging
  try {
    // Validate that all imports are working
    if (!dbConnect || !Upload || !QRCode || !mongoose) {
      throw new Error('Critical module import failure');
    }
  } catch (error) {
    log('ERROR', 'Module import error in batch-details API', {
      requestId,
      error: error instanceof Error ? error.message : String(error),
      method: req.method,
      url: req.url,
      userAgent: req.headers['user-agent']
    });
    
    return res.status(500).json({ 
      error: 'Internal server error: Module loading failed',
      requestId,
      timestamp: formatISO(new Date())
    });
  }

  if (req.method !== 'GET') {
    log('WARN', 'Invalid HTTP method for batch-details endpoint', {
      requestId,
      method: req.method,
      allowedMethod: 'GET',
      url: req.url
    });
    
    return res.status(405).json({ 
      error: 'Method not allowed',
      requestId,
      timestamp: formatISO(new Date())
    });
  }

  // Request Validation Logging
  const userRole = req.headers['x-user-role'];
  const userEmail = req.headers['x-user-email'];
  
  log('INFO', 'Incoming batch-details request', {
    requestId,
    userEmail: userEmail as string,
    userRole: userRole as string,
    method: req.method,
    url: req.url,
    query: req.query,
    headers: {
      'user-agent': req.headers['user-agent'],
      'content-type': req.headers['content-type'],
      'authorization': req.headers.authorization ? '[REDACTED]' : undefined
    }
  });

  // Authentication Validation Logging
  if (userRole !== 'manufacturer') {
    log('WARN', 'Access denied: Invalid user role for batch-details endpoint', {
      requestId,
      userEmail: userEmail as string,
      userRole: userRole as string,
      requiredRole: 'manufacturer',
      providedRole: userRole
    });
    
    return res.status(403).json({ 
      error: 'Access denied. Manufacturer role required.',
      requestId,
      timestamp: formatISO(new Date())
    });
  }

  if (!userEmail) {
    log('WARN', 'Access denied: Missing user email in batch-details request', {
      requestId,
      headers: Object.keys(req.headers).filter(key => key.toLowerCase().includes('user'))
    });
    
    return res.status(401).json({ 
      error: 'User email required',
      requestId,
      timestamp: formatISO(new Date())
    });
  }

  // Parameter Validation Logging
  const { batchId } = req.query;
  
  if (!batchId || typeof batchId !== 'string') {
    log('WARN', 'Invalid batch ID parameter in batch-details request', {
      requestId,
      userEmail: userEmail as string,
      userRole: userRole as string,
      providedBatchId: batchId,
      batchIdType: typeof batchId,
      query: req.query
    });
    
    return res.status(400).json({ 
      error: 'Batch ID is required',
      requestId,
      timestamp: formatISO(new Date())
    });
  }

  log('INFO', 'Request validation passed, proceeding with database operations', {
    requestId,
    userEmail: userEmail as string,
    userRole: userRole as string,
    batchId
  });

  // Database Connection Error Logging
  let dbConnectionStart = Date.now();
  try {
    await dbConnect();
    log('INFO', 'Database connection established successfully', {
      requestId,
      userEmail: userEmail as string,
      userRole: userRole as string,
      batchId,
      duration: Date.now() - dbConnectionStart
    });
  } catch (err) {
    log('ERROR', 'DB connection failed', { 
      errorName: err instanceof Error ? err.name : 'Unknown',
      code: (err as any)?.code || 'UNKNOWN',
      requestId 
    });
    
    const isDevelopment = process.env.NODE_ENV === 'development';
    const errorMessage = isDevelopment 
      ? `Database connection failed: ${err instanceof Error ? err.name : 'Unknown error'}${err instanceof Error && err.stack ? `\n${err.stack}` : ''}`
      : 'Database connection failed. Please try again later.';
    
    return res.status(503).json({ 
      error: errorMessage,
      requestId,
      timestamp: formatISO(new Date())
    });
  }

  // Batch Query Error Logging
  let batchQueryStart = Date.now();
  let batch: any;
  try {
    // Build a filter that tries both _id and batchId when the string is ObjectId-like
    const idOrBatchFilter = mongoose.Types.ObjectId.isValid(batchId)
      ? { $or: [
          { _id: new mongoose.Types.ObjectId(batchId) },
          { batchId }
        ] }
      : { batchId };

    const query = { userEmail: userEmail as string, ...idOrBatchFilter };
    
    batch = await Upload.findOne(query).lean();

    log('INFO', 'Batch query executed successfully', {
      requestId,
      userEmail: userEmail as string,
      userRole: userRole as string,
      batchId,
      batchFound: !!batch,
      operation: 'batch_query',
      duration: Date.now() - batchQueryStart
    });
  } catch (error) {
    log('ERROR', 'Batch query failed in batch-details API', {
      requestId,
      userEmail: userEmail as string,
      userRole: userRole as string,
      batchId,
      error: error instanceof Error ? error.message : String(error),
      query: { batchId, userEmail },
      collection: 'Upload',
      operation: 'batch_query',
      duration: Date.now() - batchQueryStart
    });
    
    return res.status(500).json({ 
      error: 'Failed to retrieve batch information',
      requestId,
      timestamp: formatISO(new Date())
    });
  }

  if (!batch) {
    log('WARN', 'Batch not found in database', {
      requestId,
      userEmail: userEmail as string,
      userRole: userRole as string,
      batchId,
      query: { batchId, userEmail },
      collection: 'Upload'
    });
    
    return res.status(404).json({ 
      error: 'Batch not found',
      requestId,
      timestamp: formatISO(new Date())
    });
  }

  // QR Code statistics aggregation - no need to fetch individual QR code documents

  let aggregationStart = Date.now();
  let verificationStats;
  try {
    verificationStats = await QRCode.aggregate([
      { 
        $match: { 
          $or: [
            { uploadId: batchId },
            { 'metadata.batchId': batchId },
            { uploadId: batch._id?.toString() },
            { 'metadata.batchId': batch.batchId },
            // Support both ObjectId string and ObjectId forms
            ...(mongoose.Types.ObjectId.isValid(batchId) ? [
              { uploadId: new mongoose.Types.ObjectId(batchId).toString() }
            ] : [])
          ],
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

    log('INFO', 'Verification statistics aggregation executed successfully', {
      requestId,
      userEmail: userEmail as string,
      userRole: userRole as string,
      batchId,
      aggregationResult: verificationStats[0] || null,
      operation: 'verification_aggregation',
      duration: Date.now() - aggregationStart
    });
  } catch (error) {
    log('ERROR', 'Verification statistics aggregation failed in batch-details API', {
      requestId,
      userEmail: userEmail as string,
      userRole: userRole as string,
      batchId,
      error: error instanceof Error ? error.message : String(error),
      aggregationPipeline: [
        { $match: { 'metadata.batchId': batchId, userEmail } },
        { $group: { _id: null, totalQRCodes: { $sum: 1 }, totalVerifications: { $sum: { $ifNull: ['$verificationCount', 0] } }, totalDownloads: { $sum: { $ifNull: ['$downloadCount', 0] } }, scannedCount: { $sum: { $cond: ['$isScanned', 1, 0] } } } }
      ],
      collection: 'QRCode',
      operation: 'verification_aggregation',
      duration: Date.now() - aggregationStart
    });
    
    return res.status(500).json({ 
      error: 'Failed to calculate verification statistics',
      requestId,
      timestamp: formatISO(new Date())
    });
  }

  const stats = verificationStats[0] || {
    totalQRCodes: 0,
    totalVerifications: 0,
    totalDownloads: 0,
    scannedCount: 0
  };

  // Calculate authenticity rate (percentage of scanned codes) with division by zero check
  const authenticityRate = stats.totalQRCodes > 0 
    ? Math.round((stats.scannedCount / stats.totalQRCodes) * 100 * 10) / 10
    : 0;

  // Calculate quality score based on various factors
  const qualityScore = calculateQualityScore(batch, stats);

  // Enhanced field validation and default values
  const batchDetails: BatchDetails = {
    // Core drug information with comprehensive validation
    id: (batch._id as mongoose.Types.ObjectId)?.toString() || '',
    drugName: batch.drug || batch.drugName || 'Unknown Drug',
    batchId: batch.batchId || '',
    quantity: Math.max(0, batch.quantity || 0),
    manufacturer: batch.manufacturer || 'Unknown Manufacturer',
    location: batch.location || 'Unknown Location',
    expiryDate: formatISO(batch.expiryDate),
    nafdacNumber: batch.nafdacNumber || 'NAFDAC-PENDING',
    // Manufacturing date uses ISO format for consistency with other date fields
    // Note: Some UI components may expect YYYY-MM-DD format - if needed, use formatYMD() instead
    manufacturingDate: (() => {
      const primaryMfgDate = batch.manufacturingDate ?? batch.createdAt;
      return formatISO(primaryMfgDate);
    })(),
    activeIngredient: batch.activeIngredient || 'Not specified',
    dosageForm: batch.dosageForm || 'Not specified',
    strength: batch.strength || 'Not specified',
    packageSize: batch.packageSize || 'Not specified',
    storageConditions: batch.storageConditions || 'Store in a cool, dry place',
    description: batch.description || '',
    createdAt: formatISO(batch.createdAt),
    updatedAt: formatISO(batch.updatedAt),

    // Status and processing information with enhanced validation
    status: mapStatus(batch.status, batch.expiryDate),
    blockchainTx: batch.blockchainTx || '',
    qrCodesGenerated: Math.max(0, batch.qrCodesGenerated || stats.totalQRCodes || 0),
            processingTime: batch.processingTime ?? null,
    fileHash: batch.fileHash || '',

    // Validation results with proper structure validation
    validationResult: {
      isValid: batch.validationResult?.isValid ?? false,
      errors: Array.isArray(batch.validationResult?.errors) ? batch.validationResult.errors : [],
      warnings: Array.isArray(batch.validationResult?.warnings) ? batch.validationResult.warnings : []
    },

    // Quality and compliance metrics with enhanced defaults
    qualityScore: qualityScore,
    complianceStatus: batch.complianceStatus || 'Pending Review',
    regulatoryApproval: batch.regulatoryApproval || 'Pending',

    // Verification statistics with robust handling
    verifications: Math.max(0, stats.totalVerifications || 0),
    authenticityRate: Math.max(0, Math.min(100, authenticityRate)), // Ensure it's between 0-100

    // Additional metadata with validation
    fileName: batch.fileName || '',
    records: Math.max(0, batch.records || 0),
    size: batch.size || '',
    temperature: batch.temperature || '',
    humidity: batch.humidity || ''
  };

  log('INFO', 'Batch details successfully retrieved and formatted', {
    requestId,
    userEmail: userEmail as string,
    userRole: userRole as string,
    batchId,
    batchDetailsKeys: Object.keys(batchDetails),
    qualityScore,
    authenticityRate,
    totalQRCodes: stats.totalQRCodes,
    totalVerifications: stats.totalVerifications,
    operation: 'total_request',
    duration: Date.now() - startTime
  });

  res.setHeader('X-Request-Id', requestId);
  res.status(200).json(batchDetails);
}

// Helper function to map upload status to batch status
function mapStatus(uploadStatus: string | null | undefined, expiryDate?: string): 'active' | 'pending' | 'expired' | 'failed' {
  if (expiryDate) {
    const e = new Date(expiryDate);
    if (!isNaN(e.getTime()) && e < new Date()) return 'expired';
  }
  
  if (!uploadStatus) {
    return 'pending';
  }
  
  switch (uploadStatus) {
    case 'completed':
      return 'active';
    case 'pending':
    case 'validating':
    case 'uploading':
    case 'in-progress':
      return 'pending';
    case 'failed':
      return 'failed';
    default:
      return 'pending';
  }
}

// Helper function to calculate quality score with enhanced validation
function calculateQualityScore(batch: any, stats: any): number {
  let score = 0;
  let factors = 0;

  try {
    // Factor 1: Validation success (30 points)
    if (batch?.validationResult?.isValid) {
      score += 30;
    }
    factors++;

    // Factor 2: QR codes generated (20 points)
    if (stats?.totalQRCodes > 0) {
      score += 20;
    }
    factors++;

    // Factor 3: Blockchain transaction (20 points)
    if (batch?.blockchainTx) {
      score += 20;
    }
    factors++;

    // Factor 4: Verification activity (15 points)
    if (stats?.totalVerifications > 0 && stats?.totalQRCodes > 0) {
      const verificationRate = Math.min(1, stats.totalVerifications / stats.totalQRCodes);
      score += Math.min(15, verificationRate * 15);
    }
    factors++;

    // Factor 5: Completeness of data (15 points)
    const requiredFields = ['drug', 'manufacturer', 'batchId', 'quantity', 'expiryDate'];
    const completedFields = requiredFields.filter(field => batch?.[field]);
    score += (completedFields.length / requiredFields.length) * 15;
    factors++;

    // Calculate average score with validation
    return Math.round(Math.min(100, score));
  } catch (error) {
    // Return a reasonable default score if calculation fails
    return 50;
  }
}
