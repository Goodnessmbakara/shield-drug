import { NextApiRequest, NextApiResponse } from 'next';
import { NextApiResponseServerIO } from '@/lib/types';

// In-memory progress store (in production, use Redis or database)
const uploadProgress = new Map<string, {
  stage: string;
  progress: number;
  message: string;
  totalQuantity: number;
  processedQuantity: number;
  estimatedTimeRemaining: number;
  isComplete: boolean;
  error?: string;
}>();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponseServerIO
) {
  if (req.method === 'GET') {
    // Get progress for a specific upload
    const { uploadId } = req.query;
    
    if (!uploadId || typeof uploadId !== 'string') {
      return res.status(400).json({ error: 'Upload ID required' });
    }

    const progress = uploadProgress.get(uploadId);
    
    if (!progress) {
      return res.status(404).json({ error: 'Upload progress not found' });
    }

    return res.status(200).json(progress);
  }

  if (req.method === 'POST') {
    // Update progress for a specific upload
    const { uploadId, stage, progress, message, totalQuantity, processedQuantity, estimatedTimeRemaining, isComplete, error } = req.body;

    if (!uploadId) {
      return res.status(400).json({ error: 'Upload ID required' });
    }

    uploadProgress.set(uploadId, {
      stage: stage || 'processing',
      progress: progress || 0,
      message: message || 'Processing...',
      totalQuantity: totalQuantity || 0,
      processedQuantity: processedQuantity || 0,
      estimatedTimeRemaining: estimatedTimeRemaining || 0,
      isComplete: isComplete || false,
      error
    });

    return res.status(200).json({ success: true });
  }

  if (req.method === 'DELETE') {
    // Clean up progress data
    const { uploadId } = req.query;
    
    if (uploadId && typeof uploadId === 'string') {
      uploadProgress.delete(uploadId);
    }

    return res.status(200).json({ success: true });
  }

  res.status(405).json({ error: 'Method not allowed' });
}

// Helper function to update progress (called from upload-batch.ts)
export function updateUploadProgress(
  uploadId: string,
  data: {
    stage: string;
    progress: number;
    message: string;
    totalQuantity?: number;
    processedQuantity?: number;
    estimatedTimeRemaining?: number;
    isComplete?: boolean;
    error?: string;
  }
) {
  const current = uploadProgress.get(uploadId) || {
    stage: 'processing',
    progress: 0,
    message: 'Processing...',
    totalQuantity: 0,
    processedQuantity: 0,
    estimatedTimeRemaining: 0,
    isComplete: false
  };

  uploadProgress.set(uploadId, {
    ...current,
    ...data
  });

  console.log(`📊 Progress Update [${uploadId}]: ${data.stage} - ${data.progress}% - ${data.message}`);
}

// Helper function to estimate processing time
export function estimateProcessingTime(totalQuantity: number): number {
  // Base estimation: 2 seconds per 100 units for blockchain transactions
  const baseTime = Math.ceil(totalQuantity / 100) * 2;
  
  // Add buffer for network delays and database operations
  const bufferTime = Math.ceil(baseTime * 0.3);
  
  return Math.max(baseTime + bufferTime, 10); // Minimum 10 seconds
}

// Helper function to calculate progress percentage
export function calculateProgress(processed: number, total: number): number {
  if (total === 0) return 0;
  return Math.min(Math.round((processed / total) * 100), 100);
}
