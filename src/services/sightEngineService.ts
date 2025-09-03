/**
 * SightEngine Drug Detection API Integration
 * Provides AI-powered drug detection in images
 * Documentation: https://sightengine.com/docs/drug-detection
 */

export interface SightEngineDetection {
  prob: number; // Probability (0-1)
  safe: boolean; // Whether content is safe
}

export interface SightEngineDrugResult {
  status: 'success' | 'failure';
  request?: {
    id: string;
    timestamp: number;
    operations: number;
  };
  drugs?: {
    prob: number;
    safe: boolean;
    classes: {
      cannabis: SightEngineDetection;
      pills: SightEngineDetection;
      cocaine: SightEngineDetection;
      mdma: SightEngineDetection;
      heroin: SightEngineDetection;
      meth: SightEngineDetection;
    };
  };
  error?: {
    type: string;
    code: number;
    message: string;
  };
}

class SightEngineService {
  private readonly baseUrl = 'https://api.sightengine.com/1.0';
  private readonly apiUser: string;
  private readonly apiSecret: string;

  constructor() {
    this.apiUser = process.env.SIGHTENGINE_API_USER || '';
    this.apiSecret = process.env.SIGHTENGINE_API_SECRET || '';
  }

  /**
   * Check if the service is configured
   */
  isConfigured(): boolean {
    return !!(this.apiUser && this.apiSecret);
  }

  /**
   * Detect drugs in image using base64 data
   */
  async detectDrugs(imageData: string): Promise<SightEngineDrugResult> {
    if (!this.isConfigured()) {
      console.warn('⚠️ SightEngine API not configured, skipping drug detection');
      return {
        status: 'failure',
        error: {
          type: 'CONFIGURATION_ERROR',
          code: 401,
          message: 'SightEngine API credentials not configured'
        }
      };
    }

    try {
      // Remove data URL prefix if present
      const base64Data = imageData.replace(/^data:image\/[a-z]+;base64,/, '');
      
      const formData = new FormData();
      formData.append('media', base64Data);
      formData.append('models', 'drugs');
      formData.append('api_user', this.apiUser);
      formData.append('api_secret', this.apiSecret);

      console.log('🔍 Analyzing image with SightEngine drug detection...');

      const response = await fetch(`${this.baseUrl}/check.json`, {
        method: 'POST',
        body: formData,
        signal: AbortSignal.timeout(15000) // 15 second timeout
      });

      if (!response.ok) {
        throw new Error(`SightEngine API error: ${response.status} ${response.statusText}`);
      }

      const result: SightEngineDrugResult = await response.json();
      
      if (result.status === 'success') {
        console.log('✅ SightEngine analysis completed:', {
          drugsProbability: result.drugs?.prob,
          pillsProbability: result.drugs?.classes.pills.prob,
          safe: result.drugs?.safe
        });
      }

      return result;

    } catch (error) {
      console.error('❌ SightEngine API error:', error);
      return {
        status: 'failure',
        error: {
          type: 'API_ERROR',
          code: 500,
          message: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  /**
   * Analyze drug detection results for pharmaceutical context
   */
  analyzeDrugDetection(result: SightEngineDrugResult): {
    isPharmaceutical: boolean;
    confidence: number;
    detectedTypes: string[];
    riskLevel: 'low' | 'medium' | 'high';
    recommendations: string[];
  } {
    if (result.status !== 'success' || !result.drugs) {
      return {
        isPharmaceutical: false,
        confidence: 0,
        detectedTypes: [],
        riskLevel: 'low',
        recommendations: ['Unable to analyze image with SightEngine']
      };
    }

    const drugs = result.drugs;
    const detectedTypes: string[] = [];
    const recommendations: string[] = [];
    let confidence = 0;
    let isPharmaceutical = false;
    let riskLevel: 'low' | 'medium' | 'high' = 'low';

    // Check for pills (legitimate pharmaceuticals)
    if (drugs.classes.pills.prob > 0.3) {
      detectedTypes.push('pills');
      isPharmaceutical = true;
      confidence = Math.max(confidence, drugs.classes.pills.prob);
      
      if (drugs.classes.pills.prob > 0.7) {
        recommendations.push('High confidence pharmaceutical detection');
      } else {
        recommendations.push('Moderate confidence pharmaceutical detection');
      }
    }

    // Check for illicit substances (should raise flags)
    const illicitSubstances = ['cannabis', 'cocaine', 'mdma', 'heroin', 'meth'] as const;
    
    for (const substance of illicitSubstances) {
      if (drugs.classes[substance].prob > 0.5) {
        detectedTypes.push(substance);
        riskLevel = 'high';
        recommendations.push(`⚠️ Detected potential ${substance} - requires manual review`);
      } else if (drugs.classes[substance].prob > 0.3) {
        detectedTypes.push(`possible_${substance}`);
        riskLevel = 'medium';
        recommendations.push(`⚠️ Possible ${substance} detection - verify authenticity`);
      }
    }

    // Overall drug probability
    if (drugs.prob > 0.5) {
      confidence = Math.max(confidence, drugs.prob);
      
      if (!isPharmaceutical && riskLevel === 'low') {
        riskLevel = 'medium';
        recommendations.push('Substance detected but type unclear - manual verification recommended');
      }
    }

    // Safety assessment
    if (!drugs.safe) {
      riskLevel = 'high';
      recommendations.push('⚠️ Content flagged as unsafe by SightEngine');
    }

    return {
      isPharmaceutical,
      confidence,
      detectedTypes,
      riskLevel,
      recommendations
    };
  }

  /**
   * Get detection summary for logging/reporting
   */
  getDetectionSummary(result: SightEngineDrugResult): string {
    if (result.status !== 'success' || !result.drugs) {
      return 'SightEngine analysis failed or unavailable';
    }

    const analysis = this.analyzeDrugDetection(result);
    
    return `SightEngine Detection: ${analysis.isPharmaceutical ? 'Pharmaceutical' : 'Non-pharmaceutical'} ` +
           `(confidence: ${(analysis.confidence * 100).toFixed(1)}%, ` +
           `types: ${analysis.detectedTypes.join(', ') || 'none'}, ` +
           `risk: ${analysis.riskLevel})`;
  }
}

// Export singleton instance
export const sightEngineService = new SightEngineService();

