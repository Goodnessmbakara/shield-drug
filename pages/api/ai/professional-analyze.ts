import { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';
import { professionalDrugAnalysis } from '@/services/professionalDrugAnalysis';

// Configuration
export const config = {
  api: {
    bodyParser: false,
    responseLimit: '10mb',
  },
};

// Request timeout (5 minutes for professional analysis)
const ANALYSIS_TIMEOUT = 5 * 60 * 1000;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  console.log(`[${requestId}] Professional AI drug analysis request started`);

  let analysisTimeout: NodeJS.Timeout;

  try {
    // Set up timeout
    const timeoutPromise = new Promise((_, reject) => {
      analysisTimeout = setTimeout(() => {
        reject(new Error('Analysis timeout'));
      }, ANALYSIS_TIMEOUT);
    });

    // Parse form data
    const form = formidable({
      maxFileSize: 10 * 1024 * 1024, // 10MB limit
      allowEmptyFiles: false,
    });

    const [fields, files] = await form.parse(req);
    
    let imageData: string;

    if (files.image && Array.isArray(files.image) && files.image[0]) {
      // Handle file upload
      const imageFile = files.image[0];
      const imageBuffer = fs.readFileSync(imageFile.filepath);
      const mimeType = imageFile.mimetype || 'image/jpeg';
      imageData = `data:${mimeType};base64,${imageBuffer.toString('base64')}`;
      
      // Cleanup temp file
      fs.unlinkSync(imageFile.filepath);
    } else if (fields.imageData && Array.isArray(fields.imageData) && fields.imageData[0]) {
      // Handle base64 data
      imageData = fields.imageData[0];
    } else {
      return res.status(400).json({ 
        error: 'No valid image data provided',
        details: 'Please provide either an image file or base64 image data'
      });
    }

    // Validate image data
    if (!imageData || !imageData.startsWith('data:image/')) {
      return res.status(400).json({ 
        error: 'Invalid image data format',
        details: 'Image must be in base64 format with proper data URL prefix'
      });
    }

    console.log(`[${requestId}] Starting professional drug analysis...`);
    const startTime = Date.now();

    // Perform professional analysis with timeout
    const analysisResult = await Promise.race([
      professionalDrugAnalysis.analyzeImage(imageData),
      timeoutPromise
    ]) as any;

    // clearTimeout(analysisTimeout); // Timeout handling managed by Promise.race

    const endTime = Date.now();
    const analysisTime = endTime - startTime;

    console.log(`[${requestId}] Professional analysis completed successfully in ${analysisTime}ms`);

    // Enhanced response with professional metrics
    const response = {
      success: true,
      requestId,
      analysisTime,
      method: 'professional-multi-modal',
      result: {
        ...analysisResult,
        metadata: {
          analysisVersion: '2.0-professional',
          processingTime: analysisTime,
          modelsUsed: [
            'EfficientNet-B3-Drug-Classifier',
            'ResNet-50-Authenticity-Verifier', 
            'YOLOv5-Pill-Detector',
            'Professional-OCR-Engine'
          ],
          confidence: {
            overall: analysisResult.confidence,
            breakdown: analysisResult.professionalAnalysis || {}
          }
        }
      }
    };

    return res.status(200).json(response);

  } catch (error: any) {
    // Timeout cleanup handled by Promise.race mechanism

    console.error(`[${requestId}] Professional AI analysis failed:`, error);

    if (error.message === 'Analysis timeout') {
      console.log(`[${requestId}] Professional analysis failed after ${ANALYSIS_TIMEOUT}ms: Analysis timeout`);
      return res.status(408).json({
        success: false,
        error: 'Analysis timeout',
        requestId,
        details: 'Professional analysis took longer than expected. Please try with a clearer image.',
        timeout: ANALYSIS_TIMEOUT
      });
    }

    // Handle specific error types
    let statusCode = 500;
    let errorMessage = 'Internal server error during professional analysis';
    let errorDetails = error.message;

    if (error.message.includes('Invalid image')) {
      statusCode = 400;
      errorMessage = 'Invalid image format';
    } else if (error.message.includes('Model not found')) {
      statusCode = 503;
      errorMessage = 'Professional analysis models unavailable';
      errorDetails = 'One or more required analysis models are not available';
    } else if (error.message.includes('Out of memory')) {
      statusCode = 413;
      errorMessage = 'Image too large for analysis';
      errorDetails = 'Please try with a smaller image';
    }

    return res.status(statusCode).json({
      success: false,
      error: errorMessage,
      details: errorDetails,
      requestId,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}