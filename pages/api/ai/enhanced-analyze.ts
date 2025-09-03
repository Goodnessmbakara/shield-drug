import type { NextApiRequest, NextApiResponse } from 'next';
import { enhancedDrugAnalysis } from '@/services/enhancedDrugAnalysis';

// Request timeout in milliseconds
const ANALYSIS_TIMEOUT = parseInt(process.env.AI_MODEL_TIMEOUT || '30000'); // 30 seconds for enhanced analysis

// Error types for structured error responses
const ERROR_TYPES = {
  MODEL_LOADING_FAILED: 'MODEL_LOADING_FAILED',
  NATIVE_ADDON_ERROR: 'NATIVE_ADDON_ERROR',
  DTYPE_ERROR: 'DTYPE_ERROR',
  ANALYSIS_TIMEOUT: 'ANALYSIS_TIMEOUT',
  INVALID_INPUT: 'INVALID_INPUT',
  NETWORK_ERROR: 'NETWORK_ERROR',
  API_ERROR: 'API_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
};

interface ErrorResponse {
  error: string;
  errorType: string;
  details: string;
  timestamp: string;
  requestId: string;
}

interface SuccessResponse {
  result: any;
  metadata: {
    modelUsed: string;
    apisUsed: string[];
    fallbacksUsed: string[];
    processingTime: number;
    requestId: string;
    dataQuality: 'high' | 'medium' | 'low';
    analysisType: 'enhanced';
  };
}

type ApiResponse = SuccessResponse | ErrorResponse;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  const requestId = `enhanced_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const startTime = Date.now();

  console.log(`[${requestId}] Enhanced AI analysis request started`);

  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method not allowed',
      errorType: ERROR_TYPES.INVALID_INPUT,
      details: 'Only POST requests are supported',
      timestamp: new Date().toISOString(),
      requestId
    });
  }

  try {
    const { imageData } = req.body;

    if (!imageData) {
      return res.status(400).json({
        error: 'Image data is required',
        errorType: ERROR_TYPES.INVALID_INPUT,
        details: 'No image data provided in request body',
        timestamp: new Date().toISOString(),
        requestId
      });
    }

    // Validate image data format
    if (typeof imageData !== 'string' || !imageData.startsWith('data:image/')) {
      return res.status(400).json({
        error: 'Invalid image data format',
        errorType: ERROR_TYPES.INVALID_INPUT,
        details: 'Image data must be a valid base64 data URL',
        timestamp: new Date().toISOString(),
        requestId
      });
    }

    // Create a timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error('Enhanced analysis timeout'));
      }, ANALYSIS_TIMEOUT);
    });

    // Create the enhanced analysis promise
    const analysisPromise = async () => {
      console.log(`[${requestId}] Starting enhanced drug analysis...`);
      const result = await enhancedDrugAnalysis.analyzeImage(imageData);
      return result;
    };

    // Race between analysis and timeout
    const analysisResult = await Promise.race([analysisPromise(), timeoutPromise]);
    const processingTime = Date.now() - startTime;

    // Get analysis summary
    const summary = enhancedDrugAnalysis.getAnalysisSummary(analysisResult);

    console.log(`[${requestId}] Enhanced AI analysis completed successfully in ${processingTime}ms`);
    console.log(`[${requestId}] Analysis summary:`, summary.summary);

    // Return enhanced results
    res.status(200).json({
      result: analysisResult,
      metadata: {
        modelUsed: 'enhanced-multi-api',
        apisUsed: analysisResult.enhancedFeatures.analysisMetadata.apisUsed,
        fallbacksUsed: analysisResult.enhancedFeatures.analysisMetadata.fallbacksUsed,
        processingTime,
        requestId,
        dataQuality: summary.dataQuality,
        analysisType: 'enhanced'
      }
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    console.error(`[${requestId}] Enhanced AI analysis failed after ${processingTime}ms:`, errorMessage);

    // Determine error type for structured response
    let errorType = ERROR_TYPES.UNKNOWN_ERROR;
    
    if (errorMessage.includes('timeout')) {
      errorType = ERROR_TYPES.ANALYSIS_TIMEOUT;
    } else if (errorMessage.includes('tfjs-node') || errorMessage.includes('native')) {
      errorType = ERROR_TYPES.NATIVE_ADDON_ERROR;
    } else if (errorMessage.includes('dtype') || errorMessage.includes('tensor')) {
      errorType = ERROR_TYPES.DTYPE_ERROR;
    } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
      errorType = ERROR_TYPES.NETWORK_ERROR;
    } else if (errorMessage.includes('model') || errorMessage.includes('load')) {
      errorType = ERROR_TYPES.MODEL_LOADING_FAILED;
    } else if (errorMessage.includes('API') || errorMessage.includes('api')) {
      errorType = ERROR_TYPES.API_ERROR;
    }

    res.status(500).json({
      error: 'Failed to analyze image with enhanced methods',
      errorType,
      details: errorMessage,
      timestamp: new Date().toISOString(),
      requestId
    });
  }
}

