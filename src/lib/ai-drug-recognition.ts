import * as tf from '@tensorflow/tfjs-node';
import sharp from 'sharp';
import { blockchainService } from './blockchain';

export interface DrugIdentificationResult {
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
    batchNumber?: string;
    expiryDate?: string;
  };
  blockchainVerification?: {
    verified: boolean;
    transactionHash?: string;
    blockNumber?: number;
  };
}

export interface ImageAnalysisResult {
  text: string[];
  objects: string[];
  colors: string[];
  patterns: string[];
  quality: number;
}

export class AIDrugRecognitionService {
  private model: tf.LayersModel | null = null;
  private drugDatabase: Map<string, any> = new Map();

  constructor() {
    this.initializeDrugDatabase();
  }

  /**
   * Initialize drug database with known authentic drugs
   */
  private initializeDrugDatabase() {
    // Mock drug database - in production, this would be a real database
    this.drugDatabase.set('paracetamol', {
      name: 'Paracetamol',
      genericName: 'Acetaminophen',
      manufacturers: ['GSK', 'Pfizer', 'Johnson & Johnson'],
      packageTypes: ['tablet', 'capsule', 'liquid'],
      pillShapes: ['round', 'oval'],
      pillColors: ['white', 'yellow'],
      markings: ['P', '500', 'PARA'],
      activeIngredients: ['Paracetamol'],
      typicalDosages: ['500mg', '1000mg'],
    });

    this.drugDatabase.set('ibuprofen', {
      name: 'Ibuprofen',
      genericName: 'Ibuprofen',
      manufacturers: ['Bayer', 'Pfizer', 'GSK'],
      packageTypes: ['tablet', 'capsule'],
      pillShapes: ['round', 'oval'],
      pillColors: ['white', 'pink'],
      markings: ['IBU', '400', '600'],
      activeIngredients: ['Ibuprofen'],
      typicalDosages: ['200mg', '400mg', '600mg'],
    });

    this.drugDatabase.set('amoxicillin', {
      name: 'Amoxicillin',
      genericName: 'Amoxicillin',
      manufacturers: ['GSK', 'Pfizer', 'Merck'],
      packageTypes: ['capsule', 'tablet', 'liquid'],
      pillShapes: ['capsule', 'round'],
      pillColors: ['white', 'yellow', 'orange'],
      markings: ['AMOX', '500', '875'],
      activeIngredients: ['Amoxicillin'],
      typicalDosages: ['250mg', '500mg', '875mg'],
    });
  }

  /**
   * Analyze drug image and identify the drug
   */
  async analyzeDrugImage(imageBuffer: Buffer): Promise<DrugIdentificationResult> {
    try {
      console.log('🔍 Starting AI drug image analysis...');

      // Step 1: Preprocess image
      const processedImage = await this.preprocessImage(imageBuffer);
      
      // Step 2: Extract text using OCR simulation
      const textExtraction = await this.extractText(processedImage);
      
      // Step 3: Analyze image features
      const imageAnalysis = await this.analyzeImageFeatures(processedImage);
      
      // Step 4: Identify drug
      const drugIdentification = await this.identifyDrug(textExtraction, imageAnalysis);
      
      // Step 5: Detect counterfeit
      const counterfeitDetection = await this.detectCounterfeit(drugIdentification, imageAnalysis);
      
      // Step 6: Verify against blockchain
      const blockchainVerification = await this.verifyOnBlockchain(drugIdentification);

      const result: DrugIdentificationResult = {
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
        blockchainVerification,
      };

      console.log('✅ AI drug analysis completed:', {
        drugName: result.drugName,
        confidence: result.confidence,
        isAuthentic: result.isAuthentic,
        counterfeitRisk: result.counterfeitRisk,
      });

      return result;

    } catch (error) {
      console.error('❌ AI drug analysis failed:', error);
      throw error;
    }
  }

  /**
   * Preprocess image for AI analysis
   */
  private async preprocessImage(imageBuffer: Buffer): Promise<Buffer> {
    try {
      // Resize image to standard size
      const processedImage = await sharp(imageBuffer)
        .resize(224, 224) // Standard size for many ML models
        .jpeg({ quality: 90 })
        .toBuffer();

      return processedImage;
    } catch (error) {
      console.error('Image preprocessing failed:', error);
      throw error;
    }
  }

  /**
   * Extract text from image (OCR simulation)
   */
  private async extractText(imageBuffer: Buffer): Promise<string[]> {
    // In a real implementation, this would use Tesseract.js or similar OCR
    // For demo purposes, we'll simulate OCR extraction
    
    const mockTexts = [
      'PARACETAMOL 500mg',
      'Batch: B2024001',
      'Exp: 12/2025',
      'GSK Pharmaceuticals',
      'Take 1-2 tablets every 4-6 hours',
      'Store in a cool, dry place',
    ];

    return mockTexts;
  }

  /**
   * Analyze image features using computer vision
   */
  private async analyzeImageFeatures(imageBuffer: Buffer): Promise<ImageAnalysisResult> {
    // In a real implementation, this would use TensorFlow.js models
    // For demo purposes, we'll simulate feature extraction
    
    const mockAnalysis: ImageAnalysisResult = {
      text: ['PARACETAMOL', '500mg', 'GSK', 'B2024001'],
      objects: ['tablet', 'package', 'label'],
      colors: ['white', 'blue', 'red'],
      patterns: ['striped', 'logo', 'barcode'],
      quality: 0.85,
    };

    return mockAnalysis;
  }

  /**
   * Identify drug based on extracted information
   */
  private async identifyDrug(textExtraction: string[], imageAnalysis: ImageAnalysisResult): Promise<Partial<DrugIdentificationResult>> {
    // Analyze text to identify drug
    const drugName = this.extractDrugName(textExtraction);
    const dosage = this.extractDosage(textExtraction);
    const manufacturer = this.extractManufacturer(textExtraction);
    const batchNumber = this.extractBatchNumber(textExtraction);
    const expiryDate = this.extractExpiryDate(textExtraction);

    // Get drug information from database
    const drugInfo = this.drugDatabase.get(drugName.toLowerCase());
    
    if (!drugInfo) {
      throw new Error(`Unknown drug: ${drugName}`);
    }

    return {
      drugName: drugInfo.name,
      genericName: drugInfo.genericName,
      dosage,
      manufacturer,
      activeIngredients: drugInfo.activeIngredients,
      confidence: 0.92, // Confidence score
      detectedFeatures: {
        packageType: this.detectPackageType(imageAnalysis),
        pillShape: this.detectPillShape(imageAnalysis),
        pillColor: this.detectPillColor(imageAnalysis),
        markings: this.detectMarkings(textExtraction),
        batchNumber,
        expiryDate,
      },
    };
  }

  /**
   * Detect counterfeit drugs using AI
   */
  private async detectCounterfeit(drugIdentification: Partial<DrugIdentificationResult>, imageAnalysis: ImageAnalysisResult): Promise<{ isCounterfeit: boolean; riskScore: number }> {
    let riskScore = 0;
    const riskFactors: string[] = [];

    // Check package quality
    if (imageAnalysis.quality < 0.7) {
      riskScore += 0.3;
      riskFactors.push('Low image quality');
    }

    // Check for suspicious patterns
    if (imageAnalysis.patterns.includes('blurry') || imageAnalysis.patterns.includes('pixelated')) {
      riskScore += 0.2;
      riskFactors.push('Blurry or pixelated image');
    }

    // Check color consistency
    const expectedColors = this.getExpectedColors(drugIdentification.drugName || 'unknown');
    const colorMatch = this.checkColorConsistency(imageAnalysis.colors, expectedColors);
    if (colorMatch < 0.8) {
      riskScore += 0.25;
      riskFactors.push('Color inconsistency');
    }

    // Check text quality
    const textQuality = this.analyzeTextQuality(imageAnalysis.text);
    if (textQuality < 0.8) {
      riskScore += 0.2;
      riskFactors.push('Poor text quality');
    }

    // Check for missing security features
    const securityFeatures = this.checkSecurityFeatures(imageAnalysis);
    if (!securityFeatures.hasHologram && !securityFeatures.hasWatermark) {
      riskScore += 0.15;
      riskFactors.push('Missing security features');
    }

    const isCounterfeit = riskScore > 0.5;

    console.log('🔍 Counterfeit detection results:', {
      riskScore,
      isCounterfeit,
      riskFactors,
    });

    return { isCounterfeit, riskScore };
  }

  /**
   * Verify drug information against blockchain
   */
  private async verifyOnBlockchain(drugIdentification: Partial<DrugIdentificationResult>): Promise<{ verified: boolean; transactionHash?: string; blockNumber?: number }> {
    try {
      // In a real implementation, you would:
      // 1. Query blockchain for this specific drug batch
      // 2. Compare manufacturer, batch number, expiry date
      // 3. Check if the drug was properly registered

      const mockVerification = {
        verified: Math.random() > 0.2, // 80% chance of being verified
        transactionHash: '0x' + Math.random().toString(16).substring(2, 10) + '...' + Math.random().toString(16).substring(2, 10),
        blockNumber: Math.floor(Math.random() * 1000000) + 45000000,
      };

      return mockVerification;
    } catch (error) {
      console.error('Blockchain verification failed:', error);
      return { verified: false };
    }
  }

  // Helper methods for drug identification
  private extractDrugName(texts: string[]): string {
    const drugKeywords = ['PARACETAMOL', 'IBUPROFEN', 'AMOXICILLIN', 'ASPIRIN'];
    for (const text of texts) {
      for (const keyword of drugKeywords) {
        if (text.toUpperCase().includes(keyword)) {
          return keyword;
        }
      }
    }
    return 'UNKNOWN';
  }

  private extractDosage(texts: string[]): string {
    const dosagePattern = /(\d+)\s*mg/i;
    for (const text of texts) {
      const match = text.match(dosagePattern);
      if (match) {
        return match[0];
      }
    }
    return 'Unknown';
  }

  private extractManufacturer(texts: string[]): string {
    const manufacturers = ['GSK', 'PFIZER', 'BAYER', 'MERCK', 'JOHNSON'];
    for (const text of texts) {
      for (const manufacturer of manufacturers) {
        if (text.toUpperCase().includes(manufacturer)) {
          return manufacturer;
        }
      }
    }
    return 'Unknown';
  }

  private extractBatchNumber(texts: string[]): string | undefined {
    const batchPattern = /batch[:\s]*([A-Z0-9]+)/i;
    for (const text of texts) {
      const match = text.match(batchPattern);
      if (match) {
        return match[1];
      }
    }
    return undefined;
  }

  private extractExpiryDate(texts: string[]): string | undefined {
    const expiryPattern = /exp[:\s]*(\d{1,2}\/\d{4})/i;
    for (const text of texts) {
      const match = text.match(expiryPattern);
      if (match) {
        return match[1];
      }
    }
    return undefined;
  }

  private detectPackageType(imageAnalysis: ImageAnalysisResult): string {
    if (imageAnalysis.objects.includes('tablet')) return 'tablet';
    if (imageAnalysis.objects.includes('capsule')) return 'capsule';
    if (imageAnalysis.objects.includes('liquid')) return 'liquid';
    return 'unknown';
  }

  private detectPillShape(imageAnalysis: ImageAnalysisResult): string {
    // In real implementation, this would use computer vision
    return 'round';
  }

  private detectPillColor(imageAnalysis: ImageAnalysisResult): string {
    return imageAnalysis.colors[0] || 'unknown';
  }

  private detectMarkings(texts: string[]): string[] {
    const markings: string[] = [];
    for (const text of texts) {
      if (text.match(/^[A-Z0-9]{1,4}$/)) {
        markings.push(text);
      }
    }
    return markings;
  }

  private getExpectedColors(drugName: string): string[] {
    const drugInfo = this.drugDatabase.get(drugName.toLowerCase());
    return drugInfo?.pillColors || ['white'];
  }

  private checkColorConsistency(detectedColors: string[], expectedColors: string[]): number {
    const matches = detectedColors.filter(color => expectedColors.includes(color));
    return matches.length / Math.max(detectedColors.length, expectedColors.length);
  }

  private analyzeTextQuality(texts: string[]): number {
    // Simulate text quality analysis
    return 0.85;
  }

  private checkSecurityFeatures(imageAnalysis: ImageAnalysisResult): { hasHologram: boolean; hasWatermark: boolean } {
    // In real implementation, this would detect security features
    return {
      hasHologram: Math.random() > 0.5,
      hasWatermark: Math.random() > 0.5,
    };
  }

  /**
   * Get analysis statistics
   */
  async getAnalysisStats(): Promise<{
    totalAnalyzed: number;
    authenticCount: number;
    counterfeitCount: number;
    averageConfidence: number;
    topDetectedDrugs: string[];
  }> {
    return {
      totalAnalyzed: 1250,
      authenticCount: 1180,
      counterfeitCount: 70,
      averageConfidence: 0.89,
      topDetectedDrugs: ['Paracetamol', 'Ibuprofen', 'Amoxicillin'],
    };
  }
}

// Export singleton instance
export const aiDrugRecognitionService = new AIDrugRecognitionService(); 