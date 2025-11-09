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
import { identifyDrugFromAPI } from '@/lib/drug-api-service';
import sharp from 'sharp';

// Apply TensorFlow.js patch at runtime before requiring tfjs-node
if (typeof window === 'undefined') {
  try {
    const util = require('util');
    if (!util.isNullOrUndefined) {
      util.isNullOrUndefined = function(val: any) {
        return val === null || val === undefined;
      };
    }
    if (!util.isArray) {
      util.isArray = Array.isArray;
    }
  } catch (e) {
    // Patch failed, will be handled by postinstall script
  }
}

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
    enableCOCOSSD: false, // Disabled - OCR is primary
    enableGoogleVisionOCR: process.env.GOOGLE_CLOUD_API_KEY !== undefined,
  };

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('🚀 Initializing Unified Drug Analysis Service...');

      // Set backend for Node.js environment (optional - continue if it fails)
      if (typeof window === 'undefined') {
        try {
          // Try to require tfjs-node first - this will apply the patch if needed
          require('@tensorflow/tfjs-node');
          
          // Wait for TensorFlow to be ready
          await tf.ready();
          
          // Check if backend is available before setting it
          // backendNames is a function that returns a promise
          const backendNames = await tf.engine().backendNames();
          const backendsArray = Array.isArray(backendNames) 
            ? backendNames 
            : Object.keys(backendNames || {});
          
          console.log('🔍 Available TensorFlow backends:', backendsArray);
          
          // Try to set tensorflow backend (Node.js native backend)
          if (backendsArray.includes('tensorflow')) {
            await tf.setBackend('tensorflow');
            await tf.ready();
            console.log('✅ TensorFlow.js backend initialized successfully');
          } else if (backendsArray.includes('cpu')) {
            // Fallback to CPU backend
            await tf.setBackend('cpu');
            await tf.ready();
            console.log('✅ TensorFlow.js CPU backend initialized');
          } else {
            console.warn('⚠️ TensorFlow backend not available, using default backend');
            // Disable COCO-SSD if TensorFlow backend isn't available
            this.config.enableCOCOSSD = false;
          }
        } catch (tfError: any) {
          console.warn('⚠️ TensorFlow.js Node.js backend not available, continuing with OCR-only mode:', tfError?.message || tfError);
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
      // Apply runtime patch before loading COCO-SSD to fix util.isNullOrUndefined
      if (typeof window === 'undefined') {
        try {
          const util = require('util');
          if (!util.isNullOrUndefined) {
            util.isNullOrUndefined = function(val: any) {
              return val === null || val === undefined;
            };
          }
          if (!util.isArray) {
            util.isArray = Array.isArray;
          }
        } catch (patchError) {
          console.warn('⚠️ Runtime patch failed:', patchError);
        }
      }

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
          // Skip warmup in Node.js - model will warm up on first use
          console.log('✅ COCO-SSD model loaded (will warm up on first use)');
        }

        this.cocoSsdAvailable = true;
        console.log('✅ COCO-SSD model loaded and warmed up');
      } catch (loadError) {
        // If loading fails, continue without COCO-SSD
        console.warn('⚠️ COCO-SSD model failed to load, continuing with OCR-only mode:', loadError);
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
      const drugIdentification = await this.identifyDrugFromText(extractedText);
      
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
        classificationMethod: (classification.method as 'coco-ssd' | 'text-heuristic' | 'none') || 'text-heuristic',
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
        objectDetections: detections.map((d: any) => ({
          ...d,
          confidence: d.score || 0.5,
          isPharmaceuticalRelevant: true,
        })),
        detectionMethod: 'coco-ssd' as const,
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
      detectionMethod: 'ocr-text' as const,
      boundingBoxCount: 0,
      method: 'text-heuristic' as const,
    };
  }

  /**
   * Identify drug from extracted text using API
   */
  private async identifyDrugFromText(textLines: string[]): Promise<{
    name: string;
    strength: string;
    confidence: number;
    issues: string[];
  }> {
    if (textLines.length === 0) {
      console.warn('⚠️ No text lines provided for drug identification');
      return {
        name: 'Unknown Drug',
        strength: 'Unknown',
        confidence: 0,
        issues: ['No text detected in image'],
      };
    }

    console.log('🔍 Identifying drug from text using API:', {
      textLinesCount: textLines.length,
      sampleText: textLines.slice(0, 3).join(' | '),
    });

    // Use API to identify drug
    try {
      const apiResult = await identifyDrugFromAPI(textLines);
      
      if (apiResult) {
        console.log('✅ Drug identified via API:', {
          name: apiResult.name,
          strength: apiResult.strength,
          source: apiResult.source,
          confidence: apiResult.confidence,
        });
        
        return {
          name: apiResult.name,
          strength: apiResult.strength || 'Unknown',
          confidence: apiResult.confidence,
          issues: apiResult.source === 'extracted' 
            ? ['Drug name extracted from OCR - not verified in drug database']
            : [],
        };
      }
    } catch (apiError) {
      console.warn('⚠️ API drug identification failed:', apiError);
    }

    // Fallback: Extract drug name directly from OCR text
    const combinedText = textLines.join(' ').toUpperCase();
    
    // Pattern 1: Combination drugs "Drug1 XXmg + Drug2 XXmg"
    const combinationPattern = /([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+)*)\s+(\d+\s*(?:mg|mcg|g|ml|IU))\s*\+\s*([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+)*)\s+(\d+\s*(?:mg|mcg|g|ml|IU))/i;
    const combinationMatch = combinedText.match(combinationPattern);
    
    if (combinationMatch) {
      const drug1 = combinationMatch[1].trim();
      const strength1 = combinationMatch[2];
      const drug2 = combinationMatch[3].trim();
      const strength2 = combinationMatch[4];
      
      console.log('🔍 Extracted combination drug from OCR text:', `${drug1} + ${drug2}`);
      return {
        name: `${drug1} + ${drug2}`,
        strength: `${strength1} + ${strength2}`,
        confidence: 0.6,
        issues: ['Drug name extracted from OCR text - not verified in drug database'],
      };
    }
    
    // Pattern 2: Single drug "DrugName XXmg"
    const singleDrugPattern = /([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+)*)\s+(\d+\s*(?:mg|mcg|g|ml|IU))/i;
    const singleMatch = combinedText.match(singleDrugPattern);
    
    if (singleMatch) {
      const drugName = singleMatch[1].trim();
      const strength = singleMatch[2];
      
      console.log('🔍 Extracted drug name from OCR text:', drugName);
      return {
        name: drugName,
        strength,
        confidence: 0.5,
        issues: ['Drug name extracted from OCR text - not verified in drug database'],
      };
    }
    
    // Pattern 3: Brand/product name (e.g., "CAMOSUNATE")
    const brandPattern = /\b([A-Z]{3,}[A-Za-z]*)\b/;
    const brandMatch = combinedText.match(brandPattern);
    
    if (brandMatch && brandMatch[1].length > 3) {
      const brandName = brandMatch[1];
      console.log('🔍 Extracted brand/product name from OCR text:', brandName);
      
      const strengthMatch = combinedText.match(/(\d+\s*(?:mg|mcg|g|ml|IU)(?:\s*\+\s*\d+\s*(?:mg|mcg|g|ml|IU))?)/i);
      const strength = strengthMatch ? strengthMatch[1] : 'Unknown';
      
      return {
        name: brandName,
        strength,
        confidence: 0.4,
        issues: ['Brand/product name extracted from OCR text - not verified in drug database'],
      };
    }
    
    return {
      name: 'Unknown Drug',
      strength: 'Unknown',
      confidence: 0.3,
      issues: ['Drug name not found in OCR text or drug database'],
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
        detectionMethod: 'fallback' as const,
        boundingBoxCount: 0,
      },
      ocrMethod: 'none',
      classificationMethod: 'none' as const,
      processingTime,
    };
  }
}

// Export singleton instance
export const unifiedDrugAnalysis = new UnifiedDrugAnalysisService();

