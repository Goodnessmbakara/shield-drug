/**
 * TypeScript OCR Service
 * Replaces Python DeepSeek OCR with TypeScript-native solutions
 * 
 * Priority:
 * 1. Google Cloud Vision API (if configured)
 * 2. Tesseract.js (fallback)
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
 * Extract text from an image using TypeScript-native OCR solutions
 * 
 * @param imageData - Base64-encoded image or data URL
 * @param options - Optional configuration
 * @returns Promise with OCR result
 */
export async function extractTextWithTypeScriptOCR(
  imageData: string,
  options: TypeScriptOCROptions = {}
): Promise<TypeScriptOCRResult> {
  // Try Google Cloud Vision API first (if configured)
  if (process.env.GOOGLE_CLOUD_API_KEY) {
    try {
      const result = await extractTextWithGoogleVision(imageData);
      if (result.success && result.text.trim().length > 0) {
        return result;
      }
    } catch (error) {
      console.warn('⚠️ Google Cloud Vision OCR failed, falling back to Tesseract:', error);
    }
  }

  // Fallback to Tesseract.js
  try {
    return await extractTextWithTesseract(imageData);
  } catch (error) {
    console.error('❌ Tesseract OCR failed:', error);
    return {
      success: false,
      text: '',
      text_lines: [],
      model: 'none',
      confidence: 0,
      method: 'none',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
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
 * Extract text using Tesseract.js (fallback)
 */
async function extractTextWithTesseract(
  imageData: string
): Promise<TypeScriptOCRResult> {
  // Import Tesseract dynamically
  const Tesseract = (await import('tesseract.js')).default;

  // Convert data URL to blob or buffer
  let imageBlob: Blob | Buffer;
  
  if (typeof window !== 'undefined') {
    // Browser environment
    const base64Data = imageData.replace(/^data:image\/[a-z]+;base64,/, '');
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    imageBlob = new Blob([byteArray], { type: 'image/jpeg' });
  } else {
    // Node.js environment
    const base64Data = imageData.replace(/^data:image\/[a-z]+;base64,/, '');
    imageBlob = Buffer.from(base64Data, 'base64');
  }

  // Create worker and recognize
  const worker = await Tesseract.createWorker('eng', 1, {
    logger: (m: any) => {
      // Suppress verbose logging in production
      if (process.env.NODE_ENV === 'development' && m.status === 'recognizing text') {
        console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
      }
    },
  });

  try {
    // Configure for pharmaceutical text
    await worker.setParameters({
      tessedit_pageseg_mode: Tesseract.PSM.SINGLE_BLOCK,
      tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,;:()[]{}%+-=<>/\\|&@#$*!?\'"`~_- ',
    });

    const { data } = await worker.recognize(imageBlob);

    const extractedText = data.text || '';
    const textLines = extractedText
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    // Calculate confidence from Tesseract confidence scores
    const avgConfidence = data.words.length > 0
      ? data.words.reduce((sum: number, word: any) => sum + (word.confidence || 0), 0) / data.words.length / 100
      : 0;

    return {
      success: extractedText.length > 0,
      text: extractedText,
      text_lines: textLines,
      model: 'tesseract.js',
      confidence: Math.max(0, Math.min(1, avgConfidence)),
      method: 'tesseract',
    };
  } finally {
    await worker.terminate();
  }
}

/**
 * Extract pharmaceutical text with pharmaceutical-focused configuration
 */
export async function extractPharmaceuticalText(
  imageData: string,
  options: Omit<TypeScriptOCROptions, 'prompt'> = {}
): Promise<TypeScriptOCRResult> {
  // For Google Vision, we can't customize prompts, but it's already optimized for text detection
  // For Tesseract, we use pharmaceutical-specific configuration
  return extractTextWithTypeScriptOCR(imageData, options);
}

