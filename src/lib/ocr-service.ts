import Tesseract from 'tesseract.js';
import { validatePharmaceuticalText, calculatePharmaceuticalConfidence } from '@/lib/pharmaceutical-patterns';

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
  psm: Tesseract.PSM.SINGLE_BLOCK,
  charWhitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,;:()[]{}%+-=<>/\\|&@#$*!?\'"`~_',
  timeout: 30000,
  retries: 3
};

// Worker lifecycle management
let workerInstance: Tesseract.Worker | null = null;
let isInitializing = false;
let lastUsed = 0;
let isRecognizing = false; // Semaphore for recognition

// Environment detection
const isBrowser = typeof window !== 'undefined';

// Initialize worker with pharmaceutical-optimized settings
async function initializeWorker(): Promise<Tesseract.Worker> {
  if (workerInstance && !isWorkerStale()) {
    return workerInstance;
  }

  if (isInitializing) {
    // Wait for existing initialization
    while (isInitializing) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return workerInstance!;
  }

  isInitializing = true;

  try {
    // Terminate existing worker if stale
    if (workerInstance) {
      await workerInstance.terminate();
    }

    // Create new worker with pharmaceutical configuration
    workerInstance = await Tesseract.createWorker();

    // Comment 1: Add worker.load() before loadLanguage and initialize
    await workerInstance.load();
    await (workerInstance as any).loadLanguage(PHARMACEUTICAL_OCR_CONFIG.language);
    await (workerInstance as any).initialize(PHARMACEUTICAL_OCR_CONFIG.language);

    // Set pharmaceutical-optimized parameters
    await (workerInstance as any).setParameters({
      tessedit_char_whitelist: PHARMACEUTICAL_OCR_CONFIG.charWhitelist,
      tessedit_pageseg_mode: PHARMACEUTICAL_OCR_CONFIG.psm,
      preserve_interword_spaces: '1',
      user_defined_dpi: PHARMACEUTICAL_OCR_CONFIG.dpi.toString(),
      textord_heavy_nr: '1', // Better noise reduction
      textord_min_linesize: '2', // Minimum line size for small text
      tessedit_do_invert: '0', // Don't invert colors
      tessedit_image_border: '20', // Add border for better recognition
    });

    lastUsed = Date.now();
    console.log('OCR Worker initialized with pharmaceutical optimization');
  } catch (error) {
    console.error('Failed to initialize OCR worker:', error);
    throw error;
  } finally {
    isInitializing = false;
  }

  return workerInstance;
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

// Main OCR function for pharmaceutical text recognition
export async function recognizePharmaceuticalText(
  input: string | Buffer,
  options: OCROptions = {}
): Promise<string[]> {
  const config = { ...PHARMACEUTICAL_OCR_CONFIG, ...options };
  let worker: Tesseract.Worker | null = null;
  let abortController: AbortController | null = null;

  // Comment 4: Ensure only one recognition runs at a time
  if (isRecognizing) {
    throw new Error('OCR recognition already in progress');
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

    // Comment 3: Set PSM parameters before recognition
    await worker.setParameters({ 
      tessedit_pageseg_mode: String(config.psm) as any,
      tessedit_char_whitelist: config.charWhitelist || PHARMACEUTICAL_OCR_CONFIG.charWhitelist,
      user_defined_dpi: config.dpi ? String(config.dpi) : PHARMACEUTICAL_OCR_CONFIG.dpi.toString()
    });

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
        console.log('No pharmaceutical text found, retrying with SPARSE_TEXT mode...');
        return await recognizePharmaceuticalText(input, {
          ...options,
          psm: Number(Tesseract.PSM.SPARSE_TEXT),
          retries: config.retries - 1
        });
      }
    }

    return pharmaceuticalLines;

  } catch (error) {
    console.error('OCR recognition failed:', error);
    
    // Comment 4: Cleanup and reinitialize on timeout
    if (error instanceof Error && error.message === 'OCR timeout') {
      console.log('OCR timeout detected, cleaning up and reinitializing...');
      await cleanupOCRWorker();
      await initializeWorker();
    }
    
    // Retry with different parameters if retries remaining
    if (config.retries && config.retries > 0) {
      console.log(`Retrying OCR (${config.retries} attempts remaining)...`);
      return await recognizePharmaceuticalText(input, {
        ...options,
        psm: Number(Tesseract.PSM.SPARSE_TEXT),
        retries: config.retries - 1
      });
    }

    // Return empty array as fallback
    return [];
  } finally {
    isRecognizing = false;
  }
}

// Cleanup function for manual worker termination
export async function cleanupOCRWorker(): Promise<void> {
  if (workerInstance) {
    await workerInstance.terminate();
    workerInstance = null;
  }
}

// Setup cleanup handlers
setupWorkerCleanup();
