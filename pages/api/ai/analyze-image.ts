import type { NextApiRequest, NextApiResponse } from 'next';
import { aiDrugAnalysis } from '@/services/aiDrugAnalysis';
import { professionalDrugAnalysis } from '@/services/professionalDrugAnalysis';

// Request timeout in milliseconds
const ANALYSIS_TIMEOUT = parseInt(process.env.AI_MODEL_TIMEOUT || '60000'); // Default 60 seconds

// Error types for structured error responses
const ERROR_TYPES = {
  MODEL_LOADING_FAILED: 'MODEL_LOADING_FAILED',
  NATIVE_ADDON_ERROR: 'NATIVE_ADDON_ERROR',
  DTYPE_ERROR: 'DTYPE_ERROR',
  ANALYSIS_TIMEOUT: 'ANALYSIS_TIMEOUT',
  INVALID_INPUT: 'INVALID_INPUT',
  NETWORK_ERROR: 'NETWORK_ERROR',
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
    fallbackLevel: number;
    processingTime: number;
    requestId: string;
  };
}

// Allow both legacy format (just the result) and new format (with metadata)
type ApiResponse = SuccessResponse | ErrorResponse | any;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const startTime = Date.now();

  // Add request logging
  console.log(`[${requestId}] AI analysis request started`);

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
        reject(new Error('Analysis timeout'));
      }, ANALYSIS_TIMEOUT);
    });

    // Create the analysis promise - try professional analysis first
    const analysisPromise = async () => {
      try {
        console.log(`[${requestId}] Attempting professional drug analysis...`);
        const professionalResult = await professionalDrugAnalysis.analyzeImage(imageData);
        return { result: professionalResult, method: 'professional-multi-modal' };
      } catch (error) {
        console.log(`[${requestId}] Professional analysis failed, falling back to basic analysis:`, error);
        const basicResult = await aiDrugAnalysis.analyzeImage(imageData);
        return { result: basicResult, method: 'basic-heuristic' };
      }
    };

    // Race between analysis and timeout
    const result = await Promise.race([analysisPromise(), timeoutPromise]);

    const processingTime = Date.now() - startTime;

    // Extract the actual result and method information
    const { result: analysisResult, method } = result as any;
    
    // Determine which model was used based on the method
    let modelUsed = method || 'unknown';
    let fallbackLevel = 0;

    if (method === 'professional-multi-modal') {
      modelUsed = 'professional-multi-modal';
      fallbackLevel = 0;
    } else if (analysisResult.imageClassification) {
      switch (analysisResult.imageClassification.detectionMethod) {
        case 'coco-ssd':
          modelUsed = 'coco-ssd';
          fallbackLevel = 1;
          break;
        case 'mobilenet':
          modelUsed = 'mobilenet-v2';
          fallbackLevel = 2;
          break;
        case 'heuristic':
          modelUsed = 'heuristic';
          fallbackLevel = 3;
          break;
      }
    }

    console.log(`[${requestId}] AI analysis completed successfully in ${processingTime}ms using ${modelUsed}`);

    // Check if backward compatibility is enabled
    const useLegacyFormat = process.env.AI_API_LEGACY_FORMAT === 'true';
    
    if (useLegacyFormat) {
      // Return legacy format for backward compatibility
      res.status(200).json(analysisResult);
    } else {
      // Return new format with metadata
      res.status(200).json({
        result: analysisResult,
        metadata: {
          modelUsed,
          fallbackLevel,
          processingTime,
          requestId,
          method
        }
      });
    }

  } catch (error) {
    const processingTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    console.error(`[${requestId}] AI analysis failed after ${processingTime}ms:`, errorMessage);

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
    }

    // Implement retry logic for certain error types
    if (errorType === ERROR_TYPES.NETWORK_ERROR || errorType === ERROR_TYPES.MODEL_LOADING_FAILED) {
      console.log(`[${requestId}] Retrying analysis due to ${errorType}...`);
      
      try {
        // Wait before retry with exponential backoff
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const retryResult = await aiDrugAnalysis.analyzeImage(req.body.imageData);
        const totalProcessingTime = Date.now() - startTime;
        
        console.log(`[${requestId}] Retry successful in ${totalProcessingTime}ms`);
        
        // Determine which model was used based on the retry result
        let retryModelUsed = 'unknown';
        let retryFallbackLevel = 0;

        if (retryResult.imageClassification) {
          switch (retryResult.imageClassification.detectionMethod) {
            case 'coco-ssd':
              retryModelUsed = 'coco-ssd';
              retryFallbackLevel = 0;
              break;
            case 'mobilenet':
              retryModelUsed = 'mobilenet-v2';
              retryFallbackLevel = 1;
              break;
            case 'heuristic':
              retryModelUsed = 'heuristic';
              retryFallbackLevel = 2;
              break;
          }
        }

        res.status(200).json({
          result: retryResult,
          metadata: {
            modelUsed: retryModelUsed,
            fallbackLevel: retryFallbackLevel,
            processingTime: totalProcessingTime,
            requestId
          }
        });
        return;
      } catch (retryError) {
        console.error(`[${requestId}] Retry also failed:`, retryError);
      }
    }

    res.status(500).json({
      error: 'Failed to analyze image',
      errorType,
      details: errorMessage,
      timestamp: new Date().toISOString(),
      requestId
    });
  }
}
