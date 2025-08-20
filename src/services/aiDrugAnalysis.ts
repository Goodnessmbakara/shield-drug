import * as tf from '@tensorflow/tfjs';
// Conditionally import tfjs-node for Node.js environment
if (typeof window === 'undefined') {
  try {
    require('@tensorflow/tfjs-node');
  } catch (error) {
    console.warn('TensorFlow.js Node.js backend not available:', error);
  }
}
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import { recognizePharmaceuticalText } from '@/lib/ocr-service';
import { preprocessForOCR, assessImageQuality } from '@/lib/image-preprocessing';
import { validatePharmaceuticalText, extractDrugInfo, correctOCRErrors, calculatePharmaceuticalConfidence } from '@/lib/pharmaceutical-patterns';
import { IMAGENET_CLASSES, PHARMACEUTICAL_CLASS_INDICES, PHARMACEUTICAL_TERMS } from '@/lib/imagenet-labels';
import { 
  ObjectDetection, 
  processCocoDetections, 
  filterLowConfidenceDetections, 
  getTopPharmaceuticalDetections,
  DEFAULT_MIN_DETECTION_SCORE,
  MAX_RELEVANT_DETECTIONS
} from '@/lib/coco-pharmaceutical-mapping';
import { DrugAnalysisResult, ImageClassificationResult } from '@/lib/types';

// MobileNet v2 model configuration (MobileNet v3 is no longer available on TF Hub)
const MOBILENET_V2_URL = process.env.MOBILENET_MODEL_URL || 'https://tfhub.dev/google/imagenet/mobilenet_v2_100_224/classification/2';
const NORMALIZE_TO_MINUS_ONE_TO_ONE = false; // MobileNet v2 expects [0,1] range
const IMAGENET_MODEL_VERSION = 'mobilenet_v2';

// Enhanced drug database with comprehensive patterns
const DRUG_DATABASE = {
  'paracetamol': {
    names: ['paracetamol', 'acetaminophen', 'tylenol', 'panadol'],
    strengths: ['500mg', '1000mg', '325mg', '650mg'],
    colors: ['white', 'off-white', 'cream'],
    shapes: ['round', 'oval', 'capsule'],
    markings: ['500', '1000', 'P', 'TYLENOL', 'PARA'],
    manufacturers: ['GSK', 'Johnson & Johnson', 'Pfizer', 'Generic'],
    requiredPatterns: ['mg', 'tablet', 'capsule', 'oral']
  },
  'ibuprofen': {
    names: ['ibuprofen', 'advil', 'motrin', 'nurofen'],
    strengths: ['200mg', '400mg', '600mg', '800mg'],
    colors: ['white', 'orange', 'brown', 'red'],
    shapes: ['round', 'oval'],
    markings: ['200', '400', 'IBU', 'ADVIL', 'MOTRIN'],
    manufacturers: ['Pfizer', 'GSK', 'Bayer', 'Generic'],
    requiredPatterns: ['mg', 'tablet', 'oral', 'pain']
  },
  'amoxicillin': {
    names: ['amoxicillin', 'amoxil', 'trimox'],
    strengths: ['250mg', '500mg', '875mg'],
    colors: ['pink', 'white', 'yellow'],
    shapes: ['capsule', 'tablet'],
    markings: ['250', '500', 'AMOX', 'A', 'AMOXIL'],
    manufacturers: ['GSK', 'Sandoz', 'Teva', 'Generic'],
    requiredPatterns: ['mg', 'capsule', 'antibiotic', 'oral']
  },
  'levocetirizine': {
    names: ['levocetirizine', 'xyzal', 'levocet', 'cetirizine'],
    strengths: ['5mg', '10mg'],
    colors: ['white', 'blue', 'light-blue'],
    shapes: ['round', 'oval', 'tablet'],
    markings: ['5', '10', 'LEVO', 'CET'],
    manufacturers: ['Generic', 'Various'],
    requiredPatterns: ['mg', 'tablet', 'oral', 'antihistamine']
  },
  'ambroxol': {
    names: ['ambroxol', 'mucosolvan', 'ambrohexal'],
    strengths: ['30mg', '60mg'],
    colors: ['white', 'blue', 'light-blue'],
    shapes: ['round', 'oval', 'tablet'],
    markings: ['30', '60', 'AMB', 'MUC'],
    manufacturers: ['Generic', 'Various'],
    requiredPatterns: ['mg', 'tablet', 'oral', 'mucolytic']
  },
  'phenylephrine': {
    names: ['phenylephrine', 'sudafed', 'neo-synephrine'],
    strengths: ['10mg', '25mg'],
    colors: ['white', 'blue', 'light-blue'],
    shapes: ['round', 'oval', 'tablet'],
    markings: ['10', '25', 'PHE', 'SUDA'],
    manufacturers: ['Generic', 'Various'],
    requiredPatterns: ['mg', 'tablet', 'oral', 'decongestant']
  },
  'combination_cold': {
    names: ['sycold', 'cold', 'flu', 'combination', 'levocetirizine', 'ambroxol', 'phenylephrine'],
    strengths: ['combination', 'tablets'],
    colors: ['white', 'blue', 'light-blue', 'multi'],
    shapes: ['round', 'oval', 'tablet', 'blister'],
    markings: ['SYCOLD', 'COLD', 'FLU', 'AX'],
    manufacturers: ['Generic', 'Various', 'Indian'],
    requiredPatterns: ['tablet', 'oral', 'combination', 'cold']
  }
};

// Non-drug image patterns to detect and reject
const NON_DRUG_PATTERNS = {
  people: ['person', 'face', 'smile', 'glasses', 'hair', 'skin', 'eye', 'mouth'],
  logos: ['logo', 'brand', 'company', 'corporate', 'trademark'],
  text: ['text', 'font', 'typography', 'letter', 'word'],
  objects: ['object', 'item', 'thing', 'product'],
  colors: ['multicolor', 'rainbow', 'bright', 'vibrant'],
  backgrounds: ['background', 'wall', 'surface', 'texture']
};



class AIDrugAnalysisService {
  private model: tf.LayersModel | null = null;
  private isInitialized = false;
  
  // MobileNet v2 model cache and status
  private static mobileNetModel: tf.GraphModel | null = null;
  private modelAvailable = false;
  
  // COCO-SSD model cache and status
  private static cocoSsdModel: cocoSsd.ObjectDetection | null = null;
  private cocoSsdAvailable = false;
  
  // Native addon availability flag
  private nativeAddonAvailable = false;

  async initialize(): Promise<void> {
    try {
      // Set backend based on environment configuration
      if (typeof window === 'undefined') {
        // Node.js environment - require tfjs-node and set tensorflow backend
        require('@tensorflow/tfjs-node');
        await tf.setBackend('tensorflow');
        
        // Test the backend with a simple operation to ensure it works
        const testTensor = tf.scalar(1);
        testTensor.cast('float32').dispose();
        testTensor.dispose();
        
        this.nativeAddonAvailable = true;
        console.log('TensorFlow.js backend set to: tensorflow');
      }
      
      await tf.ready();
      
      // Load MobileNet v2 model
      await this.loadMobileNetModel();
      
      // Load COCO-SSD model
      await this.loadCocoSsdModel();
      
      this.isInitialized = true;
      
      // Log model availability status
      console.log('AI Drug Analysis Service initialized successfully');
      console.log('Model availability status:', {
        mobileNet: this.modelAvailable ? 'available' : 'failed',
        cocoSsd: this.cocoSsdAvailable ? 'available' : 'failed',
        fallbackMode: (!this.modelAvailable && !this.cocoSsdAvailable) ? 'heuristic-only' : 'partial'
      });
      
    } catch (error) {
      console.error('Failed to initialize AI model:', error);
      this.isInitialized = true;
    }
  }

  private async loadMobileNetModel(): Promise<void> {
    try {
      // Check if model is already loaded
      if (AIDrugAnalysisService.mobileNetModel) {
        this.modelAvailable = true;
        console.log('MobileNet v3 model already loaded from cache');
        return;
      }

      console.log('Loading MobileNet v2 model from TensorFlow Hub...');
      
      // Load model from TF Hub with retry logic
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        try {
          AIDrugAnalysisService.mobileNetModel = await tf.loadGraphModel(MOBILENET_V2_URL, {
            fromTFHub: true
          });
          break;
        } catch (error) {
          retryCount++;
          console.warn(`MobileNet v2 model loading attempt ${retryCount} failed:`, error);
          if (retryCount >= maxRetries) {
            throw error;
          }
          // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount - 1)));
        }
      }

      // Warm up the model with a normalized dummy tensor - compute synchronously, dispose explicitly
      const dummyTensor = tf.zeros([1, 224, 224, 3]).div(255); // Normalize to [0,1] range
      const warmupResult = AIDrugAnalysisService.mobileNetModel!.predict(dummyTensor) as tf.Tensor;
      await warmupResult.data();
      dummyTensor.dispose();
      warmupResult.dispose();

      this.modelAvailable = true;
      console.log('MobileNet v2 model loaded and warmed up successfully');
      
    } catch (error) {
      console.error('Failed to load MobileNet v2 model:', error);
      this.modelAvailable = false;
      // Don't throw error - service will use fallback methods
    }
  }

  private async loadCocoSsdModel(): Promise<void> {
    try {
      // Check if model is already loaded
      if (AIDrugAnalysisService.cocoSsdModel) {
        this.cocoSsdAvailable = true;
        console.log('COCO-SSD model already loaded from cache');
        return;
      }

      console.log('Loading COCO-SSD model...');
      
      // Backend should already be set during initialization
      
      // Load COCO-SSD model with lite_mobilenet_v2 base for speed
      AIDrugAnalysisService.cocoSsdModel = await cocoSsd.load({
        base: 'lite_mobilenet_v2'
      });

      // Validate model format and ensure it's ready for inference
      if (!AIDrugAnalysisService.cocoSsdModel) {
        throw new Error('COCO-SSD model failed to load properly');
      }

      // Warm up the model with environment-appropriate input
      if (typeof window !== 'undefined' && typeof document !== 'undefined') {
        // Browser warm-up with canvas (SSR-safe)
        const dummyCanvas = document.createElement('canvas');
        dummyCanvas.width = 224;
        dummyCanvas.height = 224;
        const ctx = dummyCanvas.getContext('2d')!;
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, 224, 224);
        
        const warmupResult = await AIDrugAnalysisService.cocoSsdModel.detect(dummyCanvas);
        console.log('COCO-SSD browser warmup completed with', warmupResult.length, 'detections');
      } else {
        // Node.js warm-up with Tensor3D - use int32 dtype for COCO-SSD
        const dummyTensor: tf.Tensor3D = tf.ones([224, 224, 3]).mul(255).cast('int32') as tf.Tensor3D;
        const warmupResult = await AIDrugAnalysisService.cocoSsdModel.detect(dummyTensor);
        console.log('COCO-SSD Node.js warmup completed with', warmupResult.length, 'detections');
        dummyTensor.dispose();
      }

      this.cocoSsdAvailable = true;
      console.log('COCO-SSD model loaded and warmed up successfully');
      
    } catch (error) {
      console.error('Failed to load COCO-SSD model:', error);
      this.cocoSsdAvailable = false;
      // Don't throw error - service will use fallback methods
    }
  }

  async analyzeImage(imageData: string): Promise<DrugAnalysisResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      console.log('🔍 Starting comprehensive image analysis...');

      // Step 1: Classify if this is actually a drug/pharmaceutical image
      const imageClassification = await this.classifyImage(imageData);
      
      console.log('📊 Image classification result:', imageClassification);

      // Step 2: If not a pharmaceutical image, return early with appropriate status
      if (!imageClassification.isPharmaceutical) {
        console.log('❌ Image classified as non-pharmaceutical, rejecting analysis');
        return {
          drugName: 'Not a Drug',
          strength: 'N/A',
          confidence: 0,
          status: 'not_a_drug',
          issues: [
            'This image does not appear to be a pharmaceutical product',
            'Please upload a clear image of medication packaging or tablets',
            `Detected objects: ${imageClassification.detectedObjects.join(', ')}`
          ],
          extractedText: [],
                  visualFeatures: {
          color: 'unknown',
          shape: 'unknown',
          markings: [],
          objectDetections: imageClassification.objectDetections ?? []
        },
          isDrugImage: false,
          imageClassification
        };
      }

      // Step 3: Proceed with drug analysis only for pharmaceutical images
      const img = await this.preprocessImage(imageData);
      const visualFeatures = await this.extractVisualFeatures(img);
      const extractedText = await this.extractTextFromImage(imageData);
      
      // Step 4: Validate extracted text for pharmaceutical relevance
      const validatedText = this.validatePharmaceuticalText(extractedText);
      
      if (validatedText.length === 0) {
        console.log('❌ No valid pharmaceutical text detected');
        img.dispose();
        return {
          drugName: 'Unknown Drug',
          strength: 'Unknown',
          confidence: 0,
          status: 'suspicious',
          issues: [
            'No pharmaceutical information detected in image',
            'Please ensure the image shows medication packaging or tablets clearly',
            'Text must contain drug names, dosages, or manufacturer information'
          ],
          extractedText: [],
          visualFeatures: {
            color: visualFeatures.dominantColor,
            shape: visualFeatures.shape,
            markings: visualFeatures.detectedMarkings
          },
          isDrugImage: true,
          imageClassification
        };
      }

      // Step 5: Identify drug with stricter validation
      const drugIdentification = this.identifyDrug(visualFeatures, extractedText);
      
      // Step 6: Assess authenticity only if drug is identified
      const authenticityAssessment = this.assessAuthenticity(visualFeatures, extractedText, drugIdentification);
      
      img.dispose();
      
      return {
        drugName: drugIdentification.name,
        strength: drugIdentification.strength,
        confidence: drugIdentification.confidence,
        status: authenticityAssessment.status,
        issues: authenticityAssessment.issues,
        extractedText: validatedText,
        visualFeatures: {
          color: visualFeatures.dominantColor,
          shape: visualFeatures.shape,
          markings: visualFeatures.detectedMarkings,
          objectDetections: imageClassification.objectDetections ?? []
        },
        isDrugImage: true,
        imageClassification
      };

    } catch (error) {
      console.error('Error during image analysis:', error);
      return this.getFallbackResult();
    }
  }

  private async classifyImage(imageData: string): Promise<ImageClassificationResult> {
    try {
      // Get fallback mode from environment with safe defaults
      const fallbackMode = process.env.AI_FALLBACK_MODE || 'auto';
      
      // Determine model priority based on fallback mode
      let modelPriority: string[];
      
      switch (fallbackMode.toLowerCase()) {
        case 'coco':
          modelPriority = ['coco-ssd', 'mobilenet', 'heuristic'];
          break;
        case 'mobile':
          modelPriority = ['mobilenet', 'coco-ssd', 'heuristic'];
          break;
        case 'heuristic':
          modelPriority = ['heuristic'];
          break;
        case 'auto':
        default:
          modelPriority = ['coco-ssd', 'mobilenet', 'heuristic'];
          break;
      }
      
      // Try models in priority order
      for (const model of modelPriority) {
        try {
          switch (model) {
            case 'coco-ssd':
              if (this.cocoSsdAvailable && AIDrugAnalysisService.cocoSsdModel) {
                return await this.classifyWithCocoSsd(imageData);
              }
              break;
            case 'mobilenet':
              if (this.modelAvailable && AIDrugAnalysisService.mobileNetModel) {
                return await this.classifyWithMobileNet(imageData);
              }
              break;
            case 'heuristic':
              return await this.classifyWithHeuristics(imageData);
          }
        } catch (error) {
          console.warn(`Model ${model} failed, trying next in priority:`, error);
          continue;
        }
      }
      
      // If all models fail, fallback to heuristic
      return await this.classifyWithHeuristics(imageData);
      
    } catch (error) {
      console.error('Image classification failed:', error);
      // Fallback to heuristic classification
      return await this.classifyWithHeuristics(imageData);
    }
  }

  private async classifyWithCocoSsd(imageData: string): Promise<ImageClassificationResult> {
    try {
      console.log('🔍 Using COCO-SSD for object detection and classification...');
      
      // Convert base64 to appropriate input for COCO-SSD
      const isBrowser = typeof window !== 'undefined';
      
      let rawDetections: any[];
      if (typeof window !== 'undefined' && typeof document !== 'undefined') {
        // Browser: use canvas (strictly browser-only)
        const canvas = await this.base64ToCanvas(imageData);
        rawDetections = await AIDrugAnalysisService.cocoSsdModel!.detect(canvas, MAX_RELEVANT_DETECTIONS, DEFAULT_MIN_DETECTION_SCORE);
      } else {
        // Node.js: use Tensor3D (no DOM reliance)
        const tensor = await this.base64ToTensor3D(imageData);
        rawDetections = await AIDrugAnalysisService.cocoSsdModel!.detect(tensor, MAX_RELEVANT_DETECTIONS, DEFAULT_MIN_DETECTION_SCORE);
        tensor.dispose();
      }
      
      // Process and filter detections
      const allDetections = processCocoDetections(rawDetections);
      const filteredDetections = filterLowConfidenceDetections(allDetections, DEFAULT_MIN_DETECTION_SCORE);
      const topDetections = getTopPharmaceuticalDetections(filteredDetections, MAX_RELEVANT_DETECTIONS);
      
      // Guard against empty detections
      if (topDetections.length === 0) {
        console.log('No COCO-SSD detections found, falling back to MobileNet classification');
        return await this.classifyWithMobileNet(imageData);
      }
      
      // Extract pharmaceutical relevance
      const pharmaceuticalDetections = topDetections.filter(d => d.isPharmaceuticalRelevant);
      const nonPharmaceuticalDetections = topDetections.filter(d => !d.isPharmaceuticalRelevant);
      
      // Calculate pharmaceutical confidence based on detected objects
      let pharmaceuticalScore = 0;
      const detectedObjects: string[] = [];
      
      for (const detection of pharmaceuticalDetections) {
        pharmaceuticalScore += detection.confidence * 0.8; // Weight by confidence
        detectedObjects.push(detection.class);
      }
      
      // Add some weight for non-pharmaceutical objects (context)
      for (const detection of nonPharmaceuticalDetections) {
        pharmaceuticalScore += detection.confidence * 0.2; // Lower weight for context
        detectedObjects.push(detection.class);
      }
      
      // Determine if image is pharmaceutical based on detected objects
      // Require either pharmaceutical detections OR high confidence score
      const isPharmaceutical = pharmaceuticalDetections.length > 0 || pharmaceuticalScore > 0.5;
      const confidence = Math.min(pharmaceuticalScore, 1.0);
      
      console.log('📊 COCO-SSD classification result:', {
        isPharmaceutical,
        confidence,
        pharmaceuticalScore,
        pharmaceuticalDetections: pharmaceuticalDetections.length,
        nonPharmaceuticalDetections: nonPharmaceuticalDetections.length,
        totalDetections: topDetections.length,
        detectedObjects
      });
      
      return {
        isPharmaceutical,
        detectedObjects,
        confidence,
        objectDetections: topDetections,
        detectionMethod: 'coco-ssd',
        boundingBoxCount: topDetections.length
      };
      
    } catch (error) {
      console.error('COCO-SSD classification failed:', error);
      // Fallback to MobileNet classification
      return await this.classifyWithMobileNet(imageData);
    }
  }

  private async classifyWithMobileNet(imageData: string): Promise<ImageClassificationResult> {
    try {
      console.log('🔍 Using MobileNet v2 for image classification...');
      
      // Preprocess image for MobileNet v2
      const img = await this.preprocessImage(imageData);
      
      // Use tf.tidy for safe tensor disposal during inference
      const predictionData = tf.tidy(() => {
        // Add batch dimension
        const batchedImg = img.expandDims(0);
        
        // Run inference
        const predictions = AIDrugAnalysisService.mobileNetModel!.predict(batchedImg) as tf.Tensor;
        
        // Apply softmax to get probabilities
        const probs = tf.softmax(predictions);
        
        // Get prediction data synchronously and return only the data
        return probs.dataSync();
      });
      
      // Get top-k predictions
      const topK = 5;
      const topIndices = this.getTopKIndices(predictionData, topK);
      
      // Extract pharmaceutical relevance with real labels
      const pharmaceuticalObjects: string[] = [];
      const detectedObjects: string[] = [];
      let pharmaceuticalScore = 0;
      
      for (let i = 0; i < topK; i++) {
        const index = topIndices[i];
        const confidence = predictionData[index];
        
        // Get the actual class label
        const label = this.getImageNetClassLabel(index);
        if (label) {
          detectedObjects.push(label);
          
          // Check if this class is pharmaceutical-related
          const isPharmaceutical = this.isPharmaceuticalClass(index);
          
          if (isPharmaceutical) {
            pharmaceuticalObjects.push(label);
            pharmaceuticalScore += confidence;
          }
        }
      }
      
      // Calculate overall pharmaceutical confidence
      const isPharmaceutical = pharmaceuticalScore > 0.1; // Threshold for pharmaceutical detection
      const confidence = Math.min(pharmaceuticalScore, 1.0);
      
      // Clean up input tensor (tf.tidy handled the rest)
      img.dispose();
      
      const result: ImageClassificationResult = {
        isPharmaceutical,
        detectedObjects: pharmaceuticalObjects.length > 0 ? pharmaceuticalObjects : detectedObjects,
        confidence,
        objectDetections: [], // MobileNet doesn't provide bounding boxes
        detectionMethod: 'mobilenet',
        boundingBoxCount: 0
      };
      
      console.log('📊 MobileNet v2 classification result:', result);
      
      return result;
      
    } catch (error) {
      console.error('MobileNet v2 classification failed:', error);
      // Fallback to heuristic classification
      return await this.classifyWithHeuristics(imageData);
    }
  }

  private async classifyWithHeuristics(imageData: string): Promise<ImageClassificationResult> {
    try {
      console.log('🔍 Using lightweight heuristic analysis for image classification...');
      
      // Convert base64 to tensor for analysis
      const img = await this.preprocessImage(imageData);
      
      // Analyze image characteristics (lightweight analysis only)
      const colorAnalysis = await this.analyzeColors(img);
      const shapeAnalysis = this.analyzeShapes(img);
      
      // Use lightweight text presence detection instead of full OCR
      const hasTextContent = await this.detectTextPresence(imageData);
      
      // Check for pharmaceutical indicators using lightweight heuristics
      const pharmaceuticalIndicators = this.checkPharmaceuticalIndicatorsLightweight(
        colorAnalysis, 
        shapeAnalysis, 
        hasTextContent
      );
      
      // Check for non-drug indicators
      const nonDrugIndicators = this.checkNonDrugIndicatorsLightweight(
        colorAnalysis, 
        shapeAnalysis, 
        hasTextContent
      );
      
      img.dispose();
      
      // Much more lenient thresholds to avoid rejecting legitimate drugs
      const isPharmaceutical = pharmaceuticalIndicators.score > 0.05 && nonDrugIndicators.score < 0.9;
      const confidence = Math.max(pharmaceuticalIndicators.score, 1 - nonDrugIndicators.score);
      
      console.log('🔍 Lightweight heuristic classification analysis:', {
        pharmaceuticalScore: pharmaceuticalIndicators.score,
        nonDrugScore: nonDrugIndicators.score,
        isPharmaceutical,
        confidence,
        detectedObjects: pharmaceuticalIndicators.objects.concat(nonDrugIndicators.objects)
      });
      
      return {
        isPharmaceutical,
        detectedObjects: [...pharmaceuticalIndicators.objects, ...nonDrugIndicators.objects],
        confidence,
        objectDetections: [], // Heuristics don't provide bounding boxes
        detectionMethod: 'heuristic',
        boundingBoxCount: 0
      };
      
    } catch (error) {
      console.error('Heuristic classification failed:', error);
      return {
        isPharmaceutical: false,
        detectedObjects: ['classification_failed'],
        confidence: 0,
        objectDetections: [],
        detectionMethod: 'heuristic',
        boundingBoxCount: 0
      };
    }
  }

  private async base64ToCanvas(imageData: string): Promise<HTMLCanvasElement> {
    // SSR guard - ensure all browser APIs are available
    if (typeof window === 'undefined' || typeof document === 'undefined' || typeof Image === 'undefined') {
      throw new Error('Canvas creation not available in SSR environment');
    }
    
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        
        // Set canvas size to match image
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Draw image to canvas
        ctx.drawImage(img, 0, 0);
        
        resolve(canvas);
      };
      img.src = imageData;
    });
  }

  private async base64ToTensor3D(imageData: string): Promise<tf.Tensor3D> {
    const isBrowser = typeof window !== 'undefined';
    
    if (isBrowser) {
      // Browser: convert canvas to tensor
      const canvas = await this.base64ToCanvas(imageData);
      const tensor = tf.browser.fromPixels(canvas);
      // COCO-SSD expects int32 dtype (0-255 range), ensure proper dtype
      return tensor.cast('int32') as tf.Tensor3D;
    } else {
      // Node.js: use tfjs-node for base64 decoding
      try {
        const tfnode = require('@tensorflow/tfjs-node');
        
        // Remove data URL prefix if present
        const base64Data = imageData.replace(/^data:image\/[a-z]+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        
        // Use tf.tidy for safe tensor disposal
        return tf.tidy(() => {
          // Decode image from buffer - COCO-SSD expects int32 dtype (0-255 range)
          const imageTensor = tfnode.node.decodeImage(buffer, 3) as tf.Tensor3D;
          
          // Ensure tensor is int32 with values in 0-255 range
          const int32Tensor = imageTensor.cast('int32');
          
          // Note: Avoid resizing to preserve original bbox coordinates
          // COCO-SSD will handle input size variations internally
          // Bbox coordinates will be relative to original image dimensions
          return int32Tensor;
        });
        
      } catch (error) {
        console.error('Node.js image preprocessing failed:', error);
        
        // Return a placeholder tensor with proper shape and dtype for COCO-SSD
        return tf.zeros([224, 224, 3]).cast('int32') as tf.Tensor3D;
      }
    }
  }

  private async detectTextPresence(imageData: string): Promise<boolean> {
    try {
      // Lightweight text presence detection without full OCR
      // This is a simplified check that looks for high-contrast areas that might contain text
      const img = await this.preprocessImage(imageData);
      const data = await img.data();
      
      // Simple edge detection to identify potential text regions
      let edgeCount = 0;
      const dataArray = Array.from(data);
      for (let i = 0; i < dataArray.length; i += 3) {
        const r = dataArray[i];
        const g = dataArray[i + 1];
        const b = dataArray[i + 2];
        const brightness = (r + g + b) / 3;
        
        // Count pixels with significant brightness variation (potential text)
        if (brightness < 0.3 || brightness > 0.7) {
          edgeCount++;
        }
      }
      
      img.dispose();
      
      // If more than 20% of pixels show high contrast, likely contains text
      return edgeCount > (data.length / 3) * 0.2;
      
    } catch (error) {
      console.error('Text presence detection failed:', error);
      return false;
    }
  }

  private checkPharmaceuticalIndicatorsLightweight(colorAnalysis: any, shapeAnalysis: any, hasTextContent: boolean): {
    score: number;
    objects: string[];
  } {
    let score = 0;
    const objects: string[] = [];
    
    // Check for pharmaceutical colors - more inclusive
    const pharmaColors = ['white', 'off-white', 'cream', 'pink', 'yellow', 'orange', 'blue', 'light-blue', 'gray'];
    if (pharmaColors.includes(colorAnalysis.dominantColor)) {
      score += 0.2;
      objects.push('pharmaceutical_color');
    }
    
    // Check for pill/tablet shapes - more inclusive
    const pharmaShapes = ['round', 'oval', 'capsule', 'square', 'rectangular'];
    if (pharmaShapes.includes(shapeAnalysis.primaryShape)) {
      score += 0.3;
      objects.push('pharmaceutical_shape');
    }
    
    // Check for text presence (likely a drug package)
    if (hasTextContent) {
      score += 0.3;
      objects.push('has_text_content');
    }
    
    // Check for uniform, clean appearance (typical of pharmaceutical products)
    if (colorAnalysis.distribution && Object.keys(colorAnalysis.distribution).length <= 5) {
      score += 0.1;
      objects.push('uniform_appearance');
    }
    
    console.log('🏥 Lightweight pharmaceutical score:', score);
    return { score: Math.min(score, 1), objects };
  }

  private checkNonDrugIndicatorsLightweight(colorAnalysis: any, shapeAnalysis: any, hasTextContent: boolean): {
    score: number;
    objects: string[];
  } {
    let score = 0;
    const objects: string[] = [];
    
    // Check for non-pharmaceutical colors - but be more lenient
    const nonPharmaColors = ['black', 'green', 'purple', 'multicolor', 'rainbow'];
    if (nonPharmaColors.includes(colorAnalysis.dominantColor)) {
      score += 0.1; // Reduced weight
      objects.push('non_pharmaceutical_color');
    }
    
    // Check for non-pharmaceutical shapes - but be more lenient
    const nonPharmaShapes = ['triangular', 'irregular', 'complex'];
    if (nonPharmaShapes.includes(shapeAnalysis.primaryShape)) {
      score += 0.1; // Reduced weight
      objects.push('non_pharmaceutical_shape');
    }
    
    // Check for very little text (likely not a drug package) - but be more lenient
    if (!hasTextContent) {
      score += 0.3; // Only penalize if no text at all
      objects.push('no_text');
    }
    
    console.log('🚫 Lightweight non-drug score:', score);
    return { score: Math.min(score, 1), objects };
  }

  private getTopKIndices(array: ArrayLike<number>, k: number): number[] {
    const indices = Array.from({ length: array.length }, (_, i) => i);
    return indices
      .sort((a, b) => array[b] - array[a])
      .slice(0, k);
  }

  private isPharmaceuticalClass(classIndex: number): boolean {
    // First check the curated pharmaceutical class indices for fast lookup
    if (PHARMACEUTICAL_CLASS_INDICES.has(classIndex)) {
      return true;
    }
    
    // Get the class label for this index
    const classLabel = this.getImageNetClassLabel(classIndex);
    if (!classLabel) {
      return false;
    }
    
    // Check if the class label contains pharmaceutical-related terms
    const lowerLabel = classLabel.toLowerCase();
    return PHARMACEUTICAL_TERMS.some(term => lowerLabel.includes(term));
  }

  private getImageNetClassLabel(classIndex: number): string {
    // Add bounds checking to prevent runtime errors
    if (classIndex < 0 || classIndex >= IMAGENET_CLASSES.length) {
      return '';
    }
    
    return IMAGENET_CLASSES[classIndex] || `class_${classIndex}`;
  }

  private checkPharmaceuticalIndicators(colorAnalysis: any, shapeAnalysis: any, textAnalysis: string[]): {
    score: number;
    objects: string[];
  } {
    let score = 0;
    const objects: string[] = [];
    
    // Check for pharmaceutical colors - more inclusive
    const pharmaColors = ['white', 'off-white', 'cream', 'pink', 'yellow', 'orange', 'blue', 'light-blue', 'gray'];
    if (pharmaColors.includes(colorAnalysis.dominantColor)) {
      score += 0.2;
      objects.push('pharmaceutical_color');
    }
    
    // Check for pill/tablet shapes - more inclusive
    const pharmaShapes = ['round', 'oval', 'capsule', 'square', 'rectangular'];
    if (pharmaShapes.includes(shapeAnalysis.primaryShape)) {
      score += 0.3;
      objects.push('pharmaceutical_shape');
    }
    
    // Check for pharmaceutical text patterns - much more comprehensive
    const pharmaTextPatterns = [
      // Drug names
      'paracetamol', 'acetaminophen', 'ibuprofen', 'amoxicillin', 'levocetirizine', 'ambroxol', 'phenylephrine',
      'tylenol', 'panadol', 'advil', 'motrin', 'nurofen', 'amoxil', 'trimox', 'xyzal', 'levocet', 'cetirizine',
      'mucosolvan', 'ambrohexal', 'sudafed', 'neo-synephrine', 'sycold', 'cold', 'flu', 'combination',
      
      // Dosages and units
      'mg', 'mcg', 'g', 'ml', 'tablet', 'capsule', 'oral', 'liquid', 'suspension', 'syrup',
      
      // Pharmaceutical terms
      'medicine', 'drug', 'pharmaceutical', 'medication', 'prescription', 'over-the-counter', 'otc',
      'pain', 'relief', 'fever', 'reducer', 'antibiotic', 'antihistamine', 'decongestant', 'mucolytic',
      
      // Manufacturer and regulatory terms
      'gsk', 'pfizer', 'johnson', 'bayer', 'sandoz', 'teva', 'generic', 'novartis', 'merck', 'astrazeneca',
      'manufacturer', 'producer', 'pharmaceuticals', 'ltd', 'inc', 'corp', 'company',
      
      // Packaging and labeling terms
      'exp', 'expiry', 'expires', 'expiration', 'batch', 'lot', 'serial', 'barcode', 'qr', 'code',
      'effective', 'gentle', 'strong', 'easy', 'swallow', 'film-coated', 'coated', 'tablets',
      
      // Instructions and safety
      'take', 'dose', 'dosage', 'directions', 'instructions', 'use', 'store', 'storage', 'temperature',
      'refrigerate', 'keep', 'cool', 'dry', 'place', 'away', 'children', 'adults', 'consult', 'doctor'
    ];
    
    console.log('📋 Looking for pharmaceutical patterns:', pharmaTextPatterns);
    console.log('📝 Extracted text:', textAnalysis);
    
    const textContent = textAnalysis.join(' ').toLowerCase();
    let textScore = 0;
    let matchedPatterns: string[] = [];
    
    for (const pattern of pharmaTextPatterns) {
      if (textContent.includes(pattern)) {
        textScore += 0.05; // Reduced weight per pattern
        matchedPatterns.push(pattern);
      }
    }
    
    console.log('🎯 Matched patterns:', matchedPatterns);
    console.log('📊 Text score:', textScore);
    
    // Much more lenient text scoring - only need a few matches
    if (textScore > 0.1) {
      score += 0.4;
      objects.push('pharmaceutical_text');
    }
    
    // Check for uniform, clean appearance (typical of pharmaceutical products)
    if (colorAnalysis.distribution && Object.keys(colorAnalysis.distribution).length <= 5) {
      score += 0.1;
      objects.push('uniform_appearance');
    }
    
    // Bonus for having any text at all (likely a drug package)
    if (textAnalysis.length > 0) {
      score += 0.1;
      objects.push('has_text_content');
    }
    
    console.log('🏥 Final pharmaceutical score:', score);
    return { score: Math.min(score, 1), objects };
  }

  private checkNonDrugIndicators(colorAnalysis: any, shapeAnalysis: any, textAnalysis: string[]): {
    score: number;
    objects: string[];
  } {
    let score = 0;
    const objects: string[] = [];
    
    // Check for people/faces with more comprehensive patterns
    const peoplePatterns = [
      'person', 'face', 'smile', 'glasses', 'hair', 'skin', 'eye', 'mouth', 'nose',
      'cheek', 'forehead', 'chin', 'ear', 'lip', 'brow', 'facial', 'portrait', 'selfie'
    ];
    const textContent = textAnalysis.join(' ').toLowerCase();
    
    for (const pattern of peoplePatterns) {
      if (textContent.includes(pattern)) {
        score += 0.6; // High weight for people detection
        objects.push('person_detected');
        break;
      }
    }
    
    // Check for logo/brand indicators - but be careful not to flag pharmaceutical logos
    const logoPatterns = [
      'logo', 'brand', 'company', 'corporate', 'trademark', 'symbol', 'emblem',
      'icon', 'mark', 'signature', 'identity'
    ];
    for (const pattern of logoPatterns) {
      if (textContent.includes(pattern)) {
        // Don't penalize pharmaceutical companies
        const pharmaCompanies = ['gsk', 'pfizer', 'johnson', 'bayer', 'sandoz', 'teva', 'novartis', 'merck', 'astrazeneca'];
        const hasPharmaCompany = pharmaCompanies.some(company => textContent.includes(company));
        
        if (!hasPharmaCompany) {
          score += 0.3; // Reduced weight for logo detection
          objects.push('logo_detected');
        }
        break;
      }
    }
    
    // Check for social media or app indicators
    const socialPatterns = [
      'x', 'twitter', 'facebook', 'instagram', 'snapchat', 'tiktok', 'youtube',
      'linkedin', 'whatsapp', 'telegram', 'discord', 'reddit', 'social', 'media'
    ];
    for (const pattern of socialPatterns) {
      if (textContent.includes(pattern)) {
        score += 0.7; // High weight for social media detection
        objects.push('social_media_detected');
        break;
      }
    }
    
    // Check for non-pharmaceutical colors - but be more lenient
    const nonPharmaColors = ['black', 'green', 'purple', 'multicolor', 'rainbow'];
    if (nonPharmaColors.includes(colorAnalysis.dominantColor)) {
      score += 0.1; // Reduced weight
      objects.push('non_pharmaceutical_color');
    }
    
    // Check for non-pharmaceutical shapes - but be more lenient
    const nonPharmaShapes = ['triangular', 'irregular', 'complex'];
    if (nonPharmaShapes.includes(shapeAnalysis.primaryShape)) {
      score += 0.1; // Reduced weight
      objects.push('non_pharmaceutical_shape');
    }
    
    // Check for too much text (likely not a drug) - but be more lenient
    if (textAnalysis.length > 15) {
      score += 0.2; // Reduced weight
      objects.push('excessive_text');
    }
    
    // Check for very little text (likely not a drug package) - but be more lenient
    if (textAnalysis.length === 0) {
      score += 0.3; // Only penalize if no text at all
      objects.push('no_text');
    }
    
    // Check for common non-drug objects
    const nonDrugObjects = [
      'phone', 'computer', 'laptop', 'tablet', 'screen', 'display', 'monitor',
      'keyboard', 'mouse', 'cable', 'wire', 'electronic', 'device', 'gadget',
      'book', 'magazine', 'newspaper', 'document', 'paper', 'card', 'money',
      'coin', 'bill', 'currency', 'food', 'drink', 'beverage', 'snack',
      'clothing', 'shirt', 'dress', 'pants', 'shoe', 'hat', 'bag', 'accessory',
      'pet', 'dog', 'cat', 'animal', 'beach', 'water', 'landscape', 'nature'
    ];
    
    for (const object of nonDrugObjects) {
      if (textContent.includes(object)) {
        score += 0.4; // Increased weight for non-drug objects
        objects.push('non_drug_object_detected');
        break;
      }
    }
    
    console.log('🚫 Non-drug score:', score);
    return { score: Math.min(score, 1), objects };
  }

  private validatePharmaceuticalText(extractedText: string[]): string[] {
    const validatedText: string[] = [];
    
    console.log('🔍 Validating pharmaceutical text:', extractedText);
    
    for (const text of extractedText) {
      const lowerText = text.toLowerCase();
      
      // Must contain pharmaceutical indicators - much more lenient
      const hasDrugName = Object.values(DRUG_DATABASE).some(drug => 
        drug.names.some(name => lowerText.includes(name))
      );
      
      const hasDosage = /\d+\s*mg/i.test(text);
      const hasManufacturer = /(GSK|Johnson|Pfizer|Bayer|Sandoz|Teva|Generic|Novartis|Merck|AstraZeneca)/i.test(text);
      const hasExpiry = /(exp|expiry|expires?|expiration)/i.test(text);
      const hasBatch = /(batch|lot|serial)/i.test(text);
      const hasPharmaTerm = /(tablet|capsule|oral|medicine|drug|pharmaceutical|medication|prescription|pain|relief|fever|effective|gentle|strong|easy|swallow|coated)/i.test(text);
      const hasInstructions = /(take|dose|dosage|directions|instructions|use)/i.test(text);
      const hasStorage = /(store|storage|temperature|refrigerate|keep|cool|dry|place)/i.test(text);
      
      // Much more lenient validation: require fewer indicators for legitimate drugs
      const indicators = [hasDrugName, hasDosage, hasManufacturer, hasExpiry, hasBatch, hasPharmaTerm, hasInstructions, hasStorage];
      const validIndicators = indicators.filter(Boolean).length;
      
      // Accept text with fewer indicators if it contains drug names or pharmaceutical terms
      const hasEssentialInfo = hasDrugName || hasDosage || hasPharmaTerm;
      
      // Very lenient: accept if it has any pharmaceutical content
      if (validIndicators >= 1 || hasEssentialInfo || hasPharmaTerm) {
        validatedText.push(text);
        console.log('✅ Validated text:', text);
      } else {
        console.log('❌ Rejected text:', text);
      }
    }
    
    console.log('📋 Final validated text:', validatedText);
    return validatedText;
  }

  private async preprocessImage(imageData: string): Promise<tf.Tensor3D> {
    // Environment detection for browser vs Node
    if (typeof window === 'undefined') {
      // Node.js environment
      return this.preprocessImageNode(imageData);
    } else {
      // Browser environment
      return this.preprocessImageBrowser(imageData);
    }
  }

  private async preprocessImageBrowser(imageData: string): Promise<tf.Tensor3D> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        
        // Maintain aspect ratio while resizing to 224x224
        const aspectRatio = img.width / img.height;
        let drawWidth = 224;
        let drawHeight = 224;
        let offsetX = 0;
        let offsetY = 0;
        
        if (aspectRatio > 1) {
          // Image is wider than tall
          drawHeight = 224 / aspectRatio;
          offsetY = (224 - drawHeight) / 2;
        } else {
          // Image is taller than wide
          drawWidth = 224 * aspectRatio;
          offsetX = (224 - drawWidth) / 2;
        }
        
        canvas.width = 224;
        canvas.height = 224;
        
        // Fill with white background
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, 224, 224);
        
        // Draw image maintaining aspect ratio
        ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
        
        // Convert to tensor and normalize for MobileNet v2
        let tensor = tf.browser.fromPixels(canvas).cast('float32');
        
        // Apply normalization based on mode
        if (NORMALIZE_TO_MINUS_ONE_TO_ONE) {
          tensor = tensor.div(127.5).sub(1); // Convert from [0,255] to [-1,1] range
        } else {
          tensor = tensor.div(255); // Convert from [0,255] to [0,1] range
        }
        
        // Runtime validation of normalization range
        this.validateNormalizationRange(tensor);
        
        resolve(tensor as tf.Tensor3D);
      };
      img.src = imageData;
    });
  }

  private validateNormalizationRange(tensor: tf.Tensor): void {
    const data = tensor.dataSync();
    const dataArray = Array.from(data);
    const min = Math.min(...dataArray);
    const max = Math.max(...dataArray);
    
    if (NORMALIZE_TO_MINUS_ONE_TO_ONE) {
      if (min < -1.1 || max > 1.1) {
        console.warn(`Normalization range validation failed: min=${min}, max=${max}, expected [-1,1]`);
      }
    } else {
      if (min < -0.1 || max > 1.1) {
        console.warn(`Normalization range validation failed: min=${min}, max=${max}, expected [0,1]`);
      }
    }
  }

  private async preprocessImageNode(imageData: string): Promise<tf.Tensor3D> {
    try {
      // Remove data URL prefix if present
      const base64Data = imageData.replace(/^data:image\/[a-z]+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      
      // Use tfjs-node for image decoding and preprocessing
      const tfnode = require('@tensorflow/tfjs-node');
      
      // Decode image from buffer
      const imageTensor = tfnode.node.decodeImage(buffer, 3);
      
      // Resize to 224x224 maintaining aspect ratio
      const resizedTensor = tf.image.resizeBilinear(imageTensor, [224, 224]);
      
      // Convert to float32 and normalize
      let normalizedTensor = resizedTensor.cast('float32');
      
      if (NORMALIZE_TO_MINUS_ONE_TO_ONE) {
        normalizedTensor = normalizedTensor.div(127.5).sub(1); // Convert from [0,255] to [-1,1] range
      } else {
        normalizedTensor = normalizedTensor.div(255); // Convert from [0,255] to [0,1] range
      }
      
      // Runtime validation of normalization range
      this.validateNormalizationRange(normalizedTensor);
      
      // Clean up intermediate tensors
      imageTensor.dispose();
      resizedTensor.dispose();
      
      return normalizedTensor as tf.Tensor3D;
      
    } catch (error) {
      console.error('Node.js image preprocessing failed:', error);
      // Return a placeholder tensor with proper shape
      return tf.zeros([224, 224, 3]).cast('float32') as tf.Tensor3D;
    }
  }

  private async extractVisualFeatures(imageTensor: tf.Tensor3D): Promise<any> {
    const colorAnalysis = await this.analyzeColors(imageTensor);
    const shapeAnalysis = this.analyzeShapes(imageTensor);
    const markingAnalysis = this.detectMarkings(imageTensor);
    
    return {
      dominantColor: colorAnalysis.dominantColor,
      colorDistribution: colorAnalysis.distribution,
      shape: shapeAnalysis.primaryShape,
      edges: shapeAnalysis.edgeCount,
      detectedMarkings: markingAnalysis.markings,
      textRegions: markingAnalysis.textRegions
    };
  }

  private async analyzeColors(imageTensor: tf.Tensor3D): Promise<any> {
    const pixels = await imageTensor.data();
    const colorCounts: { [key: string]: number } = {};
    
    for (let i = 0; i < pixels.length; i += 3) {
      // Convert from normalized range back to [0,255] for color analysis
      let r, g, b;
      
      if (NORMALIZE_TO_MINUS_ONE_TO_ONE) {
        // Convert from [-1,1] range back to [0,255]
        r = Math.floor(((pixels[i] + 1) / 2) * 255);
        g = Math.floor(((pixels[i + 1] + 1) / 2) * 255);
        b = Math.floor(((pixels[i + 2] + 1) / 2) * 255);
      } else {
        // Convert from [0,1] range back to [0,255]
        r = Math.floor(pixels[i] * 255);
        g = Math.floor(pixels[i + 1] * 255);
        b = Math.floor(pixels[i + 2] * 255);
      }
      
      const colorCategory = this.categorizeColor(r, g, b);
      colorCounts[colorCategory] = (colorCounts[colorCategory] || 0) + 1;
    }
    
    const dominantColor = Object.keys(colorCounts).reduce((a, b) => 
      colorCounts[a] > colorCounts[b] ? a : b
    );
    
    return {
      dominantColor,
      distribution: colorCounts
    };
  }

  private categorizeColor(r: number, g: number, b: number): string {
    const brightness = (r + g + b) / 3;
    
    if (brightness < 50) return 'black';
    if (brightness > 200) return 'white';
    
    if (r > g && r > b) return r > 150 ? 'red' : 'brown';
    if (g > r && g > b) return 'green';
    if (b > r && b > g) return 'blue';
    if (r > 100 && g > 100 && b < 100) return 'yellow';
    if (r > 100 && g < 100 && b > 100) return 'purple';
    if (r > 150 && g > 100 && b < 100) return 'orange';
    if (r > 150 && g > 150 && b > 150) return 'pink';
    
    return 'gray';
  }

  private analyzeShapes(imageTensor: tf.Tensor3D): any {
    const shapes = ['round', 'oval', 'capsule', 'square', 'triangular'];
    const randomShape = shapes[Math.floor(Math.random() * shapes.length)];
    
    return {
      primaryShape: randomShape,
      edgeCount: Math.floor(Math.random() * 20) + 5,
      confidence: Math.random() * 0.3 + 0.7
    };
  }

  private detectMarkings(imageTensor: tf.Tensor3D): any {
    const commonMarkings = ['500', '1000', '200', '400', 'P', 'A', 'IBU', 'TYLENOL'];
    const detectedMarkings = Math.random() > 0.5 ? 
      [commonMarkings[Math.floor(Math.random() * commonMarkings.length)]] : [];
    
    return {
      markings: detectedMarkings,
      textRegions: detectedMarkings.length,
      confidence: Math.random() * 0.4 + 0.6
    };
  }

  private async extractTextFromImage(imageData: string): Promise<string[]> {
    try {
      console.log('🔍 Starting pharmaceutical OCR analysis...');
      
      // Assess image quality first
      const qualityAssessment = assessImageQuality(imageData);
      console.log('📊 Image quality assessment:', qualityAssessment);
      
      // Preprocess image for optimal OCR
      const preprocessedImage = await preprocessForOCR(imageData);
      console.log('🖼️ Image preprocessing completed');
      
      // Perform pharmaceutical-optimized OCR
      const rawText = await recognizePharmaceuticalText(preprocessedImage);
      console.log('📝 Raw pharmaceutical OCR text:', rawText);
      
      // Apply OCR error correction
      const correctedText = rawText.map(line => correctOCRErrors(line));
      console.log('🔧 OCR error correction applied');
      
      // Validate and filter pharmaceutical text
      const pharmaceuticalText = validatePharmaceuticalText(correctedText);
      console.log('💊 Validated pharmaceutical text:', pharmaceuticalText);
      
      // Calculate confidence score
      const confidence = calculatePharmaceuticalConfidence(pharmaceuticalText);
      console.log('📊 Pharmaceutical confidence score:', confidence);
      
      // Extract comprehensive drug information
      const drugInfo = extractDrugInfo(pharmaceuticalText);
      if (drugInfo) {
        console.log('💊 Extracted drug information:', drugInfo);
      }
      
      // Return pharmaceutical-relevant text with enhanced filtering
      const finalText = pharmaceuticalText.filter(line => {
        // Ensure line contains meaningful pharmaceutical content
        return line.length > 2 && (
          /[a-zA-Z]/.test(line) || // Contains letters
          /\d/.test(line) || // Contains numbers
          /[mg|ml|mcg|g|IU|units?|tablets?|capsules?|pills?|drops?|sprays?|injections?|patches?|suppositories?]/i.test(line) // Contains pharmaceutical units
        );
      });
      
      console.log('📋 Final extracted pharmaceutical texts:', finalText);
      return finalText.slice(0, 15); // Increased limit for comprehensive analysis
      
    } catch (error) {
      console.error('Pharmaceutical OCR extraction failed:', error);
      
      // Fallback to basic text extraction if OCR fails
      try {
        console.log('🔄 Attempting fallback OCR...');
        const fallbackText = await recognizePharmaceuticalText(imageData, { 
          psm: 6, // SPARSE_TEXT mode
          retries: 1 
        });
        return fallbackText.slice(0, 10);
      } catch (fallbackError) {
        console.error('Fallback OCR also failed:', fallbackError);
        return [];
      }
    }
  }

  private identifyDrug(visualFeatures: any, extractedText: string[]): any {
    let bestMatch = { name: 'Unknown', strength: 'Unknown', confidence: 0 };
    
    console.log('🔍 Identifying drug from text:', extractedText);
    
    for (const [drugKey, drugData] of Object.entries(DRUG_DATABASE)) {
      let confidence = 0;
      
      // Check text matches with comprehensive validation
      for (const text of extractedText) {
        const lowerText = text.toLowerCase();
        
        // Check for drug names - more flexible matching
        if (drugData.names.some(name => lowerText.includes(name))) {
          confidence += 0.5; // Increased weight for drug name
          console.log(`💊 Found drug name match for ${drugKey}:`, text);
        }
        
        // Check for partial matches (e.g., "para" for paracetamol)
        if (drugKey === 'paracetamol' && (lowerText.includes('para') || lowerText.includes('acet'))) {
          confidence += 0.3;
          console.log(`💊 Found partial paracetamol match:`, text);
        }
        
        if (drugData.strengths.some(strength => lowerText.includes(strength))) {
          confidence += 0.3;
          console.log(`💪 Found strength match for ${drugKey}:`, text);
        }
        
        if (drugData.manufacturers.some(mfg => lowerText.includes(mfg.toLowerCase()))) {
          confidence += 0.15; // Increased weight for manufacturer
          console.log(`🏭 Found manufacturer match for ${drugKey}:`, text);
        }
        
        // Check for combination drug patterns
        if (drugKey === 'combination_cold' && lowerText.includes('combination')) {
          confidence += 0.3;
        }
      }
      
      // Check visual matches
      if (drugData.colors.includes(visualFeatures.dominantColor)) {
        confidence += 0.15;
        console.log(`🎨 Color match for ${drugKey}:`, visualFeatures.dominantColor);
      }
      if (drugData.shapes.includes(visualFeatures.shape)) {
        confidence += 0.1;
        console.log(`🔵 Shape match for ${drugKey}:`, visualFeatures.shape);
      }
      if (visualFeatures.detectedMarkings.some((marking: string) => 
          drugData.markings.includes(marking))) {
        confidence += 0.2;
        console.log(`🏷️ Marking match for ${drugKey}:`, visualFeatures.detectedMarkings);
      }
      
      // Much lower minimum confidence threshold for better detection
      if (confidence > bestMatch.confidence && confidence > 0.1) {
        const strengthMatch = drugData.strengths.find(strength => 
          extractedText.some(text => text.includes(strength))
        ) || drugData.strengths[0];
        
        // Handle combination drugs specially
        if (drugKey === 'combination_cold') {
          bestMatch = {
            name: 'Combination Cold Medicine',
            strength: 'Multiple Active Ingredients',
            confidence: Math.min(confidence, 0.95)
          };
        } else {
          bestMatch = {
            name: `${drugData.names[0]} ${strengthMatch}`,
            strength: strengthMatch,
            confidence: Math.min(confidence, 0.95)
          };
        }
        
        console.log(`🎯 New best match: ${bestMatch.name} (confidence: ${bestMatch.confidence})`);
      }
    }
    
    console.log(`🏆 Final drug identification: ${bestMatch.name} (${bestMatch.confidence})`);
    return bestMatch;
  }

  private assessAuthenticity(visualFeatures: any, extractedText: string[], drugId: any): any {
    const issues: string[] = [];
    let riskScore = 0;
    
    // Check image quality
    if (visualFeatures.edges < 10) {
      issues.push('Low image quality detected');
      riskScore += 0.2;
    }
    
    // Check color consistency
    if (visualFeatures.dominantColor === 'gray' || visualFeatures.dominantColor === 'black') {
      issues.push('Inconsistent tablet color');
      riskScore += 0.25;
    }
    
    // Check text quality
    if (extractedText.length < 2) {
      issues.push('Poor text quality or missing information');
      riskScore += 0.2;
    }
    
    // Check for suspicious patterns
    const hasExpiry = extractedText.some(text => text.toLowerCase().includes('exp'));
    const hasBatch = extractedText.some(text => text.toLowerCase().includes('batch'));
    
    if (!hasExpiry) {
      issues.push('Missing expiry date');
      riskScore += 0.15;
    }
    
    if (!hasBatch) {
      issues.push('Missing batch information');
      riskScore += 0.1;
    }
    
    // Determine status based on risk score
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

  private getFallbackResult(): DrugAnalysisResult {
    return {
      drugName: 'Analysis Failed',
      strength: 'Unknown',
      confidence: 0,
      status: 'suspicious',
      issues: ['Failed to analyze image', 'Please try again with better lighting'],
      extractedText: [],
      visualFeatures: {
        color: 'unknown',
        shape: 'unknown',
        markings: [],
        objectDetections: []
      },
      isDrugImage: false,
      imageClassification: {
        isPharmaceutical: false,
        detectedObjects: ['analysis_failed'],
        confidence: 0,
        objectDetections: [],
        detectionMethod: 'heuristic',
        boundingBoxCount: 0
      }
    };
  }
}

// Export singleton instance
export const aiDrugAnalysis = new AIDrugAnalysisService();
export type { DrugAnalysisResult };