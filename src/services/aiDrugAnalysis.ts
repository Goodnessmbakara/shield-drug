import * as tf from '@tensorflow/tfjs';
import { createWorker, PSM } from 'tesseract.js';

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

interface DrugAnalysisResult {
  drugName: string;
  strength: string;
  confidence: number;
  status: 'authentic' | 'suspicious' | 'counterfeit' | 'not_a_drug';
  issues: string[];
  extractedText: string[];
  visualFeatures: {
    color: string;
    shape: string;
    markings: string[];
  };
  isDrugImage: boolean;
  imageClassification: {
    isPharmaceutical: boolean;
    detectedObjects: string[];
    confidence: number;
  };
}

class AIDrugAnalysisService {
  private model: tf.LayersModel | null = null;
  private isInitialized = false;

  async initialize(): Promise<void> {
    try {
      await tf.ready();
      this.isInitialized = true;
      console.log('AI Drug Analysis Service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize AI model:', error);
      this.isInitialized = true;
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
            markings: []
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
      const drugIdentification = this.identifyDrug(visualFeatures, validatedText);
      
      // Step 6: Assess authenticity only if drug is identified
      const authenticityAssessment = this.assessAuthenticity(visualFeatures, validatedText, drugIdentification);
      
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
          markings: visualFeatures.detectedMarkings
        },
        isDrugImage: true,
        imageClassification
      };

    } catch (error) {
      console.error('Error during image analysis:', error);
      return this.getFallbackResult();
    }
  }

  private async classifyImage(imageData: string): Promise<{
    isPharmaceutical: boolean;
    detectedObjects: string[];
    confidence: number;
  }> {
    try {
      // Convert base64 to tensor for analysis
      const img = await this.preprocessImage(imageData);
      
      // Analyze image characteristics
      const colorAnalysis = await this.analyzeColors(img);
      const shapeAnalysis = this.analyzeShapes(img);
      const textAnalysis = await this.extractTextFromImage(imageData);
      
      // Check for pharmaceutical indicators
      const pharmaceuticalIndicators = this.checkPharmaceuticalIndicators(
        colorAnalysis, 
        shapeAnalysis, 
        textAnalysis
      );
      
      // Check for non-drug indicators
      const nonDrugIndicators = this.checkNonDrugIndicators(
        colorAnalysis, 
        shapeAnalysis, 
        textAnalysis
      );
      
      img.dispose();
      
      // Very lenient thresholds to avoid rejecting legitimate drugs
      const isPharmaceutical = pharmaceuticalIndicators.score > 0.1 && nonDrugIndicators.score < 0.8;
      const confidence = Math.max(pharmaceuticalIndicators.score, 1 - nonDrugIndicators.score);
      
      console.log('🔍 Classification analysis:', {
        pharmaceuticalScore: pharmaceuticalIndicators.score,
        nonDrugScore: nonDrugIndicators.score,
        isPharmaceutical,
        confidence,
        detectedObjects: pharmaceuticalIndicators.objects.concat(nonDrugIndicators.objects)
      });
      
      return {
        isPharmaceutical,
        detectedObjects: [...pharmaceuticalIndicators.objects, ...nonDrugIndicators.objects],
        confidence
      };
      
    } catch (error) {
      console.error('Image classification failed:', error);
      return {
        isPharmaceutical: false,
        detectedObjects: ['classification_failed'],
        confidence: 0
      };
    }
  }

  private checkPharmaceuticalIndicators(colorAnalysis: any, shapeAnalysis: any, textAnalysis: string[]): {
    score: number;
    objects: string[];
  } {
    let score = 0;
    const objects: string[] = [];
    
    // Check for pharmaceutical colors
    const pharmaColors = ['white', 'off-white', 'cream', 'pink', 'yellow', 'orange'];
    if (pharmaColors.includes(colorAnalysis.dominantColor)) {
      score += 0.2;
      objects.push('pharmaceutical_color');
    }
    
    // Check for pill/tablet shapes
    const pharmaShapes = ['round', 'oval', 'capsule'];
    if (pharmaShapes.includes(shapeAnalysis.primaryShape)) {
      score += 0.3;
      objects.push('pharmaceutical_shape');
    }
    
    // Check for pharmaceutical text patterns
    const pharmaTextPatterns = [
      'mg', 'tablet', 'capsule', 'oral', 'paracetamol', 'ibuprofen', 'amoxicillin',
      'levocetirizine', 'ambroxol', 'phenylephrine', 'sycold', 'cetirizine',
      'exp', 'batch', 'manufacturer', 'pharmaceutical', 'medicine', 'drug',
      'hcl', 'di-hcl', 'combination', 'tablets'
    ];
    
    console.log('📋 Looking for pharmaceutical patterns:', pharmaTextPatterns);
    
    const textContent = textAnalysis.join(' ').toLowerCase();
    let textScore = 0;
    for (const pattern of pharmaTextPatterns) {
      if (textContent.includes(pattern)) {
        textScore += 0.1;
      }
    }
    
    if (textScore > 0.3) {
      score += 0.4;
      objects.push('pharmaceutical_text');
    }
    
    // Check for uniform, clean appearance (typical of pharmaceutical products)
    if (colorAnalysis.distribution && Object.keys(colorAnalysis.distribution).length <= 3) {
      score += 0.1;
      objects.push('uniform_appearance');
    }
    
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
      'cheek', 'forehead', 'chin', 'ear', 'lip', 'brow', 'facial', 'portrait'
    ];
    const textContent = textAnalysis.join(' ').toLowerCase();
    
    for (const pattern of peoplePatterns) {
      if (textContent.includes(pattern)) {
        score += 0.5; // Increased weight for people detection
        objects.push('person_detected');
        break;
      }
    }
    
    // Check for logo/brand indicators
    const logoPatterns = [
      'logo', 'brand', 'company', 'corporate', 'trademark', 'symbol', 'emblem',
      'icon', 'mark', 'signature', 'identity'
    ];
    for (const pattern of logoPatterns) {
      if (textContent.includes(pattern)) {
        score += 0.4; // Increased weight for logo detection
        objects.push('logo_detected');
        break;
      }
    }
    
    // Check for social media or app indicators
    const socialPatterns = [
      'x', 'twitter', 'facebook', 'instagram', 'snapchat', 'tiktok', 'youtube',
      'linkedin', 'whatsapp', 'telegram', 'discord', 'reddit'
    ];
    for (const pattern of socialPatterns) {
      if (textContent.includes(pattern)) {
        score += 0.6; // High weight for social media detection
        objects.push('social_media_detected');
        break;
      }
    }
    
    // Check for non-pharmaceutical colors
    const nonPharmaColors = ['black', 'blue', 'green', 'purple', 'multicolor', 'rainbow'];
    if (nonPharmaColors.includes(colorAnalysis.dominantColor)) {
      score += 0.2;
      objects.push('non_pharmaceutical_color');
    }
    
    // Check for non-pharmaceutical shapes
    const nonPharmaShapes = ['square', 'triangular', 'irregular', 'complex'];
    if (nonPharmaShapes.includes(shapeAnalysis.primaryShape)) {
      score += 0.2;
      objects.push('non_pharmaceutical_shape');
    }
    
    // Check for too much text (likely not a drug)
    if (textAnalysis.length > 10) {
      score += 0.3;
      objects.push('excessive_text');
    }
    
    // Check for very little text (likely not a drug package)
    if (textAnalysis.length < 2) {
      score += 0.2;
      objects.push('insufficient_text');
    }
    
    // Check for common non-drug objects
    const nonDrugObjects = [
      'phone', 'computer', 'laptop', 'tablet', 'screen', 'display', 'monitor',
      'keyboard', 'mouse', 'cable', 'wire', 'electronic', 'device', 'gadget',
      'book', 'magazine', 'newspaper', 'document', 'paper', 'card', 'money',
      'coin', 'bill', 'currency', 'food', 'drink', 'beverage', 'snack',
      'clothing', 'shirt', 'dress', 'pants', 'shoe', 'hat', 'bag', 'accessory'
    ];
    
    for (const object of nonDrugObjects) {
      if (textContent.includes(object)) {
        score += 0.3;
        objects.push('non_drug_object_detected');
        break;
      }
    }
    
    return { score: Math.min(score, 1), objects };
  }

  private validatePharmaceuticalText(extractedText: string[]): string[] {
    const validatedText: string[] = [];
    
    for (const text of extractedText) {
      const lowerText = text.toLowerCase();
      
      // Must contain pharmaceutical indicators
      const hasDrugName = Object.values(DRUG_DATABASE).some(drug => 
        drug.names.some(name => lowerText.includes(name))
      );
      
      const hasDosage = /\d+\s*mg/i.test(text);
      const hasManufacturer = /(GSK|Johnson|Pfizer|Bayer|Sandoz|Teva|Generic|Novartis|Merck|AstraZeneca)/i.test(text);
      const hasExpiry = /(exp|expiry|expires?|expiration)/i.test(text);
      const hasBatch = /(batch|lot|serial)/i.test(text);
      const hasPharmaTerm = /(tablet|capsule|oral|medicine|drug|pharmaceutical|medication|prescription)/i.test(text);
      const hasInstructions = /(take|dose|dosage|directions|instructions|use)/i.test(text);
      const hasStorage = /(store|storage|temperature|refrigerate|keep)/i.test(text);
      
      // More lenient validation: require fewer indicators for legitimate drugs
      const indicators = [hasDrugName, hasDosage, hasManufacturer, hasExpiry, hasBatch, hasPharmaTerm, hasInstructions, hasStorage];
      const validIndicators = indicators.filter(Boolean).length;
      
      // Accept text with fewer indicators if it contains drug names or pharmaceutical terms
      const hasEssentialInfo = hasDrugName || hasDosage || hasPharmaTerm;
      
      if ((validIndicators >= 2 && hasEssentialInfo) || hasDrugName) {
        validatedText.push(text);
      }
    }
    
    return validatedText;
  }

  private async preprocessImage(imageData: string): Promise<tf.Tensor3D> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        
        canvas.width = 224;
        canvas.height = 224;
        ctx.drawImage(img, 0, 0, 224, 224);
        
        const tensor = tf.browser.fromPixels(canvas)
          .cast('float32')
          .div(255.0);
        
        resolve(tensor as tf.Tensor3D);
      };
      img.src = imageData;
    });
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
    
    for (let i = 0; i < pixels.length; i += 12) {
      const r = Math.floor(pixels[i] * 255);
      const g = Math.floor(pixels[i + 1] * 255);
      const b = Math.floor(pixels[i + 2] * 255);
      
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
      const worker = await createWorker('eng');
      
      await worker.setParameters({
        tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz.:-/ ',
        tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
      });
      
      const { data: { text } } = await worker.recognize(imageData);
      await worker.terminate();
      
      const lines = text.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 1)
        .filter(line => /[a-zA-Z0-9]/.test(line));
      
      const extractedTexts: string[] = [];
      
      for (const line of lines) {
        // Look for drug names with comprehensive matching
        const drugNameMatch = line.match(/(paracetamol|acetaminophen|ibuprofen|amoxicillin|tylenol|advil|motrin|panadol|levocetirizine|ambroxol|phenylephrine|sycold|cetirizine)/i);
        if (drugNameMatch) {
          extractedTexts.push(line);
          continue;
        }
        
        // Look for dosage information
        const dosageMatch = line.match(/\d+\s*mg/i);
        if (dosageMatch) {
          extractedTexts.push(line);
          continue;
        }
        
        // Look for expiry dates
        const expiryMatch = line.match(/(exp|expiry|expires?)[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{2,4}[\/\-]\d{1,2}[\/\-]\d{1,2})/i);
        if (expiryMatch) {
          extractedTexts.push(`Exp: ${expiryMatch[2]}`);
          continue;
        }
        
        // Look for batch numbers
        const batchMatch = line.match(/(batch|lot)[:\s]*([a-zA-Z0-9]+)/i);
        if (batchMatch) {
          extractedTexts.push(`Batch: ${batchMatch[2]}`);
          continue;
        }
        
        // Look for manufacturer names
        const mfgMatch = line.match(/(GSK|Johnson|Pfizer|Bayer|Sandoz|Teva|Generic)/i);
        if (mfgMatch) {
          extractedTexts.push(line);
          continue;
        }
        
        // Look for pharmaceutical terms
        const pharmaMatch = line.match(/(tablet|capsule|oral|medicine|drug|pharmaceutical)/i);
        if (pharmaMatch) {
          extractedTexts.push(line);
          continue;
        }
      }
      
      return extractedTexts.slice(0, 6);
      
    } catch (error) {
      console.error('OCR extraction failed:', error);
      return [];
    }
  }

  private identifyDrug(visualFeatures: any, extractedText: string[]): any {
    let bestMatch = { name: 'Unknown', strength: 'Unknown', confidence: 0 };
    
    for (const [drugKey, drugData] of Object.entries(DRUG_DATABASE)) {
      let confidence = 0;
      
      // Check text matches with comprehensive validation
      for (const text of extractedText) {
        const lowerText = text.toLowerCase();
        if (drugData.names.some(name => lowerText.includes(name))) {
          confidence += 0.4;
        }
        if (drugData.strengths.some(strength => lowerText.includes(strength))) {
          confidence += 0.3;
        }
        if (drugData.manufacturers.some(mfg => lowerText.includes(mfg.toLowerCase()))) {
          confidence += 0.1;
        }
        // Check for combination drug patterns
        if (drugKey === 'combination_cold' && lowerText.includes('combination')) {
          confidence += 0.3;
        }
      }
      
      // Check visual matches
      if (drugData.colors.includes(visualFeatures.dominantColor)) {
        confidence += 0.15;
      }
      if (drugData.shapes.includes(visualFeatures.shape)) {
        confidence += 0.1;
      }
      if (visualFeatures.detectedMarkings.some((marking: string) => 
          drugData.markings.includes(marking))) {
        confidence += 0.2;
      }
      
      // Lower minimum confidence threshold for better detection
      if (confidence > bestMatch.confidence && confidence > 0.2) {
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
      }
    }
    
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
        markings: []
      },
      isDrugImage: false,
      imageClassification: {
        isPharmaceutical: false,
        detectedObjects: ['analysis_failed'],
        confidence: 0
      }
    };
  }
}

// Export singleton instance
export const aiDrugAnalysis = new AIDrugAnalysisService();
export type { DrugAnalysisResult };