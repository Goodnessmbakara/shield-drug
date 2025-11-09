/**
 * Drug Information API Service
 * Uses external APIs to identify and get information about drugs
 * Primary: RxNorm API (free, no API key required)
 * Fallback: OpenFDA Drug API (free, no API key required)
 */

export interface DrugApiResult {
  name: string;
  strength?: string;
  form?: string;
  rxcui?: string; // RxNorm concept unique identifier
  confidence: number;
  source: 'rxnorm' | 'openfda' | 'extracted';
  details?: {
    genericName?: string;
    brandNames?: string[];
    dosageForms?: string[];
    routes?: string[];
  };
}

/**
 * Search for drug using RxNorm API
 * RxNorm API: https://lhncbc.nlm.nih.gov/RxNav/APIs/index.html
 */
async function searchRxNorm(drugName: string): Promise<DrugApiResult | null> {
  try {
    // Clean drug name for API query
    const cleanName = drugName
      .replace(/\s*\+\s*/g, ' ') // Replace "+" with space for combination drugs
      .replace(/\d+\s*(mg|mcg|g|ml|IU)/gi, '') // Remove dosage
      .trim();

    if (cleanName.length < 3) return null;

    // RxNorm API - Approximate Term Match
    const url = `https://rxnav.nlm.nih.gov/REST/approximateTerm.json?term=${encodeURIComponent(cleanName)}&maxEntries=5`;
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.warn(`RxNorm API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    
    if (data.approximateGroup?.candidate) {
      const candidates = data.approximateGroup.candidate;
      const bestMatch = candidates[0]; // Get best match
      
      if (bestMatch?.rxcui) {
        // Get drug details using RxCUI
        const detailsUrl = `https://rxnav.nlm.nih.gov/REST/rxcui/${bestMatch.rxcui}/properties.json`;
        const detailsResponse = await fetch(detailsUrl);
        
        let drugDetails: any = {};
        if (detailsResponse.ok) {
          const detailsData = await detailsResponse.json();
          drugDetails = detailsData.properties || {};
        }

        return {
          name: bestMatch.name || cleanName,
          strength: extractStrengthFromName(drugName),
          rxcui: bestMatch.rxcui,
          confidence: bestMatch.score ? bestMatch.score / 100 : 0.7,
          source: 'rxnorm',
          details: {
            genericName: drugDetails.name,
          },
        };
      }
    }

    return null;
  } catch (error) {
    console.warn('RxNorm API search failed:', error);
    return null;
  }
}

/**
 * Search for drug using OpenFDA Drug API
 * OpenFDA API: https://open.fda.gov/apis/drug/
 */
async function searchOpenFDA(drugName: string): Promise<DrugApiResult | null> {
  try {
    const cleanName = drugName
      .replace(/\s*\+\s*/g, ' ')
      .replace(/\d+\s*(mg|mcg|g|ml|IU)/gi, '')
      .trim();

    if (cleanName.length < 3) return null;

    // OpenFDA Drug Label API - search by active ingredient
    const url = `https://api.fda.gov/drug/label.json?search=active_ingredient:"${encodeURIComponent(cleanName)}"&limit=1`;
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.warn(`OpenFDA API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      const drug = data.results[0];
      const brandNames = drug.brand_name || [];
      const genericName = drug.generic_name?.[0] || cleanName;
      const dosageForms = drug.dosage_form || [];
      const routes = drug.route || [];

      return {
        name: genericName,
        strength: extractStrengthFromName(drugName),
        form: dosageForms[0],
        confidence: 0.6,
        source: 'openfda',
        details: {
          genericName,
          brandNames: Array.isArray(brandNames) ? brandNames : [brandNames],
          dosageForms: Array.isArray(dosageForms) ? dosageForms : [dosageForms],
          routes: Array.isArray(routes) ? routes : [routes],
        },
      };
    }

    return null;
  } catch (error) {
    console.warn('OpenFDA API search failed:', error);
    return null;
  }
}

/**
 * Extract strength from drug name string
 */
function extractStrengthFromName(drugName: string): string | undefined {
  // Pattern: "DrugName XXmg + DrugName XXmg" or "DrugName XXmg"
  const combinationMatch = drugName.match(/(\d+\s*(?:mg|mcg|g|ml|IU))\s*\+\s*(\d+\s*(?:mg|mcg|g|ml|IU))/i);
  if (combinationMatch) {
    return `${combinationMatch[1]} + ${combinationMatch[2]}`;
  }
  
  const singleMatch = drugName.match(/(\d+\s*(?:mg|mcg|g|ml|IU))/i);
  return singleMatch ? singleMatch[1] : undefined;
}

/**
 * Identify drug using external APIs
 * Tries RxNorm first, then OpenFDA as fallback
 */
export async function identifyDrugFromAPI(
  extractedText: string[]
): Promise<DrugApiResult | null> {
  if (extractedText.length === 0) {
    return null;
  }

  // Combine text and extract potential drug names
  const combinedText = extractedText.join(' ').toUpperCase();
  
  // Extract drug name patterns from OCR text
  // Pattern 1: Combination drugs "Drug1 XXmg + Drug2 XXmg"
  const combinationPattern = /([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+)*)\s+(\d+\s*(?:mg|mcg|g|ml|IU))\s*\+\s*([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+)*)\s+(\d+\s*(?:mg|mcg|g|ml|IU))/i;
  const combinationMatch = combinedText.match(combinationPattern);
  
  if (combinationMatch) {
    const drug1 = combinationMatch[1].trim();
    const drug2 = combinationMatch[3].trim();
    const strength1 = combinationMatch[2];
    const strength2 = combinationMatch[4];
    
    // Try to find both drugs
    const result1 = await searchRxNorm(drug1);
    const result2 = await searchRxNorm(drug2);
    
    if (result1 || result2) {
      const combinedName = result1 && result2 
        ? `${result1.name} + ${result2.name}`
        : result1 
        ? `${result1.name} + ${drug2}`
        : `${drug1} + ${result2!.name}`;
      
      return {
        name: combinedName,
        strength: `${strength1} + ${strength2}`,
        confidence: Math.max(result1?.confidence || 0.5, result2?.confidence || 0.5),
        source: result1?.source || result2?.source || 'extracted',
      };
    }
    
    // Fallback: return extracted combination
    return {
      name: `${drug1} + ${drug2}`,
      strength: `${strength1} + ${strength2}`,
      confidence: 0.6,
      source: 'extracted',
    };
  }
  
  // Pattern 2: Single drug "DrugName XXmg"
  const singleDrugPattern = /([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+)*)\s+(\d+\s*(?:mg|mcg|g|ml|IU))/i;
  const singleMatch = combinedText.match(singleDrugPattern);
  
  if (singleMatch) {
    const drugName = singleMatch[1].trim();
    const strength = singleMatch[2];
    
    // Try RxNorm first
    let result = await searchRxNorm(drugName);
    
    // Fallback to OpenFDA if RxNorm fails
    if (!result) {
      result = await searchOpenFDA(drugName);
    }
    
    if (result) {
      return {
        ...result,
        strength: result.strength || strength,
      };
    }
    
    // Fallback: return extracted drug name
    return {
      name: drugName,
      strength,
      confidence: 0.5,
      source: 'extracted',
    };
  }
  
  // Pattern 3: Brand/product name (e.g., "CAMOSUNATE", "LOREN")
  const brandPattern = /\b([A-Z]{3,}[A-Za-z]*)\b/;
  const brandMatches = combinedText.match(brandPattern);
  
  if (brandMatches) {
    const brandName = brandMatches[1];
    
    // Try to find in APIs
    let result = await searchRxNorm(brandName);
    if (!result) {
      result = await searchOpenFDA(brandName);
    }
    
    if (result) {
      return result;
    }
    
    // Return brand name as extracted
    return {
      name: brandName,
      confidence: 0.4,
      source: 'extracted',
    };
  }
  
  return null;
}

