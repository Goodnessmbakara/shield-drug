/**
 * Enhanced Drug Analysis Service
 * Combines multiple APIs and services for comprehensive drug identification and validation
 */

import { aiDrugAnalysis } from './aiDrugAnalysis';
import { openFdaService } from './openFdaService';
import { sightEngineService } from './sightEngineService';
import { googleVisionService } from './googleVisionService';
import { DrugAnalysisResult } from '@/lib/types';

export interface EnhancedAnalysisResult extends DrugAnalysisResult {
  enhancedFeatures: {
    fdaValidation?: {
      isValid: boolean;
      confidence: number;
      matchDetails: {
        nameMatch: boolean;
        manufacturerMatch: boolean;
        strengthMatch: boolean;
      };
      fdaInfo?: any;
    };
    sightEngineAnalysis?: {
      isPharmaceutical: boolean;
      confidence: number;
      detectedTypes: string[];
      riskLevel: 'low' | 'medium' | 'high';
      recommendations: string[];
    };
    googleVisionAnalysis?: {
      isPharmaceutical: boolean;
      confidence: number;
      detectedText: string[];
      labels: Array<{ description: string; confidence: number }>;
      safetyScore: {
        adult: number;
        spoof: number;
        medical: number;
        violence: number;
        racy: number;
      };
      recommendations: string[];
    };
    combinedConfidence: number;
    dataSource: string[];
    analysisMetadata: {
      timestamp: string;
      processingTime: number;
      apisUsed: string[];
      fallbacksUsed: string[];
    };
  };
}

class EnhancedDrugAnalysisService {
  /**
   * Perform comprehensive drug analysis using multiple APIs
   */
  async analyzeImage(imageData: string): Promise<EnhancedAnalysisResult> {
    const startTime = Date.now();
    const apisUsed: string[] = [];
    const fallbacksUsed: string[] = [];
    const dataSource: string[] = [];

    console.log('🚀 Starting enhanced drug analysis with multiple APIs...');

    try {
      // Step 1: Base AI analysis (always run first)
      console.log('🔍 Step 1: Running base AI analysis...');
      const baseResult = await aiDrugAnalysis.analyzeImage(imageData);
      apisUsed.push('TensorFlow.js');
      dataSource.push('Local AI Models');

      // Step 2: Google Cloud Vision analysis (if configured)
      let googleVisionAnalysis;
      if (googleVisionService.isConfigured()) {
        try {
          console.log('🔍 Step 2: Running Google Cloud Vision analysis...');
          const googleVisionResult = await googleVisionService.analyzeImage(imageData);
          
          // Check if it's a billing error
          if (googleVisionResult.error?.status === 'BILLING_REQUIRED') {
            console.warn('⚠️ Google Cloud Vision requires billing setup - skipping');
            fallbacksUsed.push('Google Cloud Vision billing required');
          } else {
            googleVisionAnalysis = googleVisionService.analyzeDrugDetection(googleVisionResult);
            apisUsed.push('Google Cloud Vision');
            dataSource.push('Google Cloud Vision API');
            console.log('✅ Google Cloud Vision analysis completed');
          }
        } catch (error) {
          console.warn('⚠️ Google Cloud Vision analysis failed:', error);
          fallbacksUsed.push('Google Cloud Vision failed');
        }
      } else {
        console.log('ℹ️ Google Cloud Vision not configured, skipping...');
        fallbacksUsed.push('Google Cloud Vision not configured');
      }

      // Step 3: SightEngine drug detection (if configured)
      let sightEngineAnalysis;
      if (sightEngineService.isConfigured()) {
        try {
          console.log('🔍 Step 3: Running SightEngine drug detection...');
          const sightEngineResult = await sightEngineService.detectDrugs(imageData);
          sightEngineAnalysis = sightEngineService.analyzeDrugDetection(sightEngineResult);
          apisUsed.push('SightEngine');
          dataSource.push('SightEngine API');
          console.log('✅ SightEngine analysis completed');
        } catch (error) {
          console.warn('⚠️ SightEngine analysis failed:', error);
          fallbacksUsed.push('SightEngine failed');
        }
      } else {
        console.log('ℹ️ SightEngine not configured, skipping...');
        fallbacksUsed.push('SightEngine not configured');
      }

      // Step 4: FDA validation (if we have a drug name)
      let fdaValidation;
      if (baseResult.drugName && baseResult.drugName !== 'Unknown' && baseResult.drugName !== 'Not a Drug') {
        try {
          console.log('🔍 Step 4: Validating with OpenFDA...');
          
          // Extract manufacturer from issues or use generic search
          const manufacturer = this.extractManufacturer(baseResult.extractedText);
          
          fdaValidation = await openFdaService.validateDrug(
            baseResult.drugName, 
            manufacturer, 
            baseResult.strength
          );
          
          // Check if it's a network error
          if (fdaValidation.error?.code === 'NETWORK_ERROR') {
            console.warn('⚠️ OpenFDA network connectivity issue - skipping');
            fallbacksUsed.push('OpenFDA network error');
          } else {
            apisUsed.push('OpenFDA');
            dataSource.push('FDA Database');
            console.log('✅ FDA validation completed');
          }
        } catch (error) {
          console.warn('⚠️ FDA validation failed:', error);
          fallbacksUsed.push('OpenFDA failed');
        }
      } else {
        console.log('ℹ️ No drug name available for FDA validation');
        fallbacksUsed.push('No drug name for FDA validation');
      }

      // Step 5: Combine and enhance results
      const enhancedResult = this.combineResults(
        baseResult, 
        fdaValidation, 
        sightEngineAnalysis,
        googleVisionAnalysis,
        {
          timestamp: new Date().toISOString(),
          processingTime: Date.now() - startTime,
          apisUsed,
          fallbacksUsed
        }
      );

      enhancedResult.enhancedFeatures.dataSource = dataSource;

      console.log('🎉 Enhanced analysis completed:', {
        drugName: enhancedResult.drugName,
        combinedConfidence: enhancedResult.enhancedFeatures.combinedConfidence,
        apisUsed: apisUsed.length,
        processingTime: Date.now() - startTime
      });

      return enhancedResult;

    } catch (error) {
      console.error('❌ Enhanced analysis failed:', error);
      
      // Return base result with error information
      const baseResult = await aiDrugAnalysis.analyzeImage(imageData);
      return {
        ...baseResult,
        enhancedFeatures: {
          combinedConfidence: baseResult.confidence,
          dataSource: ['Local AI Models (fallback)'],
          analysisMetadata: {
            timestamp: new Date().toISOString(),
            processingTime: Date.now() - startTime,
            apisUsed: ['TensorFlow.js'],
            fallbacksUsed: ['Enhanced analysis failed']
          }
        }
      };
    }
  }

  /**
   * Combine results from multiple sources
   */
  private combineResults(
    baseResult: DrugAnalysisResult,
    fdaValidation?: any,
    sightEngineAnalysis?: any,
    googleVisionAnalysis?: any,
    metadata?: any
  ): EnhancedAnalysisResult {
    
    // Calculate combined confidence
    let combinedConfidence = baseResult.confidence;
    let confidenceFactors = 1;

    // Boost confidence if FDA validates the drug
    if (fdaValidation?.isValid) {
      combinedConfidence += fdaValidation.confidence * 0.3; // 30% boost from FDA
      confidenceFactors += 0.3;
    }

    // Boost confidence if Google Cloud Vision detects pharmaceutical
    if (googleVisionAnalysis?.isPharmaceutical) {
      combinedConfidence += googleVisionAnalysis.confidence * 0.25; // 25% boost from Google Vision
      confidenceFactors += 0.25;
    }

    // Boost confidence if SightEngine detects pharmaceutical
    if (sightEngineAnalysis?.isPharmaceutical) {
      combinedConfidence += sightEngineAnalysis.confidence * 0.2; // 20% boost from SightEngine
      confidenceFactors += 0.2;
    }

    // Normalize combined confidence
    combinedConfidence = Math.min(combinedConfidence / confidenceFactors, 1.0);

    // Enhance drug name with FDA information
    let enhancedDrugName = baseResult.drugName;
    if (fdaValidation?.fdaInfo?.brand_name?.[0] && fdaValidation.isValid) {
      enhancedDrugName = fdaValidation.fdaInfo.brand_name[0];
    }

    // Enhance status based on multiple sources
    let enhancedStatus = baseResult.status;
    if (sightEngineAnalysis?.riskLevel === 'high') {
      enhancedStatus = 'counterfeit';
    } else if (fdaValidation?.isValid && combinedConfidence > 0.7) {
      enhancedStatus = 'authentic';
    } else if (combinedConfidence < 0.3) {
      enhancedStatus = 'suspicious';
    }

    // Combine issues and recommendations
    const enhancedIssues = [...baseResult.issues];
    
    if (fdaValidation && !fdaValidation.isValid) {
      enhancedIssues.push('Drug not found in FDA database');
    }
    
    if (googleVisionAnalysis?.recommendations) {
      enhancedIssues.push(...googleVisionAnalysis.recommendations);
    }
    
    if (sightEngineAnalysis?.recommendations) {
      enhancedIssues.push(...sightEngineAnalysis.recommendations);
    }

    return {
      ...baseResult,
      drugName: enhancedDrugName,
      confidence: combinedConfidence,
      status: enhancedStatus,
      issues: enhancedIssues,
      enhancedFeatures: {
        fdaValidation,
        sightEngineAnalysis,
        googleVisionAnalysis,
        combinedConfidence,
        dataSource: [],
        analysisMetadata: metadata || {
          timestamp: new Date().toISOString(),
          processingTime: 0,
          apisUsed: [],
          fallbacksUsed: []
        }
      }
    };
  }

  /**
   * Extract manufacturer information from text
   */
  private extractManufacturer(extractedText: string[]): string | undefined {
    const manufacturerPatterns = [
      /\b(GSK|GlaxoSmithKline)\b/i,
      /\b(Pfizer)\b/i,
      /\b(Johnson\s*&?\s*Johnson)\b/i,
      /\b(Bayer)\b/i,
      /\b(Sandoz)\b/i,
      /\b(Teva)\b/i,
      /\b(Novartis)\b/i,
      /\b(Merck)\b/i,
      /\b(AstraZeneca)\b/i,
      /\b(Generic)\b/i,
      /\b([A-Z][a-z]+\s+Pharmaceuticals?)\b/i,
      /\b([A-Z][a-z]+\s+Labs?)\b/i
    ];

    for (const text of extractedText) {
      for (const pattern of manufacturerPatterns) {
        const match = text.match(pattern);
        if (match) {
          return match[1] || match[0];
        }
      }
    }

    return undefined;
  }

  /**
   * Get analysis summary for reporting
   */
  getAnalysisSummary(result: EnhancedAnalysisResult): {
    summary: string;
    confidence: number;
    recommendations: string[];
    dataQuality: 'high' | 'medium' | 'low';
  } {
    const { enhancedFeatures } = result;
    const apisUsed = enhancedFeatures.analysisMetadata.apisUsed.length;
    
    let dataQuality: 'high' | 'medium' | 'low' = 'low';
    if (apisUsed >= 3) dataQuality = 'high';
    else if (apisUsed >= 2) dataQuality = 'medium';

    const recommendations = [];
    
    if (enhancedFeatures.fdaValidation?.isValid) {
      recommendations.push('✅ Verified against FDA database');
    } else if (enhancedFeatures.fdaValidation) {
      recommendations.push('⚠️ Not found in FDA database - verify authenticity');
    }

    if (enhancedFeatures.sightEngineAnalysis?.riskLevel === 'high') {
      recommendations.push('🚨 High risk detected - manual review required');
    }

    if (enhancedFeatures.combinedConfidence > 0.8) {
      recommendations.push('✅ High confidence identification');
    } else if (enhancedFeatures.combinedConfidence < 0.4) {
      recommendations.push('⚠️ Low confidence - additional verification recommended');
    }

    return {
      summary: `Enhanced analysis using ${apisUsed} APIs with ${(enhancedFeatures.combinedConfidence * 100).toFixed(1)}% confidence`,
      confidence: enhancedFeatures.combinedConfidence,
      recommendations,
      dataQuality
    };
  }
}

// Export singleton instance
export const enhancedDrugAnalysis = new EnhancedDrugAnalysisService();
