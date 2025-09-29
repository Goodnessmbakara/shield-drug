import { DrugAnalysisResult, ImageClassificationResult } from '@/lib/types';

// Google Cloud Vision API configuration
const GOOGLE_CLOUD_VISION_API_URL = 'https://vision.googleapis.com/v1/images:annotate';
const GOOGLE_CLOUD_API_KEY = process.env.GOOGLE_CLOUD_API_KEY;

// BiomedCLIP API configuration (when available)
const BIOMEDCLIP_API_URL = process.env.BIOMEDCLIP_API_URL || 'https://api.biomedclip.com/v1';
const BIOMEDCLIP_API_KEY = process.env.BIOMEDCLIP_API_KEY;

// Medical Pills Dataset API (Ultralytics)
const MEDICAL_PILLS_API_URL = process.env.MEDICAL_PILLS_API_URL || 'https://api.ultralytics.com/v1';
const MEDICAL_PILLS_API_KEY = process.env.MEDICAL_PILLS_API_KEY;

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
  private biomedclipAvailable = false;
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
        biomedclip: this.biomedclipAvailable ? 'available' : 'failed',
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
    if (!BIOMEDCLIP_API_KEY) {
      console.warn('⚠️ BiomedCLIP API key not found');
      return;
    }

    try {
      // Test BiomedCLIP API availability
      const testResponse = await fetch(`${BIOMEDCLIP_API_URL}/health`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${BIOMEDCLIP_API_KEY}`,
          'Content-Type': 'application/json',
        }
      });

      if (testResponse.ok) {
        this.biomedclipAvailable = true;
        console.log('✅ BiomedCLIP API is available');
      } else {
        console.warn('⚠️ BiomedCLIP API test failed:', testResponse.status);
      }
    } catch (error) {
      console.warn('⚠️ BiomedCLIP API test failed:', error);
    }
  }

  private async testMedicalPillsAPI(): Promise<void> {
    if (!MEDICAL_PILLS_API_KEY) {
      console.warn('⚠️ Medical Pills API key not found');
      return;
    }

    try {
      // Test Medical Pills API availability
      const testResponse = await fetch(`${MEDICAL_PILLS_API_URL}/health`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${MEDICAL_PILLS_API_KEY}`,
          'Content-Type': 'application/json',
        }
      });

      if (testResponse.ok) {
        this.medicalPillsAvailable = true;
        console.log('✅ Medical Pills API is available');
      } else {
        console.warn('⚠️ Medical Pills API test failed:', testResponse.status);
      }
    } catch (error) {
      console.warn('⚠️ Medical Pills API test failed:', error);
    }
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
    if (!this.biomedclipAvailable || !BIOMEDCLIP_API_KEY) {
      console.warn('⚠️ BiomedCLIP API not available, using fallback');
      return {
        isPharmaceutical: false,
        confidence: 0,
        detectedObjects: []
      };
    }

    try {
      const response = await fetch(`${BIOMEDCLIP_API_URL}/classify`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${BIOMEDCLIP_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: base64Image,
          task: 'pharmaceutical_classification'
        })
      });

      if (!response.ok) {
        throw new Error(`BiomedCLIP API error: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        isPharmaceutical: data.isPharmaceutical || false,
        confidence: data.confidence || 0,
        detectedObjects: data.detectedObjects || []
      };

    } catch (error) {
      console.error('❌ BiomedCLIP classification failed:', error);
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
    if (!this.medicalPillsAvailable || !MEDICAL_PILLS_API_KEY) {
      console.warn('⚠️ Medical Pills API not available, using fallback');
      return {
        detectedPills: [],
        confidence: 0
      };
    }

    try {
      const response = await fetch(`${MEDICAL_PILLS_API_URL}/detect`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${MEDICAL_PILLS_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: base64Image,
          model: 'medical-pills'
        })
      });

      if (!response.ok) {
        throw new Error(`Medical Pills API error: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        detectedPills: data.detections || [],
        confidence: data.confidence || 0
      };

    } catch (error) {
      console.error('❌ Medical Pills detection failed:', error);
      return {
        detectedPills: [],
        confidence: 0
      };
    }
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
    
    // Simple drug identification based on text patterns
    const drugPatterns = [
      { pattern: /paracetamol|acetaminophen|tylenol/i, name: 'Paracetamol', generic: 'Acetaminophen' },
      { pattern: /ibuprofen|advil|motrin/i, name: 'Ibuprofen', generic: 'Ibuprofen' },
      { pattern: /amoxicillin|amox/i, name: 'Amoxicillin', generic: 'Amoxicillin' },
      { pattern: /aspirin/i, name: 'Aspirin', generic: 'Acetylsalicylic Acid' },
    ];

    let bestMatch = null;
    let confidence = 0;

    for (const drug of drugPatterns) {
      for (const text of extractedText) {
        if (drug.pattern.test(text)) {
          bestMatch = drug;
          confidence = 0.8;
          break;
        }
      }
      if (bestMatch) break;
    }

    if (bestMatch) {
      return {
        drugName: bestMatch.name,
        genericName: bestMatch.generic,
        dosage: this.extractDosage(extractedText),
        manufacturer: this.extractManufacturer(extractedText),
        activeIngredients: [bestMatch.generic],
        confidence,
        detectedFeatures: {
          packageType: 'tablet',
          pillShape: 'round',
          pillColor: 'white',
          markings: this.extractMarkings(extractedText)
        }
      };
    }

    return {
      drugName: 'Unknown',
      genericName: 'Unknown',
      dosage: 'Unknown',
      manufacturer: 'Unknown',
      activeIngredients: [],
      confidence: 0,
      detectedFeatures: {
        packageType: 'unknown',
        pillShape: 'unknown',
        pillColor: 'unknown',
        markings: []
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
