/**
 * DeepSeek-OCR Service Wrapper
 * Provides a TypeScript interface to the DeepSeek-OCR Python service
 */

export interface DeepSeekOCRResult {
  success: boolean;
  text: string;
  text_lines: string[];
  model: string;
  confidence: number;
  method: string;
  error?: string;
}

export interface DeepSeekOCROptions {
  prompt?: string;
  imageUrl?: string;
}

/**
 * Extract text from an image using DeepSeek-OCR
 * 
 * @param imageData - Base64-encoded image or data URL
 * @param options - Optional configuration (prompt, imageUrl)
 * @returns Promise with OCR result
 */
export async function extractTextWithDeepSeekOCR(
  imageData: string,
  options: DeepSeekOCROptions = {}
): Promise<DeepSeekOCRResult> {
  try {
    // Use relative URL for API calls (works in both client and server)
    const apiBase = typeof window !== 'undefined' 
      ? '' 
      : process.env.NEXT_PUBLIC_API_URL || `http://localhost:${process.env.PORT || 3000}`;
    const response = await fetch(`${apiBase}/api/ai/deepseek-ocr`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageData,
        imageUrl: options.imageUrl,
        prompt: options.prompt,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const result: DeepSeekOCRResult = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'OCR extraction failed');
    }

    return result;
  } catch (error) {
    console.error('DeepSeek-OCR service error:', error);
    return {
      success: false,
      text: '',
      text_lines: [],
      model: 'deepseek-ai/DeepSeek-OCR',
      confidence: 0,
      method: 'deepseek-ocr',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Extract pharmaceutical text from an image using DeepSeek-OCR
 * Uses a pharmaceutical-focused prompt for better results
 */
export async function extractPharmaceuticalText(
  imageData: string,
  options: Omit<DeepSeekOCROptions, 'prompt'> = {}
): Promise<DeepSeekOCRResult> {
  const pharmaceuticalPrompt = 
    "Extract all visible text from this pharmaceutical product image. " +
    "Focus on: drug names, active ingredients, batch numbers, expiry dates, " +
    "manufacturer information, dosage, and any warnings or instructions. " +
    "List all text clearly and accurately, preserving line breaks and formatting.";

  return extractTextWithDeepSeekOCR(imageData, {
    ...options,
    prompt: pharmaceuticalPrompt,
  });
}

