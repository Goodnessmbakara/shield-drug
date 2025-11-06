import Tesseract from 'tesseract.js';
import { validatePharmaceuticalText, calculatePharmaceuticalConfidence } from '@/lib/pharmaceutical-patterns';
import { extractPharmaceuticalText as extractWithDeepSeekOCR, type DeepSeekOCRResult } from '@/lib/deepseek-ocr-service';

// OCR Configuration Interface
export interface OCROptions {
  language?: string;
  dpi?: number;
  psm?: number;
  charWhitelist?: string;
  timeout?: number;
  retries?: number;
}

// Pharmaceutical-specific OCR configuration
const PHARMACEUTICAL_OCR_CONFIG = {
  language: 'eng',
  dpi: 300,
  psm: Tesseract.PSM.SINGLE_BLOCK, // Fixed: Use SINGLE_BLOCK instead of AUTO to avoid osd dependency
  charWhitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,;:()[]{}%+-=<>/\\|&@#$*!?\'"`~_',
  timeout: 45000, // Increased timeout for better accuracy
  retries: 3
};

// Simplified configuration using only safe PSM modes (no osd.traineddata dependency)
const OCR_CONFIGS = {
  // For single text lines (batch numbers, expiry dates)
  singleLine: {
    ...PHARMACEUTICAL_OCR_CONFIG,
    psm: Tesseract.PSM.SINGLE_LINE, // Fixed: Use SINGLE_LINE instead of SINGLE_TEXT_LINE
    charWhitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-/:'
  },
  // For text blocks (drug names, instructions)
  textBlock: {
    ...PHARMACEUTICAL_OCR_CONFIG,
    psm: Tesseract.PSM.SINGLE_BLOCK, // Safe PSM mode
    charWhitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,;:()[]{}%+-=<>/\\|&@#$*!?\'"`~_'
  },
  // For uniform text blocks (dense text areas)
  uniform: {
    ...PHARMACEUTICAL_OCR_CONFIG,
    psm: Tesseract.PSM.SINGLE_BLOCK, // Fixed: Use SINGLE_BLOCK since UNIFORM_BLOCK doesn't exist
    charWhitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,;:()[]{}%+-=<>/\\|&@#$*!?\'"`~_'
  }
};

// Worker lifecycle management with isolation
let workerInstance: Tesseract.Worker | null = null;
let isInitializing = false;
let lastUsed = 0;
let isRecognizing = false; // Semaphore for recognition
let workerCorrupted = false; // Track worker corruption
let workerCreationCount = 0; // Track worker recreations

// Environment detection
const isBrowser = typeof window !== 'undefined';

// Force cleanup worker to prevent memory corruption
async function forceCleanupWorker(): Promise<void> {
  if (workerInstance) {
    try {
      console.log('🧹 Force cleaning up corrupted worker...');
      await workerInstance.terminate();
    } catch (error) {
      console.warn('⚠️ Error during worker termination:', error);
    } finally {
      workerInstance = null;
      workerCorrupted = false;
    }
  }
}

// Initialize worker with pharmaceutical-optimized settings using modern Tesseract.js v5+ API
async function initializeWorker(): Promise<Tesseract.Worker> {
  // If worker is corrupted, force recreation
  if (workerCorrupted) {
    console.log('🔄 Worker marked as corrupted, forcing recreation...');
    await forceCleanupWorker();
  }

  if (workerInstance && !isWorkerStale() && !workerCorrupted) {
    return workerInstance;
  }

  if (isInitializing) {
    // Wait for existing initialization
    while (isInitializing) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    if (!workerInstance) {
      throw new Error('Worker initialization failed');
    }
    return workerInstance;
  }

  isInitializing = true;
  workerCreationCount++;

  try {
    // Force cleanup of any existing worker
    await forceCleanupWorker();

    console.log(`🔄 Creating new Tesseract.js worker (attempt #${workerCreationCount})...`);
    
    // Use Tesseract.js v5+ API - createWorker with language and options
    const language = PHARMACEUTICAL_OCR_CONFIG.language || 'eng';
    
    // Fixed: createWorker signature (language, oem, options)
    // Returns a Worker that's already initialized
    const worker = await Tesseract.createWorker(language, 1);
    
    workerInstance = worker;

    // Set pharmaceutical-optimized parameters
    // Note: PSM enum should be passed as enum value, not string
    await workerInstance.setParameters({
      tessedit_char_whitelist: PHARMACEUTICAL_OCR_CONFIG.charWhitelist,
      tessedit_pageseg_mode: PHARMACEUTICAL_OCR_CONFIG.psm, // Pass enum directly
      preserve_interword_spaces: '1',
      user_defined_dpi: PHARMACEUTICAL_OCR_CONFIG.dpi.toString(),
      textord_heavy_nr: '1', // Better noise reduction
      textord_min_linesize: '2', // Minimum line size for small text
      tessedit_do_invert: '0', // Don't invert colors
      tessedit_image_border: '20', // Add border for better recognition
    });

    lastUsed = Date.now();
    workerCorrupted = false; // Reset corruption flag
    console.log('✅ OCR Worker initialized successfully with modern API');
    
    return workerInstance;

  } catch (error) {
    console.error('❌ Failed to initialize OCR worker:', error);
    workerCorrupted = true; // Mark as corrupted
    await forceCleanupWorker();
    throw error;
  } finally {
    isInitializing = false;
  }
}

// Check if worker is stale (unused for more than 5 minutes)
function isWorkerStale(): boolean {
  return Date.now() - lastUsed > 5 * 60 * 1000;
}

// Cleanup worker on process exit or page unload
function setupWorkerCleanup() {
  if (isBrowser) {
    window.addEventListener('beforeunload', async () => {
      if (workerInstance) {
        await workerInstance.terminate();
      }
    });
  } else {
    // Comment 12: Replace process.on('exit') with proper signal handlers
    process.on('beforeExit', async () => {
      if (workerInstance) {
        await workerInstance.terminate();
      }
    });
    
    process.on('SIGINT', async () => {
      if (workerInstance) {
        await workerInstance.terminate();
      }
      process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
      if (workerInstance) {
        await workerInstance.terminate();
      }
      process.exit(0);
    });
  }
}

// Multi-strategy OCR function that tries different configurations with worker isolation
export async function recognizePharmaceuticalTextMultiStrategy(
  input: string | Buffer,
  options: OCROptions = {}
): Promise<{ text: string[]; confidence: number; method: string }> {
  const strategies = [
    { name: 'textBlock', config: OCR_CONFIGS.textBlock },
    { name: 'singleLine', config: OCR_CONFIGS.singleLine },
    { name: 'uniform', config: OCR_CONFIGS.uniform }
  ];

  let bestResult: { text: string[]; confidence: number; method: string } = { text: [], confidence: 0, method: 'none' };

  for (const strategy of strategies) {
    try {
      console.log(`🔍 Trying OCR strategy: ${strategy.name}`);
      
      // Check if worker is corrupted before each attempt
      if (workerCorrupted) {
        console.log('⚠️ Worker corrupted, skipping strategy:', strategy.name);
        continue;
      }
      
      // Convert PSM enum to number for OCROptions
      const strategyOptions = {
        ...options,
        ...strategy.config,
        psm: Number(strategy.config.psm) // Convert enum to number
      };
      
      const result = await recognizePharmaceuticalText(input, strategyOptions);
      
      if (result.length > bestResult.text.length) {
        bestResult = {
          text: result,
          confidence: result.length * 10, // Simple confidence based on text length
          method: strategy.name
        };
      }
      
      // If we got a good result, break early to avoid further corruption
      if (result.length > 0) {
        console.log(`✅ Strategy ${strategy.name} succeeded with ${result.length} text items`);
        break;
      }
      
    } catch (error) {
      console.warn(`⚠️ OCR strategy ${strategy.name} failed:`, error);
      
      // If it's a critical error, stop trying more strategies
      if (error instanceof Error && (
        error.message.includes('memory access out of bounds') ||
        error.message.includes('DataCloneError') ||
        error.message.includes('langsArr.map is not a function')
      )) {
        console.log('🚨 Critical error detected, stopping multi-strategy attempts');
        break;
      }
      continue;
    }
  }

  return bestResult;
}

// Main OCR function for pharmaceutical text recognition
export async function recognizePharmaceuticalText(
  input: string | Buffer,
  options: OCROptions = {}
): Promise<string[]> {
  const config = { ...PHARMACEUTICAL_OCR_CONFIG, ...options };
  let worker: Tesseract.Worker | null = null;
  let abortController: AbortController | null = null;

  // Wait for any ongoing recognition to complete instead of throwing error
  while (isRecognizing) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  isRecognizing = true;

  try {
    // Initialize worker
    worker = await initializeWorker();
    lastUsed = Date.now();

    // Comment 2: Fix Buffer handling
    let ocrInput: string | Buffer;
    if (Buffer.isBuffer(input)) {
      ocrInput = input; // Pass Buffer directly to worker.recognize
    } else if (typeof input === 'string') {
      // Ensure it's a full data URL or convert to Buffer
      if (input.startsWith('data:image/')) {
        ocrInput = input;
      } else {
        // Assume it's base64 and add data URL prefix
        ocrInput = `data:image/png;base64,${input}`;
      }
    } else {
      throw new Error('Invalid input type for OCR');
    }

    // Comment 3: Set PSM parameters before recognition with error handling
    try {
      await worker.setParameters({ 
        tessedit_pageseg_mode: String(config.psm) as any,
        tessedit_char_whitelist: config.charWhitelist || PHARMACEUTICAL_OCR_CONFIG.charWhitelist,
        user_defined_dpi: config.dpi ? String(config.dpi) : PHARMACEUTICAL_OCR_CONFIG.dpi.toString()
      });
    } catch (paramError) {
      console.warn('⚠️ Failed to set OCR parameters, using defaults:', paramError);
      // Continue with default parameters
    }

    // Comment 4: Add timeout cancellation
    abortController = new AbortController();
    const timeoutId = setTimeout(() => {
      abortController?.abort();
    }, config.timeout);

    // Perform OCR with timeout and cancellation
    const result = await Promise.race([
      worker.recognize(ocrInput),
      new Promise<never>((_, reject) => {
        abortController?.signal.addEventListener('abort', () => {
          reject(new Error('OCR timeout'));
        });
      })
    ]);

    clearTimeout(timeoutId);

    // Extract and clean text
    const rawText = result.data.text;
    const lines = rawText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    // Comment 5: Use imported validation function
    const pharmaceuticalLines = validatePharmaceuticalText(lines);
    
    if (pharmaceuticalLines.length === 0) {
      // Try with different PSM mode if no pharmaceutical text found
      if (config.retries && config.retries > 0) {
        console.log('No pharmaceutical text found, retrying with SINGLE_LINE mode...');
        // Release semaphore before recursive call
        isRecognizing = false;
        return await recognizePharmaceuticalText(input, {
          ...options,
          psm: Number(Tesseract.PSM.SINGLE_LINE), // Fixed: Use SINGLE_LINE instead of SINGLE_TEXT_LINE
          retries: config.retries - 1
        });
      }
    }

    return pharmaceuticalLines;

  } catch (error) {
    console.error('OCR recognition failed:', error);
    
    // Detect memory access errors and mark worker as corrupted
    if (error instanceof Error && (
      error.message.includes('RuntimeError') || 
      error.message.includes('memory access out of bounds') ||
      error.message.includes('Aborted') ||
      error.message.includes('DataCloneError') ||
      error.message.includes('langsArr.map is not a function')
    )) {
      console.log('🚨 Critical error detected, marking worker as corrupted...');
      workerCorrupted = true;
      await forceCleanupWorker();
    }
    
    // Comment 4: Cleanup and reinitialize on timeout or RuntimeError
    if (error instanceof Error && (error.message === 'OCR timeout' || error.message.includes('RuntimeError'))) {
      console.log('OCR error detected, cleaning up and reinitializing worker...');
      await forceCleanupWorker();
      await initializeWorker();
    }
    
    // Retry with different parameters if retries remaining
    if (config.retries && config.retries > 0) {
      console.log(`Retrying OCR (${config.retries} attempts remaining)...`);
      // Release semaphore before recursive call
      isRecognizing = false;
      return await recognizePharmaceuticalText(input, {
        ...options,
        psm: Number(Tesseract.PSM.SINGLE_LINE), // Fixed: Use SINGLE_LINE instead of SINGLE_TEXT_LINE
        retries: config.retries - 1
      });
    }

    // Return empty array as fallback
    return [];
  } finally {
    isRecognizing = false;
  }
}

// Enhanced OCR function that tries DeepSeek-OCR first, then falls back to Tesseract
export async function recognizePharmaceuticalTextEnhanced(
  input: string | Buffer,
  options: OCROptions & { preferDeepSeek?: boolean } = {}
): Promise<string[]> {
  const { preferDeepSeek = true, ...ocrOptions } = options;

  // Try DeepSeek-OCR first if enabled
  if (preferDeepSeek && typeof window === 'undefined') {
    try {
      // Convert input to base64 string for DeepSeek-OCR
      let imageData: string;
      
      if (Buffer.isBuffer(input)) {
        imageData = input.toString('base64');
      } else if (typeof input === 'string') {
        if (input.startsWith('data:image/')) {
          // Extract base64 from data URL
          const base64Part = input.split(',')[1];
          imageData = base64Part || input;
        } else {
          imageData = input;
        }
      } else {
        throw new Error('Invalid input type');
      }

      console.log('🔬 Attempting DeepSeek-OCR extraction...');
      const deepSeekResult = await extractWithDeepSeekOCR(imageData);
      
      if (deepSeekResult.success && deepSeekResult.text_lines.length > 0) {
        console.log('✅ DeepSeek-OCR extraction successful');
        return deepSeekResult.text_lines;
      } else {
        console.log('⚠️ DeepSeek-OCR returned no text, falling back to Tesseract');
      }
    } catch (error) {
      console.warn('⚠️ DeepSeek-OCR failed, falling back to Tesseract:', error);
      // Continue to Tesseract fallback
    }
  }

  // Fallback to Tesseract OCR
  console.log('🔄 Using Tesseract OCR fallback...');
  return recognizePharmaceuticalText(input, ocrOptions);
}

// Cleanup function for manual worker termination
export async function cleanupOCRWorker(): Promise<void> {
  await forceCleanupWorker();
}

// Setup cleanup handlers
setupWorkerCleanup();
