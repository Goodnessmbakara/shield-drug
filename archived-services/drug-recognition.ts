import { NextApiRequest, NextApiResponse } from 'next';
import multer from 'multer';
import { aiDrugAnalysis } from '@/services/aiDrugAnalysis';

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

    console.log('🔍 Processing drug image for AI analysis...');
    console.log('File details:', {
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
    });

    // Convert buffer to base64 data URL for TensorFlow.js analysis
    const base64Data = file.buffer.toString('base64');
    const mimeType = file.mimetype || 'image/jpeg';
    const imageData = `data:${mimeType};base64,${base64Data}`;
    
    // Analyze drug image using TensorFlow.js AI service
    const analysisResult = await aiDrugAnalysis.analyzeImage(imageData);

    console.log('✅ AI drug analysis completed successfully');

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
      },
    });

  } catch (error) {
    console.error('❌ Drug image analysis failed:', error);
    
    return res.status(500).json({
      error: 'Failed to analyze drug image',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
} 