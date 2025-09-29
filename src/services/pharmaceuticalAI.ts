import { DrugAnalysisResult, ImageClassificationResult } from '@/lib/types';

// Google Cloud Vision API configuration
const GOOGLE_CLOUD_VISION_API_URL = 'https://vision.googleapis.com/v1/images:annotate';
const GOOGLE_CLOUD_API_KEY = process.env.GOOGLE_CLOUD_API_KEY;

// Medical image classification via Hugging Face API
const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY;
const MEDICAL_MODEL_URL = 'https://api-inference.huggingface.co/models/google/vit-base-patch16-224';

// Medical Pills Dataset API (Ultralytics) - Disabled for now
// const MEDICAL_PILLS_API_URL = process.env.MEDICAL_PILLS_API_URL || 'https://api.ultralytics.com/v1';
// const MEDICAL_PILLS_API_KEY = process.env.MEDICAL_PILLS_API_KEY;

export interface PharmaceuticalAnalysisResult {
  drugName: string;
  genericName: string;
  dosage: string;
  manufacturer: string;
  activeIngredients: string[];
  confidence: number;
  isAuthentic: boolean;
  counterfeitRisk: number;
  detectedFeatures: {
    packageType: string;
    pillShape: string;
    pillColor: string;
    markings: string[];
  };
  textExtraction: {
    extractedText: string[];
    confidence: number;
    method: string;
  };
  imageClassification: {
    isPharmaceutical: boolean;
    confidence: number;
    detectedObjects: string[];
  };
  blockchainVerification: {
    isVerified: boolean;
    batchId?: string;
    manufacturer?: string;
    expiryDate?: string;
  };
}

export class PharmaceuticalAIService {
  private isInitialized = false;
  private googleVisionAvailable = false;
  private medicalClassificationAvailable = false;
  private medicalPillsAvailable = false;

  async initialize(): Promise<void> {
    try {
      console.log('🔧 Initializing Pharmaceutical AI Service...');
      
      // Test Google Cloud Vision API
      await this.testGoogleVisionAPI();
      
      // Test BiomedCLIP API (if available)
      await this.testBiomedCLIPAPI();
      
      // Test Medical Pills API (if available)
      await this.testMedicalPillsAPI();
      
      this.isInitialized = true;
      
      console.log('✅ Pharmaceutical AI Service initialized:', {
        googleVision: this.googleVisionAvailable ? 'available' : 'failed',
        medicalClassification: this.medicalClassificationAvailable ? 'available' : 'failed',
        medicalPills: this.medicalPillsAvailable ? 'available' : 'failed'
      });
      
    } catch (error) {
      console.error('❌ Failed to initialize Pharmaceutical AI Service:', error);
      this.isInitialized = true; // Mark as initialized even if some services fail
    }
  }

  private async testGoogleVisionAPI(): Promise<void> {
    if (!GOOGLE_CLOUD_API_KEY) {
      console.warn('⚠️ Google Cloud API key not found');
      return;
    }

    try {
      // Test with a simple request
      const testResponse = await fetch(`${GOOGLE_CLOUD_VISION_API_URL}?key=${GOOGLE_CLOUD_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [{
            image: { content: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==' }, // 1x1 pixel test image
            features: [{ type: 'TEXT_DETECTION', maxResults: 1 }]
          }]
        })
      });

      if (testResponse.ok) {
        this.googleVisionAvailable = true;
        console.log('✅ Google Cloud Vision API is available');
      } else {
        console.warn('⚠️ Google Cloud Vision API test failed:', testResponse.status);
      }
    } catch (error) {
      console.warn('⚠️ Google Cloud Vision API test failed:', error);
    }
  }

  private async testBiomedCLIPAPI(): Promise<void> {
    if (!HUGGINGFACE_API_KEY) {
      console.warn('⚠️ Hugging Face API key not found for medical classification');
      return;
    }

    // Medical classification via Hugging Face is disabled for now
    console.log('ℹ️ Medical classification via Hugging Face is disabled');
    this.medicalClassificationAvailable = false;
    return;
    
    /* Disabled for now - causing issues
    try {
      // Test medical classification via Hugging Face API
      const testResponse = await fetch(MEDICAL_MODEL_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${HUGGINGFACE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k='
        })
      });

      if (testResponse.ok) {
        this.medicalClassificationAvailable = true;
        console.log('✅ Medical classification via Hugging Face is available');
      } else {
        const errorText = await testResponse.text();
        console.warn('⚠️ Medical classification test failed:', testResponse.status, errorText);
      }
    } catch (error) {
      console.warn('⚠️ Medical classification test failed:', error);
    }
    */
  }

  private async testMedicalPillsAPI(): Promise<void> {
    // Medical Pills API is disabled for now
    console.log('ℹ️ Medical Pills API is disabled');
    this.medicalPillsAvailable = false;
  }

  async analyzePharmaceuticalImage(imageBuffer: Buffer): Promise<PharmaceuticalAnalysisResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      console.log('🔍 Starting pharmaceutical image analysis...');

      // Convert buffer to base64
      const base64Image = imageBuffer.toString('base64');

      // Step 1: Extract text using Google Cloud Vision API
      const textExtraction = await this.extractTextWithGoogleVision(base64Image);

      // Step 2: Classify image using BiomedCLIP (if available)
      const imageClassification = await this.classifyImageWithBiomedCLIP(base64Image);

      // Step 3: Detect pills using Medical Pills API (if available)
      const pillDetection = await this.detectPillsWithMedicalAPI(base64Image);

      // Step 4: Identify drug based on extracted information
      const drugIdentification = await this.identifyDrug(textExtraction, imageClassification, pillDetection);

      // Step 5: Detect counterfeit
      const counterfeitDetection = await this.detectCounterfeit(drugIdentification, imageClassification);

      // Step 6: Verify against blockchain
      const blockchainVerification = await this.verifyOnBlockchain(drugIdentification);

      const result: PharmaceuticalAnalysisResult = {
        drugName: drugIdentification.drugName || 'Unknown',
        genericName: drugIdentification.genericName || 'Unknown',
        dosage: drugIdentification.dosage || 'Unknown',
        manufacturer: drugIdentification.manufacturer || 'Unknown',
        activeIngredients: drugIdentification.activeIngredients || [],
        confidence: drugIdentification.confidence || 0,
        isAuthentic: !counterfeitDetection.isCounterfeit,
        counterfeitRisk: counterfeitDetection.riskScore,
        detectedFeatures: drugIdentification.detectedFeatures || {
          packageType: 'unknown',
          pillShape: 'unknown',
          pillColor: 'unknown',
          markings: [],
        },
        textExtraction,
        imageClassification,
        blockchainVerification,
      };

      console.log('✅ Pharmaceutical analysis completed:', {
        drugName: result.drugName,
        confidence: result.confidence,
        isAuthentic: result.isAuthentic,
        counterfeitRisk: result.counterfeitRisk,
      });

      return result;

    } catch (error) {
      console.error('❌ Pharmaceutical analysis failed:', error);
      
      // Return fallback result
      return {
        drugName: 'Unknown',
        genericName: 'Unknown',
        dosage: 'Unknown',
        manufacturer: 'Unknown',
        activeIngredients: [],
        confidence: 0,
        isAuthentic: false,
        counterfeitRisk: 1.0,
        detectedFeatures: {
          packageType: 'unknown',
          pillShape: 'unknown',
          pillColor: 'unknown',
          markings: [],
        },
        textExtraction: {
          extractedText: [],
          confidence: 0,
          method: 'failed'
        },
        imageClassification: {
          isPharmaceutical: false,
          confidence: 0,
          detectedObjects: []
        },
        blockchainVerification: {
          isVerified: false
        }
      };
    }
  }

  private async extractTextWithGoogleVision(base64Image: string): Promise<{
    extractedText: string[];
    confidence: number;
    method: string;
  }> {
    if (!this.googleVisionAvailable || !GOOGLE_CLOUD_API_KEY) {
      console.warn('⚠️ Google Cloud Vision API not available, using fallback');
      return {
        extractedText: [],
        confidence: 0,
        method: 'fallback'
      };
    }

    try {
      const response = await fetch(`${GOOGLE_CLOUD_VISION_API_URL}?key=${GOOGLE_CLOUD_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [{
            image: { content: base64Image },
            features: [
              { type: 'TEXT_DETECTION', maxResults: 50 },
              { type: 'DOCUMENT_TEXT_DETECTION', maxResults: 50 }
            ]
          }]
        })
      });

      if (!response.ok) {
        throw new Error(`Google Vision API error: ${response.status}`);
      }

      const data = await response.json();
      const textAnnotations = data.responses[0]?.textAnnotations || [];
      
      const extractedText = textAnnotations
        .map((annotation: any) => annotation.description)
        .filter((text: string) => text && text.trim().length > 0);

      const confidence = textAnnotations.length > 0 ? 
        Math.min(0.95, textAnnotations.length * 0.1) : 0;

      console.log(`✅ Google Vision extracted ${extractedText.length} text items`);

      return {
        extractedText,
        confidence,
        method: 'google-vision'
      };

    } catch (error) {
      console.error('❌ Google Vision text extraction failed:', error);
      return {
        extractedText: [],
        confidence: 0,
        method: 'failed'
      };
    }
  }

  private async classifyImageWithBiomedCLIP(base64Image: string): Promise<{
    isPharmaceutical: boolean;
    confidence: number;
    detectedObjects: string[];
  }> {
    if (!this.medicalClassificationAvailable || !HUGGINGFACE_API_KEY) {
      console.warn('⚠️ Medical classification via Hugging Face not available, using fallback');
      return {
        isPharmaceutical: false,
        confidence: 0,
        detectedObjects: []
      };
    }

    try {
      const response = await fetch(MEDICAL_MODEL_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${HUGGINGFACE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: `data:image/jpeg;base64,${base64Image}`,
          parameters: {
            return_all_scores: true
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Medical classification API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Process medical classification results
      const isPharmaceutical = Array.isArray(data) && data.some((result: any) => 
        result.label && (
          result.label.toLowerCase().includes('medical') || 
          result.label.toLowerCase().includes('pill') ||
          result.label.toLowerCase().includes('tablet') ||
          result.label.toLowerCase().includes('medicine')
        ) && result.score > 0.3
      );
      
      const confidence = Array.isArray(data) && data.length > 0 ? 
        Math.max(...data.map((r: any) => r.score || 0)) : 0;
      
      const detectedObjects = Array.isArray(data) ? 
        data.filter((result: any) => result.score > 0.3)
            .map((result: any) => result.label) : [];

      return {
        isPharmaceutical,
        confidence,
        detectedObjects
      };

    } catch (error) {
      console.error('❌ Medical classification failed:', error);
      return {
        isPharmaceutical: false,
        confidence: 0,
        detectedObjects: []
      };
    }
  }

  private async detectPillsWithMedicalAPI(base64Image: string): Promise<{
    detectedPills: any[];
    confidence: number;
  }> {
    // Medical Pills API is disabled for now
    console.warn('⚠️ Medical Pills API not available, using fallback');
    return {
      detectedPills: [],
      confidence: 0
    };
  }

  private async identifyDrug(
    textExtraction: any,
    imageClassification: any,
    pillDetection: any
  ): Promise<{
    drugName: string;
    genericName: string;
    dosage: string;
    manufacturer: string;
    activeIngredients: string[];
    confidence: number;
    detectedFeatures: any;
  }> {
    // Enhanced drug identification logic
    const extractedText = textExtraction.extractedText || [];
    const detectedPills = pillDetection.detectedPills || [];
    
    console.log('🔍 Extracted text for drug identification:', extractedText);
    console.log('🔍 Text extraction confidence:', textExtraction.confidence);
    
    // Dynamic drug identification - use the first meaningful text as drug name
    let drugName = 'Unknown';
    let genericName = 'Unknown';
    let confidence = 0;

    // Look for the most likely drug name from extracted text
    const meaningfulTexts = extractedText.filter(text => 
      text && 
      text.length > 2 && 
      !/^\d+$/.test(text) && // Not just numbers
      !/^[()]+$/.test(text) && // Not just parentheses
      !/^[+-]+$/.test(text) && // Not just symbols
      text.trim().length > 0
    );

    console.log('🔍 Meaningful texts for drug identification:', meaningfulTexts);

    if (meaningfulTexts.length > 0) {
      // Use the first meaningful text as the drug name
      const primaryText = meaningfulTexts[0].trim();
      drugName = primaryText;
      genericName = primaryText;
      confidence = 0.8;
      
      console.log(`✅ Dynamic drug identification: "${drugName}" from extracted text`);
    }

    // Enhanced drug identification based on text patterns (for known drugs)
    const drugPatterns = [
      // Specific drug names (higher priority)
      { pattern: /lokmal/i, name: 'Lokmal', generic: 'Artemether + Lumefantrine' },
      { pattern: /artemether.*lumefantrine/i, name: 'Artemether + Lumefantrine', generic: 'Artemether + Lumefantrine' },
      { pattern: /artemether/i, name: 'Artemether', generic: 'Artemether' },
      { pattern: /lumefantrine/i, name: 'Lumefantrine', generic: 'Lumefantrine' },
      { pattern: /camosunate/i, name: 'Camosunate', generic: 'Camosunate' },
      { pattern: /loren/i, name: 'Loren', generic: 'Loren' },
      { pattern: /paracetamol|acetaminophen|tylenol/i, name: 'Paracetamol', generic: 'Acetaminophen' },
      { pattern: /ibuprofen|advil|motrin/i, name: 'Ibuprofen', generic: 'Ibuprofen' },
      { pattern: /amoxicillin|amox/i, name: 'Amoxicillin', generic: 'Amoxicillin' },
      { pattern: /aspirin/i, name: 'Aspirin', generic: 'Acetylsalicylic Acid' },
      { pattern: /vitamin|vit/i, name: 'Vitamin Supplement', generic: 'Vitamin' },
    ];

    // Check for known drug patterns
    for (const drug of drugPatterns) {
      for (const text of extractedText) {
        if (drug.pattern.test(text)) {
          drugName = drug.name;
          genericName = drug.generic;
          confidence = 0.9;
          console.log(`✅ Known drug pattern matched: ${drug.name} from text: "${text}"`);
          break;
        }
      }
      if (drugName !== 'Unknown') break;
    }

    // Return the identified drug information
    return {
      drugName: drugName,
      genericName: genericName,
      dosage: this.extractDosage(extractedText),
      manufacturer: this.extractManufacturer(extractedText),
      activeIngredients: [genericName],
      confidence: confidence,
      detectedFeatures: {
        packageType: 'tablet',
        pillShape: 'round',
        pillColor: 'white',
        markings: this.extractMarkings(extractedText)
      }
    };
  }

  private extractDosage(texts: string[]): string {
    const dosagePattern = /(\d+)\s*mg/i;
    for (const text of texts) {
      const match = text.match(dosagePattern);
      if (match) {
        return `${match[1]}mg`;
      }
    }
    return 'Unknown';
  }

  private extractManufacturer(texts: string[]): string {
    const manufacturerPatterns = [
      /(GSK|GlaxoSmithKline)/i,
      /(Pfizer)/i,
      /(Johnson\s*&\s*Johnson)/i,
      /(Bayer)/i,
      /(Novartis)/i
    ];

    for (const text of texts) {
      for (const pattern of manufacturerPatterns) {
        const match = text.match(pattern);
        if (match) {
          return match[1];
        }
      }
    }
    return 'Unknown';
  }

  private extractMarkings(texts: string[]): string[] {
    const markings: string[] = [];
    const markingPatterns = [
      /\b[A-Z]{2,}\b/g,  // Uppercase letters
      /\b\d{3,}\b/g,     // Numbers
      /\b[A-Z]\d+\b/g    // Letter + number combinations
    ];

    for (const text of texts) {
      for (const pattern of markingPatterns) {
        const matches = text.match(pattern);
        if (matches) {
          markings.push(...matches);
        }
      }
    }

    return [...new Set(markings)]; // Remove duplicates
  }

  private async detectCounterfeit(
    drugIdentification: any,
    imageClassification: any
  ): Promise<{
    isCounterfeit: boolean;
    riskScore: number;
  }> {
    let riskScore = 0;
    const riskFactors: string[] = [];

    // Check image quality
    if (imageClassification.confidence < 0.7) {
      riskScore += 0.3;
      riskFactors.push('Low image classification confidence');
    }

    // Check for pharmaceutical indicators
    if (!imageClassification.isPharmaceutical) {
      riskScore += 0.4;
      riskFactors.push('Image does not appear to be pharmaceutical');
    }

    // Check drug identification confidence
    if (drugIdentification.confidence < 0.5) {
      riskScore += 0.3;
      riskFactors.push('Low drug identification confidence');
    }

    // Check for missing manufacturer information
    if (drugIdentification.manufacturer === 'Unknown') {
      riskScore += 0.2;
      riskFactors.push('Unknown manufacturer');
    }

    const isCounterfeit = riskScore > 0.5;

    console.log('🔍 Counterfeit detection:', {
      riskScore,
      isCounterfeit,
      riskFactors
    });

    return {
      isCounterfeit,
      riskScore
    };
  }

  private async verifyOnBlockchain(drugIdentification: any): Promise<{
    isVerified: boolean;
    batchId?: string;
    manufacturer?: string;
    expiryDate?: string;
  }> {
    // Placeholder for blockchain verification
    // This would integrate with the existing blockchain system
    return {
      isVerified: false,
      batchId: undefined,
      manufacturer: drugIdentification.manufacturer,
      expiryDate: undefined
    };
  }
}

// Export singleton instance
export const pharmaceuticalAI = new PharmaceuticalAIService();
