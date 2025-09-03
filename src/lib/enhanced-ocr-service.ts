/**
 * Enhanced OCR Service with Advanced Preprocessing
 * Provides superior text extraction specifically optimized for pharmaceutical images
 */

import sharp from 'sharp';
import { recognizePharmaceuticalText } from './ocr-service';
import { preprocessForOCR, assessImageQuality } from './image-preprocessing';

export interface EnhancedOCRResult {
  extractedText: string[];
  confidence: number;
  quality: {
    sharpness: number;
    contrast: number;
    lighting: number;
    noise: number;
    overall: number;
  };
  preprocessing: {
    method: string;
    parameters: any;
    success: boolean;
  };
  language: {
    detected: string;
    confidence: number;
  };
  pharmaceuticalRelevance: {
    score: number;
    drugNames: string[];
    dosages: string[];
    manufacturers: string[];
    batchNumbers: string[];
    expiryDates: string[];
  };
}

export interface OCRPreprocessingOptions {
  // Basic adjustments
  contrast?: number;
  brightness?: number;
  gamma?: number;
  
  // Noise reduction
  denoise?: boolean;
  gaussianBlur?: number;
  medianFilter?: number;
  
  // Sharpening
  sharpen?: boolean;
  unsharpMask?: {
    radius: number;
    amount: number;
    threshold: number;
  };
  
  // Geometric corrections
  deskew?: boolean;
  rotationCorrection?: boolean;
  perspectiveCorrection?: boolean;
  
  // Size and resolution
  upscale?: number;
  targetDPI?: number;
  minSize?: { width: number; height: number };
  
  // Advanced filters
  morphology?: {
    operation: 'open' | 'close' | 'erode' | 'dilate';
    kernel: number;
  };
  edgeEnhancement?: boolean;
  binarization?: 'otsu' | 'adaptive' | 'custom';
  
  // Multi-language support
  languages?: string[];
  
  // Pharmaceutical-specific
  pillModeOptimization?: boolean;
  packageModeOptimization?: boolean;
  labelModeOptimization?: boolean;
}

export class EnhancedOCRService {
  private static instance: EnhancedOCRService;

  public static getInstance(): EnhancedOCRService {
    if (!EnhancedOCRService.instance) {
      EnhancedOCRService.instance = new EnhancedOCRService();
    }
    return EnhancedOCRService.instance;
  }

  /**
   * Perform enhanced OCR with multiple preprocessing strategies
   */
  async extractText(
    imageData: Buffer | string, 
    options: OCRPreprocessingOptions = {}
  ): Promise<EnhancedOCRResult> {
    console.log('🔍 Starting enhanced OCR analysis...');

    try {
      // Convert input to buffer
      const buffer = await this.prepareImageBuffer(imageData);
      
      // Step 1: Assess image quality
      const qualityAssessment = await this.assessImageQuality(buffer);
      console.log('📊 Image quality assessment:', qualityAssessment);
      
      // Step 2: Determine optimal preprocessing strategy
      const strategy = this.determinePreprocessingStrategy(qualityAssessment, options);
      console.log('🎯 Selected preprocessing strategy:', strategy.method);
      
      // Step 3: Apply preprocessing
      const preprocessedImages = await this.applyPreprocessing(buffer, strategy);
      console.log(`🖼️ Generated ${preprocessedImages.length} preprocessed versions`);
      
      // Step 4: Perform OCR on all preprocessed versions
      const ocrResults = await this.performMultiVersionOCR(preprocessedImages, options);
      console.log(`📝 OCR completed on ${ocrResults.length} versions`);
      
      // Step 5: Combine and validate results
      const combinedResult = this.combineOCRResults(ocrResults);
      console.log('🔗 OCR results combined');
      
      // Step 6: Extract pharmaceutical information
      const pharmaceuticalData = this.extractPharmaceuticalInfo(combinedResult.text);
      console.log('💊 Pharmaceutical information extracted');
      
      // Step 7: Detect language
      const languageInfo = this.detectLanguage(combinedResult.text);
      console.log('🌍 Language detected:', languageInfo);

      const result: EnhancedOCRResult = {
        extractedText: combinedResult.text,
        confidence: combinedResult.confidence,
        quality: qualityAssessment,
        preprocessing: {
          method: strategy.method,
          parameters: strategy.parameters,
          success: true
        },
        language: languageInfo,
        pharmaceuticalRelevance: pharmaceuticalData
      };

      console.log('✅ Enhanced OCR analysis completed:', {
        textCount: result.extractedText.length,
        confidence: result.confidence,
        pharmaceuticalScore: result.pharmaceuticalRelevance.score
      });

      return result;

    } catch (error) {
      console.error('❌ Enhanced OCR analysis failed:', error);
      return this.getFallbackOCRResult();
    }
  }

  /**
   * Assess image quality for OCR
   */
  private async assessImageQuality(buffer: Buffer): Promise<EnhancedOCRResult['quality']> {
    try {
      const { data, info } = await sharp(buffer)
        .grayscale()
        .raw()
        .toBuffer({ resolveWithObject: true });

      // Calculate sharpness using Laplacian variance
      const sharpness = this.calculateSharpness(data, info.width, info.height);
      
      // Calculate contrast using standard deviation
      const contrast = this.calculateContrast(data);
      
      // Calculate lighting quality
      const lighting = this.calculateLightingQuality(data);
      
      // Estimate noise level
      const noise = this.estimateNoise(data, info.width, info.height);
      
      // Overall quality score
      const overall = (sharpness * 0.3 + contrast * 0.3 + lighting * 0.2 + (1 - noise) * 0.2);

      return {
        sharpness,
        contrast,
        lighting,
        noise,
        overall
      };

    } catch (error) {
      console.error('Quality assessment failed:', error);
      return {
        sharpness: 0.5,
        contrast: 0.5,
        lighting: 0.5,
        noise: 0.3,
        overall: 0.5
      };
    }
  }

  /**
   * Determine optimal preprocessing strategy based on image quality
   */
  private determinePreprocessingStrategy(
    quality: EnhancedOCRResult['quality'], 
    userOptions: OCRPreprocessingOptions
  ): { method: string; parameters: OCRPreprocessingOptions } {
    
    let strategy: OCRPreprocessingOptions = { ...userOptions };
    let method = 'adaptive';

    // Low sharpness - apply sharpening
    if (quality.sharpness < 0.5) {
      method = 'sharpening-focused';
      strategy.sharpen = true;
      strategy.unsharpMask = {
        radius: 1.5,
        amount: 1.2,
        threshold: 0.05
      };
    }

    // Low contrast - enhance contrast
    if (quality.contrast < 0.4) {
      method = 'contrast-enhancement';
      strategy.contrast = 1.5;
      strategy.binarization = 'adaptive';
    }

    // Poor lighting - adjust brightness and gamma
    if (quality.lighting < 0.4) {
      method = 'lighting-correction';
      strategy.brightness = 1.2;
      strategy.gamma = 0.8;
    }

    // High noise - apply denoising
    if (quality.noise > 0.6) {
      method = 'noise-reduction';
      strategy.denoise = true;
      strategy.medianFilter = 3;
      strategy.gaussianBlur = 0.8;
    }

    // Low overall quality - apply comprehensive preprocessing
    if (quality.overall < 0.4) {
      method = 'comprehensive';
      strategy = {
        ...strategy,
        contrast: 1.3,
        brightness: 1.1,
        gamma: 0.9,
        denoise: true,
        sharpen: true,
        deskew: true,
        upscale: 2,
        binarization: 'adaptive'
      };
    }

    // Pharmaceutical-specific optimizations
    if (userOptions.pillModeOptimization) {
      method = 'pill-optimized';
      strategy.edgeEnhancement = true;
      strategy.morphology = {
        operation: 'close',
        kernel: 2
      };
    }

    if (userOptions.packageModeOptimization) {
      method = 'package-optimized';
      strategy.perspectiveCorrection = true;
      strategy.deskew = true;
    }

    return { method, parameters: strategy };
  }

  /**
   * Apply preprocessing with multiple strategies
   */
  private async applyPreprocessing(
    buffer: Buffer, 
    strategy: { method: string; parameters: OCRPreprocessingOptions }
  ): Promise<Buffer[]> {
    const preprocessedImages: Buffer[] = [];
    const params = strategy.parameters;

    try {
      // Original image as baseline
      preprocessedImages.push(buffer);

      // Apply main preprocessing strategy
      let processed = sharp(buffer);

      // Resize if needed
      if (params.upscale) {
        const metadata = await sharp(buffer).metadata();
        const newWidth = Math.floor((metadata.width || 300) * params.upscale);
        const newHeight = Math.floor((metadata.height || 300) * params.upscale);
        processed = processed.resize(newWidth, newHeight, {
          kernel: sharp.kernel.lanczos3,
          fit: 'fill'
        });
      }

      // Brightness and contrast
      if (params.brightness !== undefined || params.contrast !== undefined) {
        processed = processed.modulate({
          brightness: params.brightness || 1.0,
          saturation: 1.0,
          hue: 0
        });
      }

      if (params.contrast !== undefined) {
        processed = processed.linear(params.contrast, -(128 * params.contrast) + 128);
      }

      // Gamma correction
      if (params.gamma !== undefined) {
        processed = processed.gamma(params.gamma);
      }

      // Noise reduction
      if (params.denoise) {
        processed = processed.blur(params.gaussianBlur || 0.3);
      }

      if (params.medianFilter) {
        processed = processed.median(params.medianFilter);
      }

      // Sharpening
      if (params.sharpen) {
        if (params.unsharpMask) {
          const { radius, amount, threshold } = params.unsharpMask;
          processed = processed.sharpen({
            sigma: radius,
            m1: amount,
            m2: amount,
            x1: threshold,
            y2: threshold
          });
        } else {
          processed = processed.sharpen();
        }
      }

      // Edge enhancement
      if (params.edgeEnhancement) {
        processed = processed.convolve({
          width: 3,
          height: 3,
          kernel: [-1, -1, -1, -1, 8, -1, -1, -1, -1]
        });
      }

      // Convert to grayscale for OCR
      processed = processed.grayscale();

      const mainProcessed = await processed.toBuffer();
      preprocessedImages.push(mainProcessed);

      // Generate additional variations for better OCR results
      if (strategy.method === 'comprehensive') {
        // High contrast version
        const highContrast = await sharp(buffer)
          .modulate({ brightness: 1.1 })
          .linear(2.0, -128)
          .grayscale()
          .toBuffer();
        preprocessedImages.push(highContrast);

        // Binarized version
        const binarized = await sharp(buffer)
          .grayscale()
          .threshold(128)
          .toBuffer();
        preprocessedImages.push(binarized);
      }

      return preprocessedImages;

    } catch (error) {
      console.error('Preprocessing failed:', error);
      return [buffer]; // Return original if preprocessing fails
    }
  }

  /**
   * Perform OCR on multiple preprocessed versions
   */
  private async performMultiVersionOCR(
    images: Buffer[], 
    options: OCRPreprocessingOptions
  ): Promise<Array<{ text: string[]; confidence: number }>> {
    const results = await Promise.all(
      images.map(async (image, index) => {
        try {
          console.log(`📝 Running OCR on version ${index + 1}/${images.length}...`);
          
          // Convert buffer to base64 for existing OCR service
          const base64 = `data:image/png;base64,${image.toString('base64')}`;
          
          // Use existing pharmaceutical OCR service
          const text = await recognizePharmaceuticalText(base64, {
            psm: 6, // Uniform block of text
            language: (options.languages && options.languages[0]) || 'eng',
            retries: 1
          });

          // Calculate confidence based on text quality
          const confidence = this.calculateOCRConfidence(text);

          return { text, confidence };

        } catch (error) {
          console.warn(`OCR failed for version ${index + 1}:`, error);
          return { text: [], confidence: 0 };
        }
      })
    );

    return results.filter(result => result.confidence > 0);
  }

  /**
   * Combine OCR results from multiple versions
   */
  private combineOCRResults(
    results: Array<{ text: string[]; confidence: number }>
  ): { text: string[]; confidence: number } {
    if (results.length === 0) {
      return { text: [], confidence: 0 };
    }

    // Weight results by confidence
    const weightedTexts = new Map<string, number>();
    let totalWeight = 0;

    results.forEach(result => {
      const weight = result.confidence;
      totalWeight += weight;

      result.text.forEach(text => {
        const normalizedText = this.normalizeText(text);
        const currentWeight = weightedTexts.get(normalizedText) || 0;
        weightedTexts.set(normalizedText, currentWeight + weight);
      });
    });

    // Select texts that appear with sufficient weight
    const threshold = totalWeight * 0.3; // At least 30% of total weight
    const combinedText: string[] = [];

    weightedTexts.forEach((weight, text) => {
      if (weight >= threshold && text.length > 1) {
        combinedText.push(text);
      }
    });

    // Calculate combined confidence
    const maxConfidence = Math.max(...results.map(r => r.confidence));
    const avgConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;
    const combinedConfidence = (maxConfidence + avgConfidence) / 2;

    return {
      text: combinedText,
      confidence: combinedConfidence
    };
  }

  /**
   * Extract pharmaceutical-specific information
   */
  private extractPharmaceuticalInfo(texts: string[]): EnhancedOCRResult['pharmaceuticalRelevance'] {
    const drugNames: string[] = [];
    const dosages: string[] = [];
    const manufacturers: string[] = [];
    const batchNumbers: string[] = [];
    const expiryDates: string[] = [];

    const drugNamePatterns = [
      /\b(paracetamol|acetaminophen|tylenol|panadol)\b/gi,
      /\b(ibuprofen|advil|motrin|nurofen)\b/gi,
      /\b(aspirin|bayer)\b/gi,
      /\b(amoxicillin|amoxil|trimox)\b/gi,
      /\b(cetirizine|zyrtec|reactine)\b/gi,
      /\b(loratadine|claritin|clarityne)\b/gi,
      /\b(omeprazole|prilosec|losec)\b/gi
    ];

    const dosagePattern = /\b(\d+)\s*(mg|mcg|g|ml|units?)\b/gi;
    const manufacturerPattern = /\b(GSK|Pfizer|Bayer|Johnson|Merck|Novartis|Teva|Sandoz|Abbott)\b/gi;
    const batchPattern = /\b(batch|lot|serial)[\s:]*([A-Z0-9]+)\b/gi;
    const expiryPattern = /\b(exp|expiry|expires?)[\s:]*(\d{1,2}[\/\-]\d{2,4}|\d{2,4}[\/\-]\d{1,2})\b/gi;

    const allText = texts.join(' ');

    // Extract drug names
    drugNamePatterns.forEach(pattern => {
      const matches = allText.match(pattern);
      if (matches) {
        drugNames.push(...matches.map(m => m.toLowerCase()));
      }
    });

    // Extract dosages
    let match;
    while ((match = dosagePattern.exec(allText)) !== null) {
      dosages.push(match[0]);
    }

    // Extract manufacturers
    dosagePattern.lastIndex = 0; // Reset regex
    while ((match = manufacturerPattern.exec(allText)) !== null) {
      manufacturers.push(match[0]);
    }

    // Extract batch numbers
    manufacturerPattern.lastIndex = 0;
    while ((match = batchPattern.exec(allText)) !== null) {
      batchNumbers.push(match[2]);
    }

    // Extract expiry dates
    batchPattern.lastIndex = 0;
    while ((match = expiryPattern.exec(allText)) !== null) {
      expiryDates.push(match[2]);
    }

    // Calculate pharmaceutical relevance score
    let score = 0;
    score += drugNames.length * 0.3;
    score += dosages.length * 0.25;
    score += manufacturers.length * 0.2;
    score += batchNumbers.length * 0.15;
    score += expiryDates.length * 0.1;
    score = Math.min(score, 1.0);

    return {
      score,
      drugNames: Array.from(new Set(drugNames)), // Remove duplicates
      dosages: Array.from(new Set(dosages)),
      manufacturers: Array.from(new Set(manufacturers)),
      batchNumbers: Array.from(new Set(batchNumbers)),
      expiryDates: Array.from(new Set(expiryDates))
    };
  }

  /**
   * Detect language of extracted text
   */
  private detectLanguage(texts: string[]): { detected: string; confidence: number } {
    const allText = texts.join(' ').toLowerCase();
    
    // Simple language detection based on common words
    const languageIndicators = {
      eng: ['tablet', 'capsule', 'mg', 'medicine', 'drug', 'dose', 'take', 'oral'],
      spa: ['tableta', 'cápsula', 'medicina', 'tomar', 'oral'],
      fra: ['comprimé', 'gélule', 'médicament', 'prendre', 'oral'],
      deu: ['tablette', 'kapsel', 'medizin', 'nehmen', 'oral'],
      ita: ['compressa', 'capsula', 'medicina', 'prendere', 'orale']
    };

    let maxScore = 0;
    let detectedLanguage = 'eng';

    Object.entries(languageIndicators).forEach(([lang, indicators]) => {
      const score = indicators.reduce((count, word) => {
        return count + (allText.includes(word) ? 1 : 0);
      }, 0) / indicators.length;

      if (score > maxScore) {
        maxScore = score;
        detectedLanguage = lang;
      }
    });

    return {
      detected: detectedLanguage,
      confidence: maxScore
    };
  }

  // Utility methods

  private async prepareImageBuffer(imageData: Buffer | string): Promise<Buffer> {
    if (Buffer.isBuffer(imageData)) {
      return imageData;
    }
    
    const base64Data = imageData.replace(/^data:image\/[a-z]+;base64,/, '');
    return Buffer.from(base64Data, 'base64');
  }

  private calculateSharpness(data: Uint8Array, width: number, height: number): number {
    let totalVariance = 0;
    let count = 0;

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x;
        const gx = data[idx + 1] - data[idx - 1];
        const gy = data[idx + width] - data[idx - width];
        const magnitude = Math.sqrt(gx * gx + gy * gy);
        totalVariance += magnitude;
        count++;
      }
    }

    const avgVariance = totalVariance / count;
    return Math.min(avgVariance / 50, 1); // Normalize to 0-1
  }

  private calculateContrast(data: Uint8Array): number {
    const values = Array.from(data);
    const min = Math.min(...values);
    const max = Math.max(...values);
    return (max - min) / 255;
  }

  private calculateLightingQuality(data: Uint8Array): number {
    const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
    const idealMean = 128;
    const deviation = Math.abs(mean - idealMean) / idealMean;
    return Math.max(0, 1 - deviation);
  }

  private estimateNoise(data: Uint8Array, width: number, height: number): number {
    // Simple noise estimation using local variance
    let totalVariance = 0;
    let count = 0;

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x;
        const neighbors = [
          data[idx - width - 1], data[idx - width], data[idx - width + 1],
          data[idx - 1], data[idx], data[idx + 1],
          data[idx + width - 1], data[idx + width], data[idx + width + 1]
        ];
        
        const mean = neighbors.reduce((sum, val) => sum + val, 0) / 9;
        const variance = neighbors.reduce((sum, val) => sum + (val - mean) ** 2, 0) / 9;
        
        totalVariance += variance;
        count++;
      }
    }

    const avgVariance = totalVariance / count;
    return Math.min(avgVariance / 1000, 1); // Normalize to 0-1
  }

  private calculateOCRConfidence(texts: string[]): number {
    if (texts.length === 0) return 0;

    let score = 0;
    
    // Length penalty for very short or very long texts
    const avgLength = texts.reduce((sum, text) => sum + text.length, 0) / texts.length;
    if (avgLength >= 3 && avgLength <= 50) score += 0.3;
    
    // Alphanumeric content bonus
    const alphanumericRatio = texts.reduce((sum, text) => {
      const alphanumeric = text.match(/[a-zA-Z0-9]/g) || [];
      return sum + (alphanumeric.length / text.length || 0);
    }, 0) / texts.length;
    score += alphanumericRatio * 0.4;
    
    // Pharmaceutical terms bonus
    const pharmaTerms = ['mg', 'tablet', 'capsule', 'oral', 'dose'];
    const pharmaScore = texts.reduce((sum, text) => {
      const matches = pharmaTerms.filter(term => text.toLowerCase().includes(term));
      return sum + matches.length;
    }, 0) / (texts.length * pharmaTerms.length);
    score += pharmaScore * 0.3;

    return Math.min(score, 1);
  }

  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .replace(/\s+/g, ' ')    // Normalize spaces
      .trim();
  }

  private getFallbackOCRResult(): EnhancedOCRResult {
    return {
      extractedText: [],
      confidence: 0,
      quality: {
        sharpness: 0.5,
        contrast: 0.5,
        lighting: 0.5,
        noise: 0.5,
        overall: 0.5
      },
      preprocessing: {
        method: 'fallback',
        parameters: {},
        success: false
      },
      language: {
        detected: 'eng',
        confidence: 0.5
      },
      pharmaceuticalRelevance: {
        score: 0,
        drugNames: [],
        dosages: [],
        manufacturers: [],
        batchNumbers: [],
        expiryDates: []
      }
    };
  }
}

// Export singleton
export const enhancedOCRService = EnhancedOCRService.getInstance();