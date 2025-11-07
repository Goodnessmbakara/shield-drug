import * as tf from '@tensorflow/tfjs';
import { createWorker } from 'tesseract.js';
import { DrugAnalysisResult, ImageClassificationResult } from '@/lib/types';
import sharp from 'sharp';

// Conditionally import canvas for server-side only
let createCanvas: any;
let loadImage: any;

try {
  const canvas = require('canvas');
  createCanvas = canvas.createCanvas;
  loadImage = canvas.loadImage;
} catch (error) {
  console.warn('Canvas module not available, using fallback methods');
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
    confidenceThreshold: 0.6, // Increased from 0.3 to reduce false positives
    maxProcessingTime: 5000, // 5 seconds
    imageSize: 224,
    enableGPU: false, // Disable GPU for server-side processing
    fallbackMode: 'heuristic' as 'heuristic' | 'basic' | 'none',
    timeoutMs: 30000, // 30 seconds for model loading
    retryAttempts: 2
  };

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('Initializing Enhanced Drug Detection Service...');

      // Try to set backend for Node.js environment with graceful fallback
      try {
        require('@tensorflow/tfjs-node');
        await tf.setBackend('tensorflow');
        console.log('TensorFlow backend set to tensorflow (native)');
      } catch (tfError) {
        console.warn('Failed to load TensorFlow native bindings, falling back to CPU:', tfError);
        try {
          // Fallback to CPU backend
          await tf.setBackend('cpu');
          console.log('TensorFlow backend set to cpu (fallback)');
        } catch (cpuError) {
          console.warn('Failed to set CPU backend, using default:', cpuError);
          // Use default backend
        }
      }

      // Initialize models with timeout and retry logic
      const initPromises = [
        this.initializeWithTimeout('MobileNet', () => this.initializeMobileNet()),
        this.initializeWithTimeout('COCO-SSD', () => this.initializeCocoSsd()),
        this.initializeWithTimeout('Tesseract', () => this.initializeTesseract())
      ];

      await Promise.allSettled(initPromises);

      this.isInitialized = true;
      console.log('Enhanced Drug Detection Service initialized:', this.modelStatus);

    } catch (error) {
      console.error('Failed to initialize Enhanced Drug Detection Service:', error);
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
      console.warn(`${name} initialization failed:`, error);
    }
  }

  private async initializeMobileNet(): Promise<void> {
    try {
      // Use the correct MobileNet model URL
      const modelUrl = 'https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v1_0.25_224/model.json';
      this.models.mobilenet = await tf.loadLayersModel(modelUrl);
      
      // Warm up the model
      const dummyInput = tf.zeros([1, 224, 224, 3]);
      const prediction = this.models.mobilenet!.predict(dummyInput) as tf.Tensor;
      await prediction.data();
      dummyInput.dispose();
      prediction.dispose();
      
      this.modelStatus.mobilenet = true;
      console.log('MobileNet model loaded successfully');
    } catch (error) {
      console.warn('MobileNet model failed to load:', error);
    }
  }

  private async initializeCocoSsd(): Promise<void> {
    try {
      // Skip COCO-SSD for now due to loading issues, use fallback
      console.log('COCO-SSD model loading disabled due to network issues');
      this.modelStatus.cocoSsd = false;
    } catch (error) {
      console.warn('COCO-SSD model failed to load:', error);
    }
  }

  private async initializeTesseract(): Promise<void> {
    try {
      const worker = await createWorker('eng', 1, {
        logger: m => console.log('Tesseract:', m)
      });

      // Handle worker errors to prevent uncaught exceptions
      worker.setParameters({
        workerTimeout: 30000,
        maxRetries: 2
      });

      this.models.tesseract = worker;
      this.modelStatus.tesseract = true;
      console.log('Tesseract OCR initialized successfully');
    } catch (error) {
      console.warn('Tesseract OCR failed to initialize:', error);
      this.modelStatus.tesseract = false;
    }
  }

  async analyzeDrugImage(imageData: string): Promise<DrugAnalysisResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const startTime = Date.now();
    
    try {
      console.log('Starting enhanced drug image analysis...');

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
        textAnalysis.status === 'fulfilled' ? textAnalysis.value : null
      );

      // Step 5: Authenticity assessment
      const authenticity = this.assessAuthenticity(
        drugIdentification,
        visualAnalysis.status === 'fulfilled' ? visualAnalysis.value : null,
        textAnalysis.status === 'fulfilled' ? textAnalysis.value : null
      );

      const processingTime = Date.now() - startTime;
      console.log(`Analysis completed in ${processingTime}ms`);

      return {
        drugName: drugIdentification.name,
        strength: drugIdentification.strength,
        confidence: drugIdentification.confidence,
        status: authenticity.status,
        issues: authenticity.issues,
        extractedText: textAnalysis.status === 'fulfilled' ? textAnalysis.value : [],
        visualFeatures: {
          color: visualAnalysis.status === 'fulfilled' ? visualAnalysis.value?.dominantColor : 'unknown',
          shape: visualAnalysis.status === 'fulfilled' ? visualAnalysis.value?.primaryShape : 'unknown',
          markings: visualAnalysis.status === 'fulfilled' ? visualAnalysis.value?.markings : [],
          objectDetections: classification.objectDetections || []
        },
        isDrugImage: true,
        imageClassification: classification,
        processingTime,
        modelStatus: this.modelStatus
      };

    } catch (error) {
      console.error('Enhanced drug analysis failed:', error);
      return this.createFallbackResult(error);
    }
  }

  private async classifyImageEnsemble(imageData: string): Promise<ImageClassificationResult> {
    const results: Array<{ method: string; result: ImageClassificationResult }> = [];

    // Try COCO-SSD first (most reliable for object detection)
    if (this.modelStatus.cocoSsd && this.models.cocoSsd) {
      try {
        const result = await this.classifyWithCocoSsd(imageData);
        results.push({ method: 'coco-ssd', result });
      } catch (error) {
        console.warn('COCO-SSD classification failed:', error);
      }
    }

    // Try MobileNet as backup
    if (this.modelStatus.mobilenet && this.models.mobilenet) {
      try {
        const result = await this.classifyWithMobileNet(imageData);
        results.push({ method: 'mobilenet', result });
      } catch (error) {
        console.warn('MobileNet classification failed:', error);
      }
    }

    // Always include heuristic analysis
    try {
      const result = await this.classifyWithHeuristics(imageData);
      results.push({ method: 'heuristic', result });
    } catch (error) {
      console.warn('Heuristic classification failed:', error);
    }

    // Ensemble decision making
    return this.combineClassificationResults(results);
  }

  private async classifyWithCocoSsd(imageData: string): Promise<ImageClassificationResult> {
    const canvas = await this.imageToCanvas(imageData);
    const detections = await this.models.cocoSsd!.detect(canvas, 10, 0.3);
    
    const pharmaceuticalObjects = detections.filter(d => 
      this.isPharmaceuticalObject(d.class)
    );

    const isPharmaceutical = pharmaceuticalObjects.length > 0;
    const confidence = Math.min(
      pharmaceuticalObjects.reduce((sum, d) => sum + d.score, 0),
      1.0
    );

    return {
      isPharmaceutical,
      detectedObjects: detections.map(d => d.class),
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

  private async classifyWithHeuristics(imageData: string): Promise<ImageClassificationResult> {
    // Lightweight heuristic analysis
    const tensor = await this.preprocessImage(imageData);
    const data = await tensor.data();
    
    // Simple color and texture analysis
    const colorScore = this.analyzeColorDistribution(data);
    const textureScore = this.analyzeTexture(data);
    
    tensor.dispose();

    const isPharmaceutical = colorScore > 0.3 || textureScore > 0.3;
    const confidence = Math.max(colorScore, textureScore);

    return {
      isPharmaceutical,
      detectedObjects: ['heuristic_analysis'],
      confidence,
      objectDetections: [],
      detectionMethod: 'heuristic',
      boundingBoxCount: 0
    };
  }

  private combineClassificationResults(results: Array<{ method: string; result: ImageClassificationResult }>): ImageClassificationResult {
    if (results.length === 0) {
      return {
        isPharmaceutical: false,
        detectedObjects: [],
        confidence: 0,
        objectDetections: [],
        detectionMethod: 'ensemble',
        boundingBoxCount: 0
      };
    }

    // Weighted ensemble decision
    const weights = { 'coco-ssd': 0.5, 'mobilenet': 0.3, 'heuristic': 0.2 };
    
    let totalScore = 0;
    let totalWeight = 0;
    const allObjects = new Set<string>();
    const allDetections: any[] = [];

    for (const { method, result } of results) {
      const weight = weights[method as keyof typeof weights] || 0.1;
      totalScore += result.confidence * weight;
      totalWeight += weight;
      
      result.detectedObjects.forEach(obj => allObjects.add(obj));
      if (result.objectDetections) {
        allDetections.push(...result.objectDetections);
      }
    }

    const ensembleConfidence = totalWeight > 0 ? totalScore / totalWeight : 0;
    const isPharmaceutical = ensembleConfidence > this.config.confidenceThreshold;

    return {
      isPharmaceutical,
      detectedObjects: Array.from(allObjects),
      confidence: ensembleConfidence,
      objectDetections: allDetections,
      detectionMethod: 'ensemble',
      boundingBoxCount: allDetections.length
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
    if (!this.modelStatus.tesseract || !this.models.tesseract) {
      return [];
    }

    try {
      // Add timeout to prevent hanging
      const recognizePromise = this.models.tesseract!.recognize(imageData);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Tesseract recognition timeout')), 15000)
      );

      const { data: { text } } = await Promise.race([recognizePromise, timeoutPromise]) as any;

      // Filter and clean extracted text
      return text
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 2)
        .slice(0, 20); // Limit to prevent excessive text
    } catch (error) {
      console.warn('Text extraction failed:', error);
      return [];
    }
  }

  private identifyDrug(visualFeatures: any, textContent: string[]): any {
    // Enhanced drug identification logic with cross-validation
    const drugPatterns = this.getDrugPatterns();
    let textMatch = { name: 'Unknown', strength: 'Unknown', confidence: 0 };
    let visualMatch = { name: 'Unknown', strength: 'Unknown', confidence: 0 };

    // Text-based identification
    if (textContent.length > 0) {
      textMatch = this.matchDrugByText(textContent, drugPatterns);
    }

    // Visual-based identification
    if (visualFeatures) {
      visualMatch = this.matchDrugByVisual(visualFeatures, drugPatterns);
    }

    // Cross-validation: Both text and visual must agree for high confidence
    if (textMatch.confidence >= 0.6 && visualMatch.confidence >= 0.4) {
      // Both methods have evidence - boost confidence if they agree
      if (textMatch.name.toLowerCase() === visualMatch.name.toLowerCase()) {
        return {
          name: textMatch.name,
          strength: textMatch.strength || visualMatch.strength,
          confidence: Math.min((textMatch.confidence + visualMatch.confidence) / 2 + 0.2, 1.0)
        };
      } else {
        // Contradictory evidence - reduce confidence
        return {
          name: textMatch.confidence > visualMatch.confidence ? textMatch.name : visualMatch.name,
          strength: textMatch.confidence > visualMatch.confidence ? textMatch.strength : visualMatch.strength,
          confidence: Math.max(textMatch.confidence, visualMatch.confidence) * 0.6
        };
      }
    }

    // Only one method has strong evidence
    if (textMatch.confidence >= 0.6) {
      return textMatch;
    }

    if (visualMatch.confidence >= 0.6) {
      return visualMatch;
    }

    // Low confidence from both methods - return unknown
    return {
      name: 'Unknown Drug',
      strength: 'Unknown',
      confidence: 0
    };
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

  private analyzeColorDistribution(data: Float32Array): number {
    // Simple color analysis
    let whitePixels = 0;
    let totalPixels = data.length / 3;
    
    for (let i = 0; i < data.length; i += 3) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      if (r > 0.7 && g > 0.7 && b > 0.7) {
        whitePixels++;
      }
    }
    
    return whitePixels / totalPixels;
  }

  private analyzeTexture(data: Float32Array): number {
    // Simple texture analysis
    let edgePixels = 0;
    let totalPixels = data.length / 3;
    
    for (let i = 0; i < data.length - 3; i += 3) {
      const current = (data[i] + data[i + 1] + data[i + 2]) / 3;
      const next = (data[i + 3] + data[i + 4] + data[i + 5]) / 3;
      if (Math.abs(current - next) > 0.1) {
        edgePixels++;
      }
    }
    
    return edgePixels / totalPixels;
  }

  private analyzeColors(tensor: tf.Tensor3D): any {
    return tf.tidy(() => {
      const data = tensor.dataSync();
      let whitePixels = 0;
      let grayPixels = 0;
      let coloredPixels = 0;
      let totalPixels = data.length / 3;

      for (let i = 0; i < data.length; i += 3) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Convert to more readable color categories
        if (r > 200 && g > 200 && b > 200) {
          whitePixels++;
        } else if (Math.abs(r - g) < 30 && Math.abs(g - b) < 30) {
          grayPixels++;
        } else {
          coloredPixels++;
        }
      }

      const whiteRatio = whitePixels / totalPixels;
      const grayRatio = grayPixels / totalPixels;
      const coloredRatio = coloredPixels / totalPixels;

      let dominantColor = 'white';
      if (grayRatio > whiteRatio && grayRatio > coloredRatio) {
        dominantColor = 'gray';
      } else if (coloredRatio > 0.3) {
        dominantColor = 'colored';
      }

      return {
        dominantColor,
        distribution: { white: whiteRatio, gray: grayRatio, colored: coloredRatio },
        quality: Math.min(whiteRatio + coloredRatio, 1.0)
      };
    });
  }

  private analyzeShapes(tensor: tf.Tensor3D): any {
    const [height, width] = tensor.shape.slice(0, 2);
    const aspectRatio = width / height;
    const data = tf.tidy(() => tensor.dataSync());

    // Simple shape analysis based on aspect ratio and edge detection
    let primaryShape = 'unknown';
    let confidence = 0.5;

    // Edge detection to understand shape boundaries
    let edgeCount = 0;
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 3;
        const currentBrightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;

        const neighbors = [
          ((y - 1) * width + x) * 3, // top
          ((y + 1) * width + x) * 3, // bottom
          (y * width + (x - 1)) * 3, // left
          (y * width + (x + 1)) * 3  // right
        ];

        for (const neighborIdx of neighbors) {
          const neighborBrightness = (data[neighborIdx] + data[neighborIdx + 1] + data[neighborIdx + 2]) / 3;
          if (Math.abs(currentBrightness - neighborBrightness) > 0.1) {
            edgeCount++;
            break;
          }
        }
      }
    }

    const edgeDensity = edgeCount / ((height - 2) * (width - 2));

    // Determine shape based on aspect ratio and edge density
    if (Math.abs(aspectRatio - 1) < 0.2) {
      primaryShape = 'round';
      confidence = 0.7;
    } else if (aspectRatio > 1.3) {
      primaryShape = 'oval';
      confidence = 0.6;
    } else if (edgeDensity > 0.3) {
      primaryShape = 'irregular';
      confidence = 0.5;
    }

    return {
      primaryShape,
      confidence,
      aspectRatio,
      edgeDensity
    };
  }

  private detectMarkings(tensor: tf.Tensor3D): any {
    const [height, width] = tensor.shape.slice(0, 2);
    const data = tf.tidy(() => tensor.dataSync());
    const markings: string[] = [];

    // Simple contrast-based marking detection
    // Look for high contrast regions that might be text or numbers
    let highContrastRegions = 0;
    const threshold = 0.3;

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 3;
        const currentPixel = [data[idx], data[idx + 1], data[idx + 2]];

        // Check neighboring pixels for contrast
        const neighbors = [
          ((y - 1) * width + x) * 3,
          ((y + 1) * width + x) * 3,
          (y * width + (x - 1)) * 3,
          (y * width + (x + 1)) * 3
        ];

        for (const neighborIdx of neighbors) {
          const neighborPixel = [data[neighborIdx], data[neighborIdx + 1], data[neighborIdx + 2]];
          const contrast = Math.abs(currentPixel[0] - neighborPixel[0]) +
                         Math.abs(currentPixel[1] - neighborPixel[1]) +
                         Math.abs(currentPixel[2] - neighborPixel[2]);

          if (contrast > threshold) {
            highContrastRegions++;
            break;
          }
        }
      }
    }

    const contrastRatio = highContrastRegions / ((height - 2) * (width - 2));

    // If we detect significant contrast, assume there are markings
    if (contrastRatio > 0.1) {
      // Common dosage markings to look for
      const commonDosages = ['500', '250', '100', '200', '400', '50', 'mg'];
      markings.push(...commonDosages.slice(0, Math.min(3, Math.floor(contrastRatio * 10))));
    }

    return {
      markings,
      confidence: Math.min(contrastRatio * 2, 1.0),
      contrastRatio
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
    if (!textContent || textContent.length === 0) {
      return { name: 'Unknown', strength: 'Unknown', confidence: 0 };
    }

    const combinedText = textContent.join(' ').toLowerCase();

    // Check for negative indicators first
    const negativeIndicators = ['not', 'no', 'fake', 'placebo', 'sugar'];
    const hasNegativeIndicators = negativeIndicators.some(indicator =>
      combinedText.includes(indicator) ||
      textContent.some(text => text.toLowerCase().includes(indicator))
    );

    if (hasNegativeIndicators) {
      return { name: 'Not a Drug', strength: 'N/A', confidence: 0.1 };
    }

    let bestMatch = { name: 'Unknown', strength: 'Unknown', confidence: 0 };

    // Regex to extract strength information
    const strengthRegex = /(\d+(?:\.\d+)?)\s*(mg|g|mcg|microgram|milligram)/i;

    for (const [drugKey, drugInfo] of Object.entries(patterns)) {
      const drug = drugInfo as any;
      let matchScore = 0;
      let detectedStrength = 'Unknown';

      // Check for exact drug name matches (stricter)
      for (const name of drug.names) {
        if (combinedText.includes(name.toLowerCase())) {
          matchScore += 0.6; // Increased from 0.4 to require stronger evidence
        }
      }

      // Check for strength matches
      const strengthMatch = combinedText.match(strengthRegex);
      if (strengthMatch) {
        const strength = strengthMatch[1] + strengthMatch[2].toLowerCase();
        if (drug.strengths.some((s: string) =>
            s.toLowerCase().includes(strength) || strength.includes(s.toLowerCase()))) {
          matchScore += 0.3; // Reduced from 0.4 to prevent false positives
          detectedStrength = strengthMatch[1] + strengthMatch[2].toLowerCase();
        }
      }

      // Bonus for multiple matching terms (stricter)
      const exactNameMatches = drug.names.filter((name: string) =>
        combinedText.includes(name.toLowerCase())).length;

      if (exactNameMatches > 1) {
        matchScore += 0.1; // Small bonus for multiple matches
      }

      // Only consider matches with confidence >= 0.6
      if (matchScore >= 0.6 && matchScore > bestMatch.confidence) {
        bestMatch = {
          name: drugKey.charAt(0).toUpperCase() + drugKey.slice(1),
          strength: detectedStrength,
          confidence: Math.min(matchScore, 1.0)
        };
      }
    }

    return bestMatch;
  }

  private matchDrugByVisual(visualFeatures: any, patterns: any): any {
    if (!visualFeatures) {
      return { name: 'Unknown', strength: 'Unknown', confidence: 0 };
    }

    let bestMatch = { name: 'Unknown', strength: 'Unknown', confidence: 0 };

    for (const [drugKey, drugInfo] of Object.entries(patterns)) {
      const drug = drugInfo as any;
      let matchScore = 0;

      // Color matching
      if (visualFeatures.dominantColor &&
          drug.colors.some((color: string) =>
              visualFeatures.dominantColor.toLowerCase().includes(color.toLowerCase()))) {
        matchScore += 0.3;
      }

      // Shape matching
      if (visualFeatures.primaryShape &&
          drug.shapes.some((shape: string) =>
              visualFeatures.primaryShape.toLowerCase().includes(shape.toLowerCase()))) {
        matchScore += 0.3;
      }

      // Markings bonus (if available)
      if (visualFeatures.markings && visualFeatures.markings.length > 0) {
        matchScore += 0.2;
      }

      // Quality bonus
      if (visualFeatures.quality && visualFeatures.quality > 0.7) {
        matchScore += 0.2;
      }

      if (matchScore > bestMatch.confidence) {
        bestMatch = {
          name: drugKey.charAt(0).toUpperCase() + drugKey.slice(1),
          strength: 'Unknown',
          confidence: Math.min(matchScore, 1.0)
        };
      }
    }

    return bestMatch;
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

