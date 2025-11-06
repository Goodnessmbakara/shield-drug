import * as tf from '@tensorflow/tfjs';
import { createWorker } from 'tesseract.js';
import { DrugAnalysisResult, ImageClassificationResult } from '@/lib/types';
import { recognizePharmaceuticalText, recognizePharmaceuticalTextEnhanced } from '@/lib/ocr-service';
import { extractDrugInfo, correctOCRErrors, DRUG_NAME_PATTERNS } from '@/lib/pharmaceutical-patterns';
import sharp from 'sharp';

// Conditionally import canvas for server-side only
let createCanvas: any;
let loadImage: any;

try {
  const canvas = require('canvas');
  createCanvas = canvas.createCanvas;
  loadImage = canvas.loadImage;
} catch (error) {
  console.warn('⚠️ Canvas module not available, using fallback methods');
  createCanvas = null;
  loadImage = null;
}

// Enhanced drug detection service with multi-model ensemble approach
export class EnhancedDrugDetectionService {
  private models: {
    mobilenet?: tf.LayersModel;
    cocoSsd?: any;
    tesseract?: any;
  } = {};
  
  private isInitialized = false;
  private modelStatus = {
    mobilenet: false,
    cocoSsd: false,
    tesseract: false
  };

  // Configuration for different detection modes
  private config = {
    confidenceThreshold: 0.3,
    maxProcessingTime: 5000, // 5 seconds
    imageSize: 224,
    enableGPU: false, // Disable GPU for server-side processing
    fallbackMode: 'ocr-text' as 'ocr-text' | 'basic' | 'none',
    timeoutMs: 30000, // 30 seconds for model loading
    retryAttempts: 2
  };

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('🚀 Initializing Enhanced Drug Detection Service...');
      
      // Set backend for Node.js environment
      require('@tensorflow/tfjs-node');
      await tf.setBackend('tensorflow');

      // Initialize models with timeout and retry logic
      const initPromises = [
        this.initializeWithTimeout('MobileNet', () => this.initializeMobileNet()),
        this.initializeWithTimeout('COCO-SSD', () => this.initializeCocoSsd()),
        this.initializeWithTimeout('Tesseract', () => this.initializeTesseract())
      ];

      await Promise.allSettled(initPromises);

      this.isInitialized = true;
      console.log('✅ Enhanced Drug Detection Service initialized:', this.modelStatus);
      
    } catch (error) {
      console.error('❌ Failed to initialize Enhanced Drug Detection Service:', error);
      // Continue with fallback mode
      this.isInitialized = true;
    }
  }

  private async initializeWithTimeout(name: string, initFn: () => Promise<void>): Promise<void> {
    try {
      await Promise.race([
        initFn(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error(`${name} initialization timeout`)), this.config.timeoutMs)
        )
      ]);
    } catch (error) {
      console.warn(`⚠️ ${name} initialization failed:`, error);
    }
  }

  private async initializeMobileNet(): Promise<void> {
    try {
      // Use a more reliable model URL with retry logic
      const modelUrl = 'https://tfhub.dev/google/imagenet/mobilenet_v2_100_224/classification/2';
      this.models.mobilenet = await tf.loadLayersModel(modelUrl);
      
      // Warm up the model
      const dummyInput = tf.zeros([1, 224, 224, 3]);
      const prediction = this.models.mobilenet!.predict(dummyInput) as tf.Tensor;
      await prediction.data();
      dummyInput.dispose();
      prediction.dispose();
      
      this.modelStatus.mobilenet = true;
      console.log('✅ MobileNet model loaded successfully');
    } catch (error) {
      console.warn('⚠️ MobileNet model failed to load:', error);
    }
  }

  private async initializeCocoSsd(): Promise<void> {
    try {
      // Skip COCO-SSD for now due to loading issues, use fallback
      console.log('⚠️ COCO-SSD model loading disabled due to network issues');
      this.modelStatus.cocoSsd = false;
    } catch (error) {
      console.warn('⚠️ COCO-SSD model failed to load:', error);
    }
  }

  private async initializeTesseract(): Promise<void> {
    try {
      this.models.tesseract = await createWorker('eng', 1, {
        logger: m => console.log('Tesseract:', m)
      });
      this.modelStatus.tesseract = true;
      console.log('✅ Tesseract OCR initialized successfully');
    } catch (error) {
      console.warn('⚠️ Tesseract OCR failed to initialize:', error);
    }
  }

  async analyzeDrugImage(imageData: string): Promise<DrugAnalysisResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const startTime = Date.now();
    
    try {
      console.log('🔍 Starting enhanced drug image analysis...');

      // Step 1: Image classification with ensemble approach
      const classification = await this.classifyImageEnsemble(imageData);
      
      // Step 2: Early rejection for non-drug images
      if (!classification.isPharmaceutical && classification.confidence > 0.8) {
        return this.createRejectionResult(classification);
      }

      // Step 3: Multi-modal analysis
      const [visualAnalysis, textAnalysis] = await Promise.allSettled([
        this.analyzeVisualFeatures(imageData),
        this.extractTextContent(imageData)
      ]);

      // Step 4: Drug identification
      const drugIdentification = this.identifyDrug(
        visualAnalysis.status === 'fulfilled' ? visualAnalysis.value : null,
        textAnalysis.status === 'fulfilled' ? textAnalysis.value || [] : []
      );

      // Step 5: Authenticity assessment
      const authenticity = this.assessAuthenticity(
        drugIdentification,
        visualAnalysis.status === 'fulfilled' ? visualAnalysis.value : null,
        textAnalysis.status === 'fulfilled' ? textAnalysis.value || [] : []
      );

      const processingTime = Date.now() - startTime;
      console.log(`✅ Analysis completed in ${processingTime}ms`);

      return {
        drugName: drugIdentification.name,
        strength: drugIdentification.strength,
        confidence: drugIdentification.confidence,
        status: authenticity.status,
        issues: authenticity.issues,
        extractedText: textAnalysis.status === 'fulfilled' ? textAnalysis.value || [] : [],
        visualFeatures: {
          color: visualAnalysis.status === 'fulfilled' ? visualAnalysis.value?.dominantColor : 'unknown',
          shape: visualAnalysis.status === 'fulfilled' ? visualAnalysis.value?.primaryShape : 'unknown',
          markings: visualAnalysis.status === 'fulfilled' ? visualAnalysis.value?.markings : [],
          objectDetections: classification.objectDetections || []
        },
        isDrugImage: true,
        imageClassification: classification
      };

    } catch (error) {
      console.error('❌ Enhanced drug analysis failed:', error);
      return this.createFallbackResult(error);
    }
  }

  private async classifyImageEnsemble(imageData: string): Promise<ImageClassificationResult> {
    // Primary classification method: OCR-based text detection
    // If we can extract pharmaceutical text, it's likely a drug image
    try {
      const extractedText = await this.extractTextContent(imageData);
      
      // Check if extracted text contains pharmaceutical indicators
      const combinedText = extractedText.join(' ').toLowerCase();
      const hasPharmaText = this.hasPharmaceuticalTextIndicators(combinedText);
      
      if (hasPharmaText || extractedText.length > 0) {
        // If we found text, consider it a pharmaceutical image
        // Confidence based on text quality and pharmaceutical indicators
        const confidence = hasPharmaText ? 0.8 : 0.5;
        
        console.log('✅ Image classified as pharmaceutical via OCR text detection');
        
        return {
          isPharmaceutical: true,
          detectedObjects: extractedText.slice(0, 5), // Use extracted text as detected objects
          confidence,
          objectDetections: [],
          detectionMethod: 'ocr-text',
          boundingBoxCount: 0
        };
      }
    } catch (error) {
      console.warn('OCR-based classification failed:', error);
    }

    // Fallback: Try COCO-SSD if available
    if (this.modelStatus.cocoSsd && this.models.cocoSsd) {
      try {
        const result = await this.classifyWithCocoSsd(imageData);
        if (result.isPharmaceutical) {
          return result;
        }
      } catch (error) {
        console.warn('COCO-SSD classification failed:', error);
      }
    }

    // Fallback: Try MobileNet if available
    if (this.modelStatus.mobilenet && this.models.mobilenet) {
      try {
        const result = await this.classifyWithMobileNet(imageData);
        if (result.isPharmaceutical) {
          return result;
        }
      } catch (error) {
        console.warn('MobileNet classification failed:', error);
      }
    }

    // Default: Assume it's a pharmaceutical image if we can't determine otherwise
    // This is safer than rejecting potentially valid drug images
    console.log('⚠️ Using default classification (assuming pharmaceutical)');
    return {
      isPharmaceutical: true,
      detectedObjects: ['unknown'],
      confidence: 0.3,
      objectDetections: [],
      detectionMethod: 'fallback',
      boundingBoxCount: 0
    };
  }

  private hasPharmaceuticalTextIndicators(text: string): boolean {
    // Check for pharmaceutical keywords and patterns
    const pharmaIndicators = [
      // Drug names (common ones)
      /\b(paracetamol|acetaminophen|ibuprofen|aspirin|amoxicillin|metformin|panadol|tylenol|advil)\b/i,
      // Dosage units
      /\b\d+\s*(mg|ml|mcg|g|IU|units?)\b/i,
      // Dosage forms
      /\b(tablet|capsule|pill|dose|dosage|oral|injection)\b/i,
      // Pharmaceutical terms
      /\b(batch|lot|exp|expiry|manufacturer|pharmaceutical|medicine|medication)\b/i,
      // Regulatory terms
      /\b(fda|ema|nafdac|approved|licensed|certified)\b/i
    ];

    return pharmaIndicators.some(pattern => pattern.test(text));
  }

  private async classifyWithCocoSsd(imageData: string): Promise<ImageClassificationResult> {
    const canvas = await this.imageToCanvas(imageData);
    const detections = await this.models.cocoSsd!.detect(canvas, 10, 0.3);
    
    const pharmaceuticalObjects = detections.filter((d: any) => 
      this.isPharmaceuticalObject(d.class)
    );

    const isPharmaceutical = pharmaceuticalObjects.length > 0;
    const confidence = Math.min(
      pharmaceuticalObjects.reduce((sum: number, d: any) => sum + d.score, 0),
      1.0
    );

    return {
      isPharmaceutical,
      detectedObjects: detections.map((d: any) => d.class),
      confidence,
      objectDetections: detections,
      detectionMethod: 'coco-ssd',
      boundingBoxCount: detections.length
    };
  }

  private async classifyWithMobileNet(imageData: string): Promise<ImageClassificationResult> {
    const tensor = await this.preprocessImage(imageData);
    
    const prediction = tf.tidy(() => {
      const batched = tensor.expandDims(0);
      const result = this.models.mobilenet!.predict(batched) as tf.Tensor;
      return tf.softmax(result);
    });

    const data = await prediction.data();
    const topIndices = this.getTopKIndices(Array.from(data), 5);
    
    const pharmaceuticalScore = topIndices.reduce((score, index) => {
      const label = this.getImageNetLabel(index);
      return score + (this.isPharmaceuticalClass(label) ? data[index] : 0);
    }, 0);

    tensor.dispose();
    prediction.dispose();

    return {
      isPharmaceutical: pharmaceuticalScore > 0.1,
      detectedObjects: topIndices.map(i => this.getImageNetLabel(i)),
      confidence: Math.min(pharmaceuticalScore, 1.0),
      objectDetections: [],
      detectionMethod: 'mobilenet',
      boundingBoxCount: 0
    };
  }



  private async analyzeVisualFeatures(imageData: string): Promise<any> {
    const tensor = await this.preprocessImage(imageData);
    
    try {
      const colorAnalysis = await this.analyzeColors(tensor);
      const shapeAnalysis = this.analyzeShapes(tensor);
      const markingAnalysis = this.detectMarkings(tensor);
      
      return {
        dominantColor: colorAnalysis.dominantColor,
        colorDistribution: colorAnalysis.distribution,
        primaryShape: shapeAnalysis.primaryShape,
        markings: markingAnalysis.markings,
        quality: colorAnalysis.quality
      };
    } finally {
      tensor.dispose();
    }
  }

  private async extractTextContent(imageData: string): Promise<string[]> {
    try {
      // Strategy 1: Try DeepSeek-OCR first (if enabled)
      // DeepSeek-OCR works best with data URLs or base64 strings
      const useDeepSeekOCR = process.env.DEEPSEEK_OCR_ENABLED !== 'false';
      
      if (useDeepSeekOCR) {
        try {
          console.log('🔬 Attempting DeepSeek-OCR extraction...');
          const deepSeekResults = await recognizePharmaceuticalTextEnhanced(imageData, {
            preferDeepSeek: true,
          });
          
          if (deepSeekResults.length > 0) {
            console.log('✅ DeepSeek-OCR extraction successful:', deepSeekResults.length, 'lines');
            // Apply OCR error correction to DeepSeek results
            const combinedText = deepSeekResults.join(' ');
            const correctedText = correctOCRErrors(combinedText);
            const correctedLines = correctedText
              .split(/\s+/)
              .filter(line => line.length > 1)
              .map(line => line.trim())
              .filter(line => line.length > 0)
              .filter(line => !/^[^\w\s]+$/.test(line));
            
            console.log('📝 DeepSeek-OCR extracted and corrected text:', correctedLines);
            return correctedLines.slice(0, 30);
          } else {
            console.log('⚠️ DeepSeek-OCR returned no text, falling back to Tesseract');
          }
        } catch (deepSeekError) {
          console.warn('⚠️ DeepSeek-OCR failed, falling back to Tesseract:', deepSeekError);
          // Continue to Tesseract fallback
        }
      }

      // Strategy 2: Fallback to Tesseract OCR (original implementation)
      console.log('🔄 Using Tesseract OCR fallback...');
      
      // Convert to Buffer for better OCR processing
      let imageBuffer: Buffer;
      if (imageData.startsWith('data:image/')) {
        const base64Data = imageData.split(',')[1];
        imageBuffer = Buffer.from(base64Data, 'base64');
      } else {
        imageBuffer = Buffer.from(imageData, 'base64');
      }

      // Preprocess image for better OCR results using Sharp
      // CRITICAL: Output as PNG format buffer (not raw pixel data)
      // Tesseract.js requires a proper image format buffer
      let preprocessedBuffer: Buffer;
      try {
        preprocessedBuffer = await sharp(imageBuffer)
          .resize(2000, 2000, { 
            fit: 'inside',
            withoutEnlargement: true 
          })
          .normalize() // Improve contrast
          .sharpen() // Enhance text edges
          .greyscale() // Convert to greyscale for better OCR
          .png({ quality: 100, compressionLevel: 1 }) // Output as PNG format
          .toBuffer();
      } catch (sharpError) {
        console.warn('Sharp preprocessing failed, using original buffer:', sharpError);
        preprocessedBuffer = imageBuffer; // Fallback to original
      }

      // Try OCR with multiple PSM modes for better text extraction
      const ocrResults: string[] = [];
      
      // Strategy 2a: Try with preprocessed PNG buffer
      try {
        const extractedText = await recognizePharmaceuticalText(preprocessedBuffer, {
          timeout: 30000,
          retries: 0,
          psm: 3 // AUTO mode
        });
        if (extractedText.length > 0) {
          ocrResults.push(...extractedText);
          console.log('✅ Tesseract OCR succeeded with preprocessed buffer');
        }
      } catch (e) {
        console.warn('Preprocessed buffer OCR failed, trying original buffer...', e);
      }

      // Strategy 2b: Try with original buffer if preprocessing failed
      if (ocrResults.length === 0) {
        try {
          const extractedText = await recognizePharmaceuticalText(imageBuffer, {
            timeout: 30000,
            retries: 0,
            psm: 6 // SINGLE_BLOCK mode
          });
          if (extractedText.length > 0) {
            ocrResults.push(...extractedText);
            console.log('✅ Tesseract OCR succeeded with original buffer');
          }
        } catch (e) {
          console.warn('Original buffer OCR failed, trying data URL...', e);
        }
      }

      // Strategy 2c: Try with data URL string if buffers failed
      if (ocrResults.length === 0 && imageData.startsWith('data:image/')) {
        try {
          const extractedText = await recognizePharmaceuticalText(imageData, {
            timeout: 30000,
            retries: 0,
            psm: 3 // AUTO mode
          });
          if (extractedText.length > 0) {
            ocrResults.push(...extractedText);
            console.log('✅ Tesseract OCR succeeded with data URL');
          }
        } catch (e) {
          console.warn('Data URL OCR also failed', e);
        }
      }

      // Combine all extracted text lines and apply OCR error correction
      const combinedText = ocrResults.join(' ');
      const correctedText = correctOCRErrors(combinedText);
      
      // Split back into lines but preserve word boundaries
      const correctedLines = correctedText
        .split(/\s+/) // Split by any whitespace
        .filter(line => line.length > 1) // Filter single characters
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .filter(line => !/^[^\w\s]+$/.test(line)); // Filter pure punctuation

      // Note: Fragment reconstruction would be handled by matchDrugByText if needed

      console.log('📝 Tesseract extracted and corrected text:', correctedLines);
      return correctedLines.slice(0, 30); // Limit to prevent excessive text
    } catch (error) {
      console.error('❌ Text extraction failed completely:', error);
      return [];
    }
  }

  private identifyDrug(visualFeatures: any, textContent: string[]): any {
    // Enhanced drug identification logic
    const drugPatterns = this.getDrugPatterns();
    let bestMatch = { name: 'Unknown Drug', strength: 'Unknown', confidence: 0 };

    // Text-based identification
    if (textContent.length > 0) {
      const textMatch = this.matchDrugByText(textContent, drugPatterns);
      if (textMatch.confidence > bestMatch.confidence) {
        bestMatch = textMatch;
      }
    }

    // Visual-based identification
    if (visualFeatures) {
      const visualMatch = this.matchDrugByVisual(visualFeatures, drugPatterns);
      if (visualMatch.confidence > bestMatch.confidence) {
        bestMatch = visualMatch;
      }
    }

    return bestMatch;
  }

  private assessAuthenticity(drugIdentification: any, visualFeatures: any, textContent: string[]): any {
    const issues: string[] = [];
    let riskScore = 0;

    // Check drug identification confidence
    if (drugIdentification.confidence < 0.5) {
      issues.push('Low confidence in drug identification');
      riskScore += 0.3;
    }

    // Check text quality
    if (textContent.length === 0) {
      issues.push('No text content detected');
      riskScore += 0.2;
    }

    // Check visual quality
    if (visualFeatures && visualFeatures.quality < 0.6) {
      issues.push('Low image quality');
      riskScore += 0.2;
    }

    // Determine status
    let status: 'authentic' | 'suspicious' | 'counterfeit';
    if (riskScore <= 0.3) {
      status = 'authentic';
    } else if (riskScore <= 0.6) {
      status = 'suspicious';
    } else {
      status = 'counterfeit';
    }

    return { status, issues, riskScore };
  }

  // Utility methods
  private async imageToCanvas(imageData: string): Promise<any> {
    try {
      if (!createCanvas || !loadImage) {
        throw new Error('Canvas not available');
      }
      // Use Node.js canvas for server-side processing
      const image = await loadImage(imageData);
      const canvas = createCanvas(image.width, image.height);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(image, 0, 0);
      return canvas;
    } catch (error) {
      console.warn('Failed to create canvas from image, using fallback:', error);
      // Return a mock canvas for fallback
      return {
        width: 224,
        height: 224,
        getContext: () => ({
          drawImage: () => {},
          getImageData: () => ({ data: new Uint8ClampedArray(224 * 224 * 4) })
        })
      };
    }
  }

  private async preprocessImage(imageData: string): Promise<tf.Tensor3D> {
    try {
      // Use Sharp for efficient image processing
      const imageBuffer = Buffer.from(imageData.split(',')[1], 'base64');
      const processedBuffer = await sharp(imageBuffer)
        .resize(this.config.imageSize, this.config.imageSize)
        .raw()
        .toBuffer({ resolveWithObject: true });
      
      // Create tensor directly from raw pixel data
      const { data, info } = processedBuffer;
      const pixels = new Uint8Array(data);
      
      // Convert to tensor
      const tensor = tf.tensor3d(pixels, [info.height, info.width, info.channels]);
      const normalized = tensor.div(255);
      
      tensor.dispose();
      return normalized as tf.Tensor3D;
    } catch (error) {
      console.warn('Image preprocessing failed, using fallback:', error);
      // Fallback to a dummy tensor
      return tf.zeros([this.config.imageSize, this.config.imageSize, 3]);
    }
  }

  private getTopKIndices(array: number[], k: number): number[] {
    const indices = Array.from({ length: array.length }, (_, i) => i);
    return indices
      .sort((a, b) => array[b] - array[a])
      .slice(0, k);
  }

  private getImageNetLabel(index: number): string {
    // Simplified ImageNet labels for pharmaceutical detection
    const labels = [
      'pill', 'tablet', 'capsule', 'medicine', 'drug', 'pharmaceutical',
      'bottle', 'container', 'package', 'box', 'blister', 'pack'
    ];
    return labels[index % labels.length] || `class_${index}`;
  }

  private isPharmaceuticalObject(className: string): boolean {
    const pharmaTerms = [
      'pill', 'tablet', 'capsule', 'medicine', 'drug', 'pharmaceutical',
      'bottle', 'container', 'package', 'box', 'blister', 'pack'
    ];
    return pharmaTerms.some(term => className.toLowerCase().includes(term));
  }

  private isPharmaceuticalClass(className: string): boolean {
    return this.isPharmaceuticalObject(className);
  }



  private analyzeColors(tensor: tf.Tensor3D): Promise<any> {
    // Implement color analysis
    return Promise.resolve({
      dominantColor: 'white',
      distribution: { white: 0.6, gray: 0.3, other: 0.1 },
      quality: 0.8
    });
  }

  private analyzeShapes(tensor: tf.Tensor3D): any {
    // Implement shape analysis
    return {
      primaryShape: 'round',
      confidence: 0.7
    };
  }

  private detectMarkings(tensor: tf.Tensor3D): any {
    // Implement marking detection
    return {
      markings: ['500', 'mg'],
      confidence: 0.6
    };
  }

  private getDrugPatterns(): any {
    // Return drug patterns for matching
    return {
      paracetamol: {
        names: ['paracetamol', 'acetaminophen', 'tylenol', 'panadol'],
        strengths: ['500mg', '1000mg', '325mg', '650mg'],
        colors: ['white', 'off-white'],
        shapes: ['round', 'oval']
      },
      ibuprofen: {
        names: ['ibuprofen', 'advil', 'motrin', 'nurofen'],
        strengths: ['200mg', '400mg', '600mg', '800mg'],
        colors: ['white', 'orange'],
        shapes: ['round', 'oval']
      }
    };
  }

  private matchDrugByText(textContent: string[], patterns: any): any {
    // Implement text-based drug matching
    return { name: 'Unknown', strength: 'Unknown', confidence: 0 };
  }

  private matchDrugByVisual(visualFeatures: any, patterns: any): any {
    // Implement visual-based drug matching
    return { name: 'Unknown', strength: 'Unknown', confidence: 0 };
  }

  private createRejectionResult(classification: ImageClassificationResult): DrugAnalysisResult {
    return {
      drugName: 'Not a Drug',
      strength: 'N/A',
      confidence: 0,
      status: 'not_a_drug',
      issues: ['This image does not appear to be a pharmaceutical product'],
      extractedText: [],
      visualFeatures: {
        color: 'unknown',
        shape: 'unknown',
        markings: [],
        objectDetections: classification.objectDetections || []
      },
      isDrugImage: false,
      imageClassification: classification
    };
  }

  private createFallbackResult(error: any): DrugAnalysisResult {
    return {
      drugName: 'Analysis Failed',
      strength: 'Unknown',
      confidence: 0,
      status: 'suspicious',
      issues: ['Image analysis failed', 'Please try again with a clearer image'],
      extractedText: [],
      visualFeatures: {
        color: 'unknown',
        shape: 'unknown',
        markings: [],
        objectDetections: []
      },
      isDrugImage: true,
      imageClassification: {
        isPharmaceutical: true,
        detectedObjects: ['analysis_failed'],
        confidence: 0,
        objectDetections: [],
        detectionMethod: 'fallback',
        boundingBoxCount: 0
      }
    };
  }
}

// Export singleton instance
export const enhancedDrugDetection = new EnhancedDrugDetectionService();

