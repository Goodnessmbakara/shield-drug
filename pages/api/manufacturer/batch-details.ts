import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@src/lib/database';
import Upload from '@src/lib/models/Upload';
import QRCode from '@src/lib/models/QRCode';
import mongoose from 'mongoose';

// Structured logging utility
interface LogEntry {
  level: 'ERROR' | 'WARN' | 'INFO';
  timestamp: string;
  requestId: string;
  userEmail?: string;
  userRole?: string;
  batchId?: string;
  message: string;
  error?: any;
  context?: any;
  performance?: {
    operation: string;
    duration: number;
  };
}

function logStructured(entry: LogEntry) {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const logData = {
    ...entry,
    environment: process.env.NODE_ENV,
    ...(isDevelopment && entry.error && { 
      stack: entry.error.stack,
      fullError: entry.error 
    })
  };
  
  if (entry.level === 'ERROR') {
    console.error(JSON.stringify(logData, null, isDevelopment ? 2 : 0));
  } else if (entry.level === 'WARN') {
    console.warn(JSON.stringify(logData, null, isDevelopment ? 2 : 0));
  } else {
    console.log(JSON.stringify(logData, null, isDevelopment ? 2 : 0));
  }
}

// Generate request ID for correlation
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Get request ID from header or generate new one
function getRequestId(req: NextApiRequest): string {
  return (req.headers['x-request-id'] as string) || generateRequestId();
}

function log(level: 'ERROR' | 'WARN' | 'INFO', message: string, context: any = {}) {
  const logData = {
    level,
    ts: new Date().toISOString(),
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
      timestamp: new Date().toISOString()
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
      timestamp: new Date().toISOString()
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
      timestamp: new Date().toISOString()
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
      timestamp: new Date().toISOString()
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
      timestamp: new Date().toISOString()
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
      timestamp: new Date().toISOString()
    });
  }

  // Batch Query Error Logging
  let batchQueryStart = Date.now();
  let batch;
  try {
    batch = await Upload.findOne({ 
      batchId: batchId,
      userEmail: userEmail as string 
    }).lean() as any;

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
      timestamp: new Date().toISOString()
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
      timestamp: new Date().toISOString()
    });
  }

  // QR Code Query Error Logging
  let qrQueryStart = Date.now();
  let qrCodes;
  try {
    qrCodes = await QRCode.find({ 
      'metadata.batchId': batchId,
      userEmail: userEmail as string 
    }).lean();

    log('INFO', 'QR codes query executed successfully', {
      requestId,
      userEmail: userEmail as string,
      userRole: userRole as string,
      batchId,
      qrCodesFound: qrCodes.length,
      operation: 'qr_codes_query',
      duration: Date.now() - qrQueryStart
    });
  } catch (error) {
    log('ERROR', 'QR codes query failed in batch-details API', {
      requestId,
      userEmail: userEmail as string,
      userRole: userRole as string,
      batchId,
      error: error instanceof Error ? error.message : String(error),
      query: { 'metadata.batchId': batchId, userEmail },
      collection: 'QRCode',
      operation: 'qr_codes_query',
      duration: Date.now() - qrQueryStart
    });
    
    return res.status(500).json({ 
      error: 'Failed to retrieve QR codes information',
      requestId,
      timestamp: new Date().toISOString()
    });
  }

  // Aggregation Query Error Logging
  let aggregationStart = Date.now();
  let verificationStats;
  try {
    verificationStats = await QRCode.aggregate([
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
      timestamp: new Date().toISOString()
    });
  }

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

  res.status(200).json({
    ...batchDetails,
    requestId,
    timestamp: new Date().toISOString()
  });
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
