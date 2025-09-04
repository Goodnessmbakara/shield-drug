import { NextApiRequest, NextApiResponse } from 'next';
import multer from 'multer';
import { enhancedDrugDetection } from '@/services/enhancedDrugDetection';

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 1
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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const startTime = Date.now();
  
  try {
    // Handle file upload
    await runMiddleware(req, res, upload.single('drugImage'));

    const file = (req as any).file;
    if (!file) {
      return res.status(400).json({
        error: 'No image file provided',
        message: 'Please upload a drug image for analysis',
      });
    }

    console.log('🔍 Processing drug image with enhanced AI analysis...');
    console.log('File details:', {
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
    });

    // Validate file size
    if (file.size > 10 * 1024 * 1024) {
      return res.status(400).json({
        error: 'File too large',
        message: 'Image file size must be less than 10MB',
      });
    }

    // Convert buffer to base64 data URL for analysis
    const base64Data = file.buffer.toString('base64');
    const mimeType = file.mimetype || 'image/jpeg';
    const imageData = `data:${mimeType};base64,${base64Data}`;
    
    // Analyze drug image using enhanced AI service
    const analysisResult = await enhancedDrugDetection.analyzeDrugImage(imageData);

    const processingTime = Date.now() - startTime;
    console.log(`✅ Enhanced AI drug analysis completed in ${processingTime}ms`);

    // Log analysis results for monitoring
    console.log('📊 Analysis Results:', {
      drugName: analysisResult.drugName,
      status: analysisResult.status,
      confidence: analysisResult.confidence,
      processingTime,
      modelStatus: analysisResult.modelStatus,
      isDrugImage: analysisResult.isDrugImage
    });

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
        apiVersion: '2.0',
        modelStatus: analysisResult.modelStatus
      },
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('❌ Enhanced drug image analysis failed:', error);
    
    // Enhanced error handling with different error types
    let statusCode = 500;
    let errorMessage = 'Failed to analyze drug image';
    let errorDetails = 'Unknown error occurred';

    if (error instanceof Error) {
      errorDetails = error.message;
      
      // Handle specific error types
      if (error.message.includes('file size')) {
        statusCode = 400;
        errorMessage = 'File size exceeds limit';
      } else if (error.message.includes('file type')) {
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
      processingTime,
      timestamp: new Date().toISOString(),
      apiVersion: '2.0'
    });
  }
}
