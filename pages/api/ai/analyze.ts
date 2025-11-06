/**
 * Unified Drug Analysis API Endpoint
 * Consolidates all redundant endpoints into one unified endpoint
 * 
 * Replaces:
 * - /api/ai/analyze-image.ts
 * - /api/ai/drug-recognition.ts
 * - /api/ai/enhanced-drug-detection.ts
 * 
 * Uses: unifiedDrugAnalysis service (OCR-first approach)
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import multer from 'multer';
import { unifiedDrugAnalysis } from '@/services/unifiedDrugAnalysis';

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 1,
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// Helper to handle multer with Next.js API routes
const runMiddleware = (req: NextApiRequest, res: NextApiResponse, fn: any) => {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
};

export const config = {
  api: {
    bodyParser: false, // Disable body parser, we'll use multer
  },
};

interface UnifiedAnalysisResponse {
  success: boolean;
  message: string;
  data: {
    analysis: any;
    imageInfo?: {
      filename: string;
      size: number;
      mimetype: string;
    };
    analysisTimestamp: string;
    processingTime: number;
    apiVersion: string;
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<UnifiedAnalysisResponse | { error: string; details?: string }>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const startTime = Date.now();

  try {
    // Handle file upload (if multipart/form-data)
    let imageData: string;

    // Check if request has file upload or base64 data
    if (req.headers['content-type']?.includes('multipart/form-data')) {
      await runMiddleware(req, res, upload.single('drugImage'));

      const file = (req as any).file;
      if (!file) {
        return res.status(400).json({
          error: 'No image file provided',
          details: 'Please upload a drug image for analysis',
        });
      }

      console.log('🔍 Processing drug image with unified analysis...');
      console.log('File details:', {
        originalName: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
      });

      // Validate file size
      if (file.size > 10 * 1024 * 1024) {
        return res.status(400).json({
          error: 'File too large',
          details: 'Image file size must be less than 10MB',
        });
      }

      // Convert buffer to base64 data URL
      const base64Data = file.buffer.toString('base64');
      const mimeType = file.mimetype || 'image/jpeg';
      imageData = `data:${mimeType};base64,${base64Data}`;

      // Analyze using unified service
      const analysisResult = await unifiedDrugAnalysis.analyzeImage(imageData);

      const processingTime = Date.now() - startTime;
      console.log(`✅ Unified analysis completed in ${processingTime}ms`);

      return res.status(200).json({
        success: true,
        message: 'Drug image analyzed successfully',
        data: {
          analysis: analysisResult,
          imageInfo: {
            filename: file.originalname,
            size: file.size,
            mimetype: file.mimetype,
          },
          analysisTimestamp: new Date().toISOString(),
          processingTime,
          apiVersion: '3.0-unified',
        },
      });
    } else {
      // Handle JSON body with base64 image data
      const { imageData: imageDataFromBody } = req.body;

      if (!imageDataFromBody) {
        return res.status(400).json({
          error: 'Image data is required',
          details: 'Please provide imageData in request body (base64 data URL)',
        });
      }

      // Validate image data format
      if (typeof imageDataFromBody !== 'string' || !imageDataFromBody.startsWith('data:image/')) {
        return res.status(400).json({
          error: 'Invalid image data format',
          details: 'Image data must be a valid base64 data URL (data:image/...)',
        });
      }

      console.log('🔍 Processing drug image with unified analysis (base64)...');

      // Analyze using unified service
      const analysisResult = await unifiedDrugAnalysis.analyzeImage(imageDataFromBody);

      const processingTime = Date.now() - startTime;
      console.log(`✅ Unified analysis completed in ${processingTime}ms`);

      return res.status(200).json({
        success: true,
        message: 'Drug image analyzed successfully',
        data: {
          analysis: analysisResult,
          analysisTimestamp: new Date().toISOString(),
          processingTime,
          apiVersion: '3.0-unified',
        },
      });
    }
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('❌ Unified drug image analysis failed:', error);

    // Enhanced error handling
    let statusCode = 500;
    let errorMessage = 'Failed to analyze drug image';
    let errorDetails = 'Unknown error occurred';

    if (error instanceof Error) {
      errorDetails = error.message;

      // Handle specific error types
      if (error.message.includes('file size')) {
        statusCode = 400;
        errorMessage = 'File size exceeds limit';
      } else if (error.message.includes('file type') || error.message.includes('Only image')) {
        statusCode = 400;
        errorMessage = 'Invalid file type';
      } else if (error.message.includes('memory') || error.message.includes('tensor')) {
        statusCode = 500;
        errorMessage = 'AI model processing error';
      } else if (error.message.includes('timeout')) {
        statusCode = 408;
        errorMessage = 'Analysis timeout';
      }
    }

    return res.status(statusCode).json({
      error: errorMessage,
      details: errorDetails,
    });
  }
}

