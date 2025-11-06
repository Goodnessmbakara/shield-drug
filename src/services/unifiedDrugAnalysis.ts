/**
 * Unified Drug Analysis Service
 * Consolidates all working components from redundant services
 * 
 * Features:
 * - OCR-first approach: Google Cloud Vision → Tesseract → Heuristics
 * - COCO-SSD object detection (via npm package)
 * - Text-based drug identification
 * - No broken model URLs
 */

import * as tf from '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import { extractTextWithTypeScriptOCR } from '@/lib/typescript-ocr-service';
import { extractDrugInfo, correctOCRErrors, DRUG_NAME_PATTERNS } from '@/lib/pharmaceutical-patterns';
import { DrugAnalysisResult, ImageClassificationResult } from '@/lib/types';
import { ENHANCED_DRUG_DATABASE, DrugMatcher, EnhancedDrugSearch } from '@/lib/enhanced-drug-database';
import sharp from 'sharp';

// Conditionally import tfjs-node for Node.js environment
if (typeof window === 'undefined') {
  try {
    require('@tensorflow/tfjs-node');
  } catch (error) {
    console.warn('TensorFlow.js Node.js backend not available:', error);
  }
}

export interface UnifiedAnalysisResult extends DrugAnalysisResult {
  ocrMethod: 'google-vision' | 'tesseract' | 'none';
  classificationMethod: 'coco-ssd' | 'text-heuristic' | 'none';
  processingTime: number;
}

class UnifiedDrugAnalysisService {
  private cocoSsdModel: cocoSsd.ObjectDetection | null = null;
  private isInitialized = false;
  private cocoSsdAvailable = false;

  // Configuration
  private config = {
    confidenceThreshold: 0.3,
    maxProcessingTime: 10000, // 10 seconds
    enableCOCOSSD: true,
    enableGoogleVisionOCR: process.env.GOOGLE_CLOUD_API_KEY !== undefined,
  };

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('🚀 Initializing Unified Drug Analysis Service...');

      // Set backend for Node.js environment (optional - continue if it fails)
      if (typeof window === 'undefined') {
        try {
          // Try to require tfjs-node first
          require('@tensorflow/tfjs-node');
          
          // Check if backend is available before setting it
          // backendNames might be an array or an object, handle both cases
          const backendNames = await tf.engine().backendNames;
          const backendsArray = Array.isArray(backendNames) 
            ? backendNames 
            : Object.keys(backendNames || {});
          
          if (backendsArray.includes('tensorflow')) {
            await tf.setBackend('tensorflow');
            await tf.ready();
            console.log('✅ TensorFlow.js backend initialized');
          } else {
            console.warn('⚠️ TensorFlow backend not available, using CPU fallback');
            // Disable COCO-SSD if TensorFlow backend isn't available
            this.config.enableCOCOSSD = false;
          }
        } catch (tfError) {
          console.warn('⚠️ TensorFlow.js Node.js backend not available, continuing with OCR-only mode:', tfError.message || tfError);
          // Disable COCO-SSD if TensorFlow fails completely
          this.config.enableCOCOSSD = false;
          // Continue without TensorFlow - OCR will still work
        }
      }

      // Initialize COCO-SSD if enabled (optional - continue if it fails)
      if (this.config.enableCOCOSSD) {
        try {
          await this.initializeCocoSsd();
        } catch (cocoError) {
          console.warn('⚠️ COCO-SSD initialization failed, continuing with OCR-only mode:', cocoError);
        }
      }

      this.isInitialized = true;
      console.log('✅ Unified Drug Analysis Service initialized:', {
        cocoSsd: this.cocoSsdAvailable,
        googleVisionOCR: this.config.enableGoogleVisionOCR,
        tensorflow: typeof window === 'undefined' ? 'optional' : 'browser',
      });
    } catch (error) {
      console.error('❌ Failed to initialize Unified Drug Analysis Service:', error);
      this.isInitialized = true; // Continue with fallback methods (OCR-only mode)
    }
  }

  private async initializeCocoSsd(): Promise<void> {
    try {
      // Check if TensorFlow is available first
      if (typeof window === 'undefined') {
        try {
          await tf.ready();
        } catch (tfError) {
          console.warn('⚠️ TensorFlow not ready, skipping COCO-SSD initialization');
          this.cocoSsdAvailable = false;
          return;
        }
      }

      console.log('Loading COCO-SSD model...');

      // Load COCO-SSD model via npm package (works reliably)
      // Skip if TensorFlow backend has issues
      try {
        this.cocoSsdModel = await cocoSsd.load({
          base: 'lite_mobilenet_v2',
        });

        if (!this.cocoSsdModel) {
          throw new Error('COCO-SSD model failed to load');
        }

        // Warm up the model (skip if TensorFlow has issues)
        if (typeof window !== 'undefined' && typeof document !== 'undefined') {
          const dummyCanvas = document.createElement('canvas');
          dummyCanvas.width = 224;
          dummyCanvas.height = 224;
          const ctx = dummyCanvas.getContext('2d')!;
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, 224, 224);
          await this.cocoSsdModel.detect(dummyCanvas);
        } else {
          // Skip warmup in Node.js if TensorFlow has issues
          // The model will be warmed up on first use
          console.log('✅ COCO-SSD model loaded (will warm up on first use)');
        }

        this.cocoSsdAvailable = true;
        console.log('✅ COCO-SSD model loaded and warmed up');
      } catch (loadError) {
        // If loading fails due to TensorFlow issues, continue without COCO-SSD
        console.warn('⚠️ COCO-SSD model failed to load (TensorFlow issue), continuing with OCR-only mode:', loadError);
        this.cocoSsdAvailable = false;
      }
    } catch (error) {
      console.warn('⚠️ COCO-SSD initialization failed, continuing with OCR-only mode:', error);
      this.cocoSsdAvailable = false;
    }
  }

  /**
   * Main analysis method - OCR-first approach
   */
  async analyzeImage(imageData: string): Promise<UnifiedAnalysisResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const startTime = Date.now();

    try {
      console.log('🔍 Starting unified drug image analysis...');

      // Step 1: OCR extraction (primary method)
      const ocrResult = await this.extractTextWithOCR(imageData);
      const extractedText = ocrResult.textLines;
      const ocrMethod = ocrResult.method;

      console.log(`📝 OCR extracted ${extractedText.length} text lines using ${ocrMethod}:`, extractedText.slice(0, 3));

      // Step 2: Image classification
      const classification = await this.classifyImage(imageData, extractedText);

      // Step 3: Drug identification from text
      const drugIdentification = this.identifyDrugFromText(extractedText);
      
      console.log('🔍 Drug identification result:', {
        name: drugIdentification.name,
        strength: drugIdentification.strength,
        confidence: drugIdentification.confidence,
        textLinesUsed: extractedText.length,
      });

      // Step 4: Build result
      const processingTime = Date.now() - startTime;

      const result: UnifiedAnalysisResult = {
        drugName: drugIdentification.name || 'Unknown Drug',
        strength: drugIdentification.strength || 'Unknown',
        confidence: drugIdentification.confidence || 0,
        status: drugIdentification.confidence > 0.5 ? 'authentic' : 'suspicious',
        issues: drugIdentification.issues || [],
        extractedText,
        visualFeatures: {
          color: classification.dominantColor || 'unknown',
          shape: classification.primaryShape || 'unknown',
          markings: extractedText.slice(0, 5),
          objectDetections: classification.objectDetections || [],
        },
        isDrugImage: classification.isPharmaceutical,
        imageClassification: classification,
        ocrMethod,
        classificationMethod: classification.method,
        processingTime,
      };

      console.log('✅ Unified analysis completed:', {
        drugName: result.drugName,
        confidence: result.confidence,
        ocrMethod: result.ocrMethod,
        processingTime: result.processingTime,
      });

      return result;
    } catch (error) {
      console.error('❌ Unified analysis failed:', error);
      return this.createFallbackResult(error, Date.now() - startTime);
    }
  }

  /**
   * Extract text using OCR - tries Google Cloud Vision first, then Tesseract
   */
  private async extractTextWithOCR(imageData: string): Promise<{
    textLines: string[];
    method: 'google-vision' | 'tesseract' | 'none';
  }> {
    try {
      console.log('🔬 Attempting TypeScript OCR extraction...');
      const ocrResult = await extractTextWithTypeScriptOCR(imageData);

      if (ocrResult.success && ocrResult.text_lines.length > 0) {
        console.log(`✅ ${ocrResult.method} OCR extraction successful:`, ocrResult.text_lines.length, 'lines');
        return {
          textLines: ocrResult.text_lines,
          method: ocrResult.method,
        };
      } else {
        console.warn(`⚠️ ${ocrResult.method} OCR returned no text`);
      }
    } catch (error) {
      console.warn('⚠️ TypeScript OCR failed:', error);
    }

    return {
      textLines: [],
      method: 'none',
    };
  }

  /**
   * Classify image - uses COCO-SSD if available, otherwise text-based heuristics
   */
  private async classifyImage(
    imageData: string,
    extractedText: string[]
  ): Promise<ImageClassificationResult & { method: string; dominantColor?: string; primaryShape?: string }> {
    // Try COCO-SSD if available
    if (this.cocoSsdAvailable && this.cocoSsdModel) {
      try {
        const result = await this.classifyWithCocoSsd(imageData);
        if (result.isPharmaceutical) {
          return { ...result, method: 'coco-ssd' };
        }
      } catch (error) {
        console.warn('⚠️ COCO-SSD classification failed:', error);
      }
    }

    // Fallback to text-based heuristics
    return this.classifyWithTextHeuristics(extractedText);
  }

  /**
   * Classify using COCO-SSD object detection
   */
  private async classifyWithCocoSsd(imageData: string): Promise<ImageClassificationResult> {
    try {
      // Convert imageData to format COCO-SSD can use
      let input: HTMLImageElement | HTMLCanvasElement | tf.Tensor3D;

      if (typeof window !== 'undefined' && typeof document !== 'undefined') {
        // Browser: create image element
        const img = new Image();
        img.src = imageData;
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });
        input = img;
      } else {
        // Node.js: convert base64 to tensor
        const base64Data = imageData.split(',')[1] || imageData;
        const buffer = Buffer.from(base64Data, 'base64');
        
        // Use sharp to process image
        const processed = await sharp(buffer)
          .resize(224, 224)
          .raw()
          .toBuffer({ resolveWithObject: true });

        // Convert buffer to tensor - COCO-SSD expects RGB format
        const tensor = tf.tensor3d(
          new Uint8Array(processed.data),
          [processed.info.height, processed.info.width, processed.info.channels]
        ) as tf.Tensor3D;
        input = tensor;
      }

      const detections = await this.cocoSsdModel!.detect(input as any);

      // Check for pharmaceutical-related objects
      const pharmaKeywords = ['bottle', 'box', 'package', 'pill', 'tablet', 'medicine'];
      const hasPharmaObjects = detections.some((d: any) =>
        pharmaKeywords.some((keyword) => d.class.toLowerCase().includes(keyword))
      );

      // Clean up tensor if created
      if (input instanceof tf.Tensor) {
        input.dispose();
      }

      return {
        isPharmaceutical: hasPharmaObjects || detections.length > 0,
        detectedObjects: detections.map((d: any) => d.class),
        confidence: hasPharmaObjects ? 0.7 : 0.3,
        objectDetections: detections,
        detectionMethod: 'coco-ssd',
        boundingBoxCount: detections.length,
      };
    } catch (error) {
      console.error('COCO-SSD classification error:', error);
      throw error;
    }
  }

  /**
   * Classify using text-based heuristics
   */
  private classifyWithTextHeuristics(extractedText: string[]): ImageClassificationResult & {
    method: string;
    dominantColor?: string;
    primaryShape?: string;
  } {
    const combinedText = extractedText.join(' ').toLowerCase();
    const pharmaIndicators = [
      'mg', 'tablet', 'capsule', 'drug', 'medicine', 'pharmaceutical',
      'paracetamol', 'ibuprofen', 'aspirin', 'antibiotic', 'dose',
      'expiry', 'batch', 'manufacturer', 'nafdac', 'fda',
    ];

    const hasPharmaText = pharmaIndicators.some((indicator) =>
      combinedText.includes(indicator)
    );

    return {
      isPharmaceutical: hasPharmaText || extractedText.length > 0,
      detectedObjects: extractedText.slice(0, 5),
      confidence: hasPharmaText ? 0.6 : 0.3,
      objectDetections: [],
      detectionMethod: 'text-heuristic',
      boundingBoxCount: 0,
      method: 'text-heuristic',
    };
  }

  /**
   * Identify drug from extracted text
   */
  private identifyDrugFromText(textLines: string[]): {
    name: string;
    strength: string;
    confidence: number;
    issues: string[];
  } {
    if (textLines.length === 0) {
      console.warn('⚠️ No text lines provided for drug identification');
      return {
        name: 'Unknown Drug',
        strength: 'Unknown',
        confidence: 0,
        issues: ['No text detected in image'],
      };
    }

    const combinedText = textLines.join(' ').toLowerCase();
    const correctedText = correctOCRErrors(combinedText);
    
    console.log('🔍 Identifying drug from text:', {
      textLinesCount: textLines.length,
      combinedTextLength: combinedText.length,
      sampleText: textLines.slice(0, 3).join(' | '),
    });

    // Use enhanced drug database for matching (static method)
    const matches = DrugMatcher.findBestMatches(textLines, {}, 1);
    
    console.log('🔍 Drug database matches:', {
      matchCount: matches.length,
      topMatch: matches.length > 0 ? {
        name: matches[0].drug.name,
        score: matches[0].score,
      } : null,
    });
    
    if (matches.length > 0 && matches[0].score > 0.5) {
      const bestMatch = matches[0].drug;
      // Extract strength from text
      const strengthMatch = bestMatch.strengths.find(s => 
        correctedText.includes(s.toLowerCase())
      );
      
      return {
        name: bestMatch.name,
        strength: strengthMatch || bestMatch.strengths[0] || 'Unknown',
        confidence: matches[0].score,
        issues: [],
      };
    }

    // Fallback: extract drug info using patterns
    const drugInfo = extractDrugInfo(textLines); // Pass textLines array, not correctedText string
    console.log('🔍 Pattern-based extraction result:', {
      name: drugInfo?.name,
      dosage: drugInfo?.dosage,
      confidence: drugInfo?.confidence,
    });
    
    if (drugInfo) {
      const strength = drugInfo.dosage 
        ? `${drugInfo.dosage.value}${drugInfo.dosage.unit}` 
        : 'Unknown';
      
      return {
        name: drugInfo.name,
        strength,
        confidence: drugInfo.confidence,
        issues: [],
      };
    }
    
    return {
      name: 'Unknown Drug',
      strength: 'Unknown',
      confidence: 0.3,
      issues: [],
    };
  }

  /**
   * Create fallback result on error
   */
  private createFallbackResult(error: any, processingTime: number): UnifiedAnalysisResult {
    return {
      drugName: 'Unknown Drug',
      strength: 'Unknown',
      confidence: 0,
      status: 'suspicious',
      issues: [`Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
      extractedText: [],
      visualFeatures: {
        color: 'unknown',
        shape: 'unknown',
        markings: [],
        objectDetections: [],
      },
      isDrugImage: false,
      imageClassification: {
        isPharmaceutical: false,
        detectedObjects: [],
        confidence: 0,
        objectDetections: [],
        detectionMethod: 'none',
        boundingBoxCount: 0,
      },
      ocrMethod: 'none',
      classificationMethod: 'none',
      processingTime,
    };
  }
}

// Export singleton instance
export const unifiedDrugAnalysis = new UnifiedDrugAnalysisService();

