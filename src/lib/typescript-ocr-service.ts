/**
 * TypeScript OCR Service
 * Uses Google Cloud Vision API for pharmaceutical text extraction
 *
 * Features:
 * - High-accuracy text detection
 * - Document text detection for structured text
 * - Optimized for pharmaceutical packaging
 */

export interface TypeScriptOCRResult {
  success: boolean;
  text: string;
  text_lines: string[];
  model: string;
  confidence: number;
  method: 'google-vision' | 'tesseract' | 'none';
  error?: string;
}

export interface TypeScriptOCROptions {
  prompt?: string;
  imageUrl?: string;
}

/**
 * Extract text from an image using Google Cloud Vision API
 *
 * @param imageData - Base64-encoded image or data URL
 * @param options - Optional configuration
 * @returns Promise with OCR result
 */
export async function extractTextWithTypeScriptOCR(
  imageData: string,
  options: TypeScriptOCROptions = {}
): Promise<TypeScriptOCRResult> {
  // Use Google Cloud Vision API (required)
  if (!process.env.GOOGLE_CLOUD_API_KEY) {
    console.error('❌ Google Cloud Vision API key not found - please set GOOGLE_CLOUD_API_KEY in .env');
    throw new Error('Google Cloud Vision API key is required');
  }

  try {
    const result = await extractTextWithGoogleVision(imageData);
    if (result.success && result.text.trim().length > 0) {
      return result;
    }

    // If no text found, return empty result
    return {
      success: false,
      text: '',
      text_lines: [],
      model: 'google-cloud-vision-api',
      confidence: 0,
      method: 'google-vision',
      error: 'No text detected in image',
    };
  } catch (error) {
    console.error('❌ Google Cloud Vision OCR failed:', error);
    throw error; // Re-throw error - no fallback
  }
}

/**
 * Extract text using Google Cloud Vision API
 */
async function extractTextWithGoogleVision(
  imageData: string
): Promise<TypeScriptOCRResult> {
  const apiKey = process.env.GOOGLE_CLOUD_API_KEY;
  if (!apiKey) {
    throw new Error('Google Cloud Vision API key not configured');
  }

  // Extract base64 data (remove data URL prefix if present)
  const base64Image = imageData.replace(/^data:image\/[a-z]+;base64,/, '');

  const response = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          {
            image: {
              content: base64Image,
            },
            features: [
              {
                type: 'TEXT_DETECTION',
                maxResults: 50,
              },
              {
                type: 'DOCUMENT_TEXT_DETECTION',
                maxResults: 1,
              },
            ],
          },
        ],
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google Vision API error: ${response.status} - ${errorText}`);
  }

  const result = await response.json();

  if (result.responses?.[0]?.error) {
    throw new Error(`Google Vision API error: ${result.responses[0].error.message}`);
  }

  // Extract text from response
  const textAnnotations = result.responses?.[0]?.textAnnotations || [];
  const fullTextAnnotation = result.responses?.[0]?.fullTextAnnotation;

  let extractedText = '';
  let textLines: string[] = [];

  // Prefer full text annotation (more accurate)
  if (fullTextAnnotation?.text) {
    extractedText = fullTextAnnotation.text;
    textLines = extractedText
      .split('\n')
      .map((line: string) => line.trim())
      .filter((line: string) => line.length > 0);
  } else if (textAnnotations.length > 0) {
    // Use first annotation as full text, rest as individual detections
    extractedText = textAnnotations[0].description || '';
    textLines = textAnnotations
      .slice(1)
      .map((annotation: any) => annotation.description?.trim() || '')
      .filter((text: string) => text.length > 0);
  }

  // Calculate confidence based on number of detections
  const confidence = textAnnotations.length > 0 
    ? Math.min(0.95, 0.5 + (textAnnotations.length * 0.05))
    : 0;

  return {
    success: extractedText.length > 0,
    text: extractedText,
    text_lines: textLines,
    model: 'google-cloud-vision-api',
    confidence,
    method: 'google-vision',
  };
}


/**
 * Extract pharmaceutical text using Google Cloud Vision API
 */
export async function extractPharmaceuticalText(
  imageData: string,
  options: Omit<TypeScriptOCROptions, 'prompt'> = {}
): Promise<TypeScriptOCRResult> {
  // Google Vision is optimized for text detection and works well for pharmaceutical packaging
  return extractTextWithTypeScriptOCR(imageData, options);
}

