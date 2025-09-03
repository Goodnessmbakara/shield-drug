/**
 * OpenFDA API Integration Service
 * Provides access to FDA drug databases for validation and cross-referencing
 * Documentation: https://open.fda.gov/apis/drug/
 */

export interface FDADrugInfo {
  brand_name?: string[];
  generic_name?: string[];
  manufacturer_name?: string[];
  substance_name?: string[];
  dosage_form?: string[];
  route?: string[];
  product_ndc?: string[];
  application_number?: string[];
  product_id?: string;
  active_ingredients?: Array<{
    name: string;
    strength: string;
  }>;
  warnings?: string[];
  indications_and_usage?: string[];
  description?: string[];
}

export interface FDASearchResult {
  results?: FDADrugInfo[];
  meta?: {
    disclaimer: string;
    terms: string;
    license: string;
    last_updated: string;
    results: {
      skip: number;
      limit: number;
      total: number;
    };
  };
  error?: {
    code: string;
    message: string;
  };
}

class OpenFDAService {
  private readonly baseUrl = 'https://api.fda.gov';
  private readonly apiKey?: string;

  constructor() {
    this.apiKey = process.env.OPENFDA_API_KEY; // Optional API key for higher rate limits
  }

  /**
   * Search for drug information by name
   */
  async searchDrugByName(drugName: string): Promise<FDASearchResult> {
    try {
      const cleanName = this.cleanDrugName(drugName);
      const searchQuery = `brand_name:"${cleanName}" OR generic_name:"${cleanName}" OR substance_name:"${cleanName}"`;
      
      const url = new URL(`${this.baseUrl}/drug/label.json`);
      url.searchParams.append('search', searchQuery);
      url.searchParams.append('limit', '10');
      
      if (this.apiKey) {
        url.searchParams.append('api_key', this.apiKey);
      }

      console.log('🔍 Searching OpenFDA for:', cleanName);
      console.log('📡 Request URL:', url.toString());

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'DrugShield/1.0 (Drug Authentication System)'
        },
        // Add timeout
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });

      if (!response.ok) {
        if (response.status === 404) {
          console.log('ℹ️ No FDA data found for:', cleanName);
          return { results: [] };
        }
        throw new Error(`OpenFDA API error: ${response.status} ${response.statusText}`);
      }

      const data: FDASearchResult = await response.json();
      console.log('✅ OpenFDA search completed:', data.results?.length || 0, 'results found');
      
      return data;

    } catch (error) {
      console.error('❌ OpenFDA API error:', error);
      
      // Handle network errors gracefully
      if (error instanceof Error && error.message.includes('ENOTFOUND')) {
        console.warn('⚠️ Network connectivity issue - OpenFDA API not reachable');
        return {
          error: {
            code: 'NETWORK_ERROR',
            message: 'Network connectivity issue - OpenFDA API not reachable'
          }
        };
      }
      
      return {
        error: {
          code: 'API_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  /**
   * Search for drug by NDC (National Drug Code)
   */
  async searchDrugByNDC(ndc: string): Promise<FDASearchResult> {
    try {
      const cleanNDC = ndc.replace(/[-\s]/g, ''); // Remove hyphens and spaces
      
      const url = new URL(`${this.baseUrl}/drug/label.json`);
      url.searchParams.append('search', `product_ndc:"${cleanNDC}"`);
      url.searchParams.append('limit', '5');
      
      if (this.apiKey) {
        url.searchParams.append('api_key', this.apiKey);
      }

      console.log('🔍 Searching OpenFDA by NDC:', cleanNDC);

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'DrugShield/1.0 (Drug Authentication System)'
        },
        signal: AbortSignal.timeout(10000)
      });

      if (!response.ok) {
        if (response.status === 404) {
          return { results: [] };
        }
        throw new Error(`OpenFDA API error: ${response.status} ${response.statusText}`);
      }

      const data: FDASearchResult = await response.json();
      return data;

    } catch (error) {
      console.error('❌ OpenFDA NDC search error:', error);
      return {
        error: {
          code: 'API_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  /**
   * Validate drug information against FDA database
   */
  async validateDrug(drugName: string, manufacturer?: string, strength?: string): Promise<{
    isValid: boolean;
    confidence: number;
    fdaInfo?: FDADrugInfo;
    matchDetails: {
      nameMatch: boolean;
      manufacturerMatch: boolean;
      strengthMatch: boolean;
    };
  }> {
    try {
      const searchResult = await this.searchDrugByName(drugName);
      
      if (!searchResult.results || searchResult.results.length === 0) {
        return {
          isValid: false,
          confidence: 0,
          matchDetails: {
            nameMatch: false,
            manufacturerMatch: false,
            strengthMatch: false
          }
        };
      }

      // Find the best match
      let bestMatch: FDADrugInfo | null = null;
      let bestScore = 0;
      let matchDetails = {
        nameMatch: false,
        manufacturerMatch: false,
        strengthMatch: false
      };

      for (const result of searchResult.results) {
        let score = 0;
        let currentMatch = {
          nameMatch: false,
          manufacturerMatch: false,
          strengthMatch: false
        };

        // Check name match
        const nameMatch = this.checkNameMatch(drugName, result);
        if (nameMatch) {
          score += 0.5;
          currentMatch.nameMatch = true;
        }

        // Check manufacturer match
        if (manufacturer && result.manufacturer_name) {
          const mfgMatch = result.manufacturer_name.some(mfg => 
            mfg.toLowerCase().includes(manufacturer.toLowerCase()) ||
            manufacturer.toLowerCase().includes(mfg.toLowerCase())
          );
          if (mfgMatch) {
            score += 0.3;
            currentMatch.manufacturerMatch = true;
          }
        }

        // Check strength match (simplified)
        if (strength && result.active_ingredients) {
          const strengthMatch = result.active_ingredients.some(ingredient =>
            ingredient.strength && strength.includes(ingredient.strength)
          );
          if (strengthMatch) {
            score += 0.2;
            currentMatch.strengthMatch = true;
          }
        }

        if (score > bestScore) {
          bestScore = score;
          bestMatch = result;
          matchDetails = currentMatch;
        }
      }

      return {
        isValid: bestScore > 0.3, // Require at least 30% match
        confidence: Math.min(bestScore, 1.0),
        fdaInfo: bestMatch || undefined,
        matchDetails
      };

    } catch (error) {
      console.error('❌ Drug validation error:', error);
      return {
        isValid: false,
        confidence: 0,
        matchDetails: {
          nameMatch: false,
          manufacturerMatch: false,
          strengthMatch: false
        }
      };
    }
  }

  /**
   * Get comprehensive drug information
   */
  async getDrugInfo(drugName: string): Promise<{
    found: boolean;
    drugInfo?: {
      brandNames: string[];
      genericNames: string[];
      manufacturers: string[];
      activeIngredients: Array<{ name: string; strength: string }>;
      dosageForms: string[];
      routes: string[];
      warnings: string[];
      indications: string[];
      description: string;
    };
    source: string;
  }> {
    try {
      const searchResult = await this.searchDrugByName(drugName);
      
      if (!searchResult.results || searchResult.results.length === 0) {
        return { found: false, source: 'OpenFDA' };
      }

      const result = searchResult.results[0]; // Use the first (most relevant) result
      
      return {
        found: true,
        drugInfo: {
          brandNames: result.brand_name || [],
          genericNames: result.generic_name || [],
          manufacturers: result.manufacturer_name || [],
          activeIngredients: result.active_ingredients || [],
          dosageForms: result.dosage_form || [],
          routes: result.route || [],
          warnings: result.warnings || [],
          indications: result.indications_and_usage || [],
          description: result.description?.[0] || ''
        },
        source: 'OpenFDA'
      };

    } catch (error) {
      console.error('❌ Get drug info error:', error);
      return { found: false, source: 'OpenFDA' };
    }
  }

  /**
   * Clean drug name for better search results
   */
  private cleanDrugName(drugName: string): string {
    return drugName
      .replace(/\d+\s*mg/gi, '') // Remove dosage
      .replace(/\d+\s*mcg/gi, '')
      .replace(/\d+\s*g/gi, '')
      .replace(/\d+\s*ml/gi, '')
      .replace(/tablet|capsule|pill/gi, '') // Remove form
      .trim()
      .toLowerCase();
  }

  /**
   * Check if drug name matches FDA result
   */
  private checkNameMatch(searchName: string, fdaResult: FDADrugInfo): boolean {
    const cleanSearchName = this.cleanDrugName(searchName).toLowerCase();
    
    // Check brand names
    if (fdaResult.brand_name) {
      for (const brandName of fdaResult.brand_name) {
        if (brandName.toLowerCase().includes(cleanSearchName) || 
            cleanSearchName.includes(brandName.toLowerCase())) {
          return true;
        }
      }
    }

    // Check generic names
    if (fdaResult.generic_name) {
      for (const genericName of fdaResult.generic_name) {
        if (genericName.toLowerCase().includes(cleanSearchName) || 
            cleanSearchName.includes(genericName.toLowerCase())) {
          return true;
        }
      }
    }

    // Check substance names
    if (fdaResult.substance_name) {
      for (const substanceName of fdaResult.substance_name) {
        if (substanceName.toLowerCase().includes(cleanSearchName) || 
            cleanSearchName.includes(substanceName.toLowerCase())) {
          return true;
        }
      }
    }

    return false;
  }
}

// Export singleton instance
export const openFdaService = new OpenFDAService();
