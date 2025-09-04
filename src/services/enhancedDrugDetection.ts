import * as tf from '@tensorflow/tfjs';
import { createWorker } from 'tesseract.js';
import { DrugAnalysisResult, ImageClassificationResult } from '@/lib/types';

// Enhanced drug detection service with multi-model ensemble approach
export class EnhancedDrugDetectionService {
  private models: {
    mobilenet?: tf.GraphModel;
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
    maxProcessingTime: 10000, // 10 seconds
    imageSize: 224,
    enableGPU: true,
    fallbackMode: 'heuristic' as 'heuristic' | 'basic' | 'none'
  };

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('🚀 Initializing Enhanced Drug Detection Service...');
      
      // Set backend based on environment
      if (typeof window === 'undefined') {
        require('@tensorflow/tfjs-node');
        await tf.setBackend('tensorflow');
      } else {
        await tf.ready();
        if (this.config.enableGPU && await tf.backend().isGPUPackage) {
          await tf.setBackend('webgl');
        }
      }

      // Initialize models in parallel
      await Promise.allSettled([
        this.initializeMobileNet(),
        this.initializeCocoSsd(),
        this.initializeTesseract()
      ]);

      this.isInitialized = true;
      console.log('✅ Enhanced Drug Detection Service initialized:', this.modelStatus);
      
    } catch (error) {
      console.error('❌ Failed to initialize Enhanced Drug Detection Service:', error);
      // Continue with fallback mode
      this.isInitialized = true;
    }
  }

  private async initializeMobileNet(): Promise<void> {
    try {
      const modelUrl = 'https://tfhub.dev/google/imagenet/mobilenet_v2_100_224/classification/2';
      this.models.mobilenet = await tf.loadGraphModel(modelUrl, { fromTFHub: true });
      
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
      // Use dynamic import to avoid SSR issues
      const cocoSsd = await import('@tensorflow-models/coco-ssd');
      this.models.cocoSsd = await cocoSsd.load({ base: 'lite_mobilenet_v2' });
      this.modelStatus.cocoSsd = true;
      console.log('✅ COCO-SSD model loaded successfully');
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
        textAnalysis.status === 'fulfilled' ? textAnalysis.value : null
      );

      // Step 5: Authenticity assessment
      const authenticity = this.assessAuthenticity(
        drugIdentification,
        visualAnalysis.status === 'fulfilled' ? visualAnalysis.value : null,
        textAnalysis.status === 'fulfilled' ? textAnalysis.value : null
      );

      const processingTime = Date.now() - startTime;
      console.log(`✅ Analysis completed in ${processingTime}ms`);

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
      console.error('❌ Enhanced drug analysis failed:', error);
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
      const canvas = await this.imageToCanvas(imageData);
      const { data: { text } } = await this.models.tesseract!.recognize(canvas);
      
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
  private async imageToCanvas(imageData: string): Promise<HTMLCanvasElement> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        resolve(canvas);
      };
      img.src = imageData;
    });
  }

  private async preprocessImage(imageData: string): Promise<tf.Tensor3D> {
    const canvas = await this.imageToCanvas(imageData);
    const tensor = tf.browser.fromPixels(canvas);
    const resized = tf.image.resizeBilinear(tensor, [this.config.imageSize, this.config.imageSize]);
    const normalized = resized.div(255);
    
    tensor.dispose();
    resized.dispose();
    
    return normalized;
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
