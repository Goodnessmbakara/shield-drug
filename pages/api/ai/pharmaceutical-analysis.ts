import { NextApiRequest, NextApiResponse } from 'next';
import multer from 'multer';
import { pharmaceuticalAI } from '@/services/pharmaceuticalAI';

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
});

// Middleware to handle file uploads
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
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Handle file upload
    await runMiddleware(req, res, upload.single('pharmaceuticalImage'));

    const file = (req as any).file;
    if (!file) {
      return res.status(400).json({
        error: 'No image file provided',
        message: 'Please upload a pharmaceutical image for analysis',
      });
    }

    console.log('🔍 Processing pharmaceutical image for AI analysis...');
    console.log('File details:', {
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
    });

    // Analyze pharmaceutical image using the new AI service
    const analysisResult = await pharmaceuticalAI.analyzePharmaceuticalImage(file.buffer);

    console.log('✅ Pharmaceutical analysis completed successfully');

    return res.status(200).json({
      success: true,
      message: 'Pharmaceutical image analyzed successfully',
      data: {
        analysis: analysisResult,
        imageInfo: {
          filename: file.originalname,
          size: file.size,
          mimetype: file.mimetype,
        },
        analysisTimestamp: new Date().toISOString(),
        aiServices: {
          googleVision: process.env.GOOGLE_CLOUD_API_KEY ? 'configured' : 'not configured',
          biomedclip: process.env.BIOMEDCLIP_API_KEY ? 'configured' : 'not configured',
          medicalPills: process.env.MEDICAL_PILLS_API_KEY ? 'configured' : 'not configured',
        }
      },
    });

  } catch (error) {
    console.error('❌ Pharmaceutical analysis failed:', error);
    
    return res.status(500).json({
      error: 'Failed to analyze pharmaceutical image',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      details: {
        timestamp: new Date().toISOString(),
        service: 'pharmaceutical-ai'
      }
    });
  }
}
