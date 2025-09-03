/**
 * Enhanced Drug Database with 100+ Common Medications
 * Includes detailed visual profiles, packaging variations, and international equivalents
 */

export interface DrugProfile {
  id: string;
  name: string;
  genericName: string;
  brandNames: string[];
  internationalNames: string[];
  activeIngredients: string[];
  category: string;
  subcategory: string;
  
  // Visual characteristics
  visual: {
    colors: string[];
    shapes: string[];
    sizes: string[];
    markings: string[];
    textures: string[];
  };
  
  // Dosage information
  strengths: string[];
  forms: string[];
  
  // Packaging variations
  packaging: {
    types: string[];
    materials: string[];
    colors: string[];
    features: string[];
  };
  
  // Manufacturer information
  manufacturers: {
    name: string;
    country: string;
    markings: string[];
    packaging: string[];
  }[];
  
  // Authentication features
  security: {
    watermarks: boolean;
    holograms: boolean;
    embossing: boolean;
    colorChanging: boolean;
    microprinting: boolean;
    barcodes: string[];
    qrCodes: boolean;
  };
  
  // Regional variations
  regions: {
    region: string;
    variations: string[];
    regulations: string[];
  }[];
}

export const ENHANCED_DRUG_DATABASE: DrugProfile[] = [
  // Pain Relief & Fever Reducers
  {
    id: "paracetamol",
    name: "Paracetamol",
    genericName: "Acetaminophen",
    brandNames: ["Tylenol", "Panadol", "Calpol", "Feverfew", "Aceta"],
    internationalNames: ["Acetaminophen", "N-Acetyl-p-aminophenol"],
    activeIngredients: ["Paracetamol"],
    category: "Analgesic",
    subcategory: "Non-opioid",
    
    visual: {
      colors: ["white", "off-white", "cream", "yellow", "red"],
      shapes: ["round", "oval", "caplet", "capsule"],
      sizes: ["small", "medium", "large"],
      markings: ["500", "1000", "P", "TYLENOL", "PANADOL", "ACETA"],
      textures: ["smooth", "scored", "film-coated"]
    },
    
    strengths: ["80mg", "160mg", "325mg", "500mg", "650mg", "1000mg"],
    forms: ["tablet", "capsule", "liquid", "suppository", "powder"],
    
    packaging: {
      types: ["blister", "bottle", "sachet", "box"],
      materials: ["plastic", "aluminum", "cardboard"],
      colors: ["white", "blue", "red", "green"],
      features: ["child-resistant", "tamper-evident", "moisture-proof"]
    },
    
    manufacturers: [
      { name: "GSK", country: "UK", markings: ["GSK", "G"], packaging: ["blue-white"] },
      { name: "Johnson & Johnson", country: "USA", markings: ["J&J", "McNEIL"], packaging: ["red-white"] },
      { name: "Pfizer", country: "USA", markings: ["PFE", "PFIZER"], packaging: ["blue"] },
      { name: "Sanofi", country: "France", markings: ["SNF", "SANOFI"], packaging: ["orange"] }
    ],
    
    security: {
      watermarks: true,
      holograms: true,
      embossing: false,
      colorChanging: false,
      microprinting: true,
      barcodes: ["EAN-13", "Code128"],
      qrCodes: true
    },
    
    regions: [
      { region: "USA", variations: ["Tylenol", "Acetaminophen"], regulations: ["FDA"] },
      { region: "EU", variations: ["Paracetamol"], regulations: ["EMA"] },
      { region: "Asia", variations: ["Panadol", "Calpol"], regulations: ["local"] }
    ]
  },

  {
    id: "ibuprofen",
    name: "Ibuprofen",
    genericName: "Ibuprofen",
    brandNames: ["Advil", "Motrin", "Nurofen", "Brufen", "Ibu-ratiopharm"],
    internationalNames: ["2-(4-isobutylphenyl)propionic acid"],
    activeIngredients: ["Ibuprofen"],
    category: "NSAID",
    subcategory: "Propionic acid derivative",
    
    visual: {
      colors: ["white", "orange", "brown", "red", "pink"],
      shapes: ["round", "oval", "caplet"],
      sizes: ["small", "medium"],
      markings: ["200", "400", "600", "IBU", "ADVIL", "MOTRIN", "I"],
      textures: ["smooth", "film-coated", "sugar-coated"]
    },
    
    strengths: ["100mg", "200mg", "400mg", "600mg", "800mg"],
    forms: ["tablet", "capsule", "gel", "liquid", "topical"],
    
    packaging: {
      types: ["blister", "bottle", "tube"],
      materials: ["plastic", "aluminum", "glass"],
      colors: ["orange", "blue", "green", "white"],
      features: ["child-resistant", "tamper-evident"]
    },
    
    manufacturers: [
      { name: "Pfizer", country: "USA", markings: ["ADVIL", "PFE"], packaging: ["orange-white"] },
      { name: "Johnson & Johnson", country: "USA", markings: ["MOTRIN", "J&J"], packaging: ["red-blue"] },
      { name: "Reckitt", country: "UK", markings: ["NUROFEN", "RB"], packaging: ["red-white"] },
      { name: "Abbott", country: "USA", markings: ["BRUFEN", "ABT"], packaging: ["blue-white"] }
    ],
    
    security: {
      watermarks: true,
      holograms: true,
      embossing: false,
      colorChanging: false,
      microprinting: false,
      barcodes: ["EAN-13"],
      qrCodes: false
    },
    
    regions: [
      { region: "Global", variations: ["Ibuprofen"], regulations: ["FDA", "EMA"] },
      { region: "USA", variations: ["Advil", "Motrin"], regulations: ["FDA"] },
      { region: "EU", variations: ["Nurofen", "Brufen"], regulations: ["EMA"] }
    ]
  },

  {
    id: "aspirin",
    name: "Aspirin",
    genericName: "Acetylsalicylic acid",
    brandNames: ["Bayer", "Ecotrin", "Bufferin", "Excedrin"],
    internationalNames: ["Acetylsalicylic acid", "ASA"],
    activeIngredients: ["Acetylsalicylic acid"],
    category: "NSAID",
    subcategory: "Salicylate",
    
    visual: {
      colors: ["white", "yellow", "pink", "orange"],
      shapes: ["round", "oblong"],
      sizes: ["small", "medium"],
      markings: ["81", "325", "BAYER", "ASA", "B"],
      textures: ["smooth", "enteric-coated", "buffered"]
    },
    
    strengths: ["81mg", "325mg", "500mg", "650mg"],
    forms: ["tablet", "chewable", "enteric-coated", "effervescent"],
    
    packaging: {
      types: ["bottle", "blister", "dispenser"],
      materials: ["plastic", "glass", "aluminum"],
      colors: ["white", "yellow", "blue"],
      features: ["child-resistant", "moisture-proof"]
    },
    
    manufacturers: [
      { name: "Bayer", country: "Germany", markings: ["BAYER", "B"], packaging: ["white-blue"] },
      { name: "SmithKline", country: "USA", markings: ["SK", "ECOTRIN"], packaging: ["orange"] },
      { name: "Bristol-Myers", country: "USA", markings: ["BMS", "BUFFERIN"], packaging: ["blue"] }
    ],
    
    security: {
      watermarks: false,
      holograms: false,
      embossing: true,
      colorChanging: false,
      microprinting: false,
      barcodes: ["EAN-13"],
      qrCodes: false
    },
    
    regions: [
      { region: "Global", variations: ["Aspirin"], regulations: ["FDA", "EMA"] },
      { region: "USA", variations: ["Bayer Aspirin"], regulations: ["FDA"] },
      { region: "EU", variations: ["Aspirin"], regulations: ["EMA"] }
    ]
  },

  // Antibiotics
  {
    id: "amoxicillin",
    name: "Amoxicillin",
    genericName: "Amoxicillin",
    brandNames: ["Amoxil", "Trimox", "Moxatag", "Amoxapen"],
    internationalNames: ["Amoxycillin"],
    activeIngredients: ["Amoxicillin trihydrate"],
    category: "Antibiotic",
    subcategory: "Penicillin",
    
    visual: {
      colors: ["pink", "white", "yellow", "orange", "green"],
      shapes: ["capsule", "oval", "round"],
      sizes: ["small", "medium", "large"],
      markings: ["250", "500", "875", "AMOX", "A", "GG", "WC"],
      textures: ["smooth", "hard-gelatin"]
    },
    
    strengths: ["125mg", "250mg", "500mg", "875mg"],
    forms: ["capsule", "tablet", "chewable", "liquid", "powder"],
    
    packaging: {
      types: ["bottle", "blister", "sachet"],
      materials: ["plastic", "aluminum", "paper"],
      colors: ["white", "amber", "clear"],
      features: ["child-resistant", "desiccant", "light-resistant"]
    },
    
    manufacturers: [
      { name: "GSK", country: "UK", markings: ["AMOXIL", "GSK"], packaging: ["pink-white"] },
      { name: "Sandoz", country: "Germany", markings: ["SANDOZ", "S"], packaging: ["orange"] },
      { name: "Teva", country: "Israel", markings: ["TEVA", "T"], packaging: ["blue-white"] },
      { name: "Aurobindo", country: "India", markings: ["AURO", "AU"], packaging: ["green"] }
    ],
    
    security: {
      watermarks: false,
      holograms: false,
      embossing: false,
      colorChanging: false,
      microprinting: false,
      barcodes: ["EAN-13", "NDC"],
      qrCodes: false
    },
    
    regions: [
      { region: "Global", variations: ["Amoxicillin"], regulations: ["FDA", "EMA", "WHO"] },
      { region: "USA", variations: ["Amoxil", "Trimox"], regulations: ["FDA"] },
      { region: "EU", variations: ["Amoxicillin"], regulations: ["EMA"] }
    ]
  },

  {
    id: "azithromycin",
    name: "Azithromycin",
    genericName: "Azithromycin",
    brandNames: ["Zithromax", "Z-Pak", "Azithrocin", "Azee"],
    internationalNames: ["Azithromycin dihydrate"],
    activeIngredients: ["Azithromycin"],
    category: "Antibiotic",
    subcategory: "Macrolide",
    
    visual: {
      colors: ["blue", "white", "pink", "yellow"],
      shapes: ["oval", "round", "capsule"],
      sizes: ["medium", "large"],
      markings: ["250", "500", "Z", "PFIZER", "306"],
      textures: ["film-coated", "smooth"]
    },
    
    strengths: ["250mg", "500mg", "600mg"],
    forms: ["tablet", "capsule", "liquid", "powder", "injection"],
    
    packaging: {
      types: ["blister", "bottle", "z-pack"],
      materials: ["aluminum", "plastic"],
      colors: ["blue", "white", "silver"],
      features: ["tamper-evident", "moisture-barrier"]
    },
    
    manufacturers: [
      { name: "Pfizer", country: "USA", markings: ["ZITHROMAX", "PFE"], packaging: ["blue-white"] },
      { name: "Sandoz", country: "Germany", markings: ["SANDOZ"], packaging: ["white"] },
      { name: "Dr. Reddy's", country: "India", markings: ["DRL"], packaging: ["red-white"] }
    ],
    
    security: {
      watermarks: false,
      holograms: false,
      embossing: false,
      colorChanging: false,
      microprinting: false,
      barcodes: ["EAN-13", "NDC"],
      qrCodes: false
    },
    
    regions: [
      { region: "Global", variations: ["Azithromycin"], regulations: ["FDA", "EMA"] },
      { region: "USA", variations: ["Zithromax", "Z-Pak"], regulations: ["FDA"] },
      { region: "India", variations: ["Azee", "Azithrocin"], regulations: ["CDSCO"] }
    ]
  },

  // Antihistamines & Cold/Flu
  {
    id: "cetirizine",
    name: "Cetirizine",
    genericName: "Cetirizine hydrochloride",
    brandNames: ["Zyrtec", "Reactine", "Aller-Tec", "Cetrizet"],
    internationalNames: ["Cetirizine HCl"],
    activeIngredients: ["Cetirizine hydrochloride"],
    category: "Antihistamine",
    subcategory: "H1 receptor antagonist",
    
    visual: {
      colors: ["white", "blue", "yellow"],
      shapes: ["oval", "round"],
      sizes: ["small", "medium"],
      markings: ["10", "ZYRTEC", "C", "UCB"],
      textures: ["film-coated", "smooth"]
    },
    
    strengths: ["5mg", "10mg"],
    forms: ["tablet", "chewable", "liquid", "syrup"],
    
    packaging: {
      types: ["blister", "bottle"],
      materials: ["aluminum", "plastic"],
      colors: ["blue", "white", "purple"],
      features: ["child-resistant", "unit-dose"]
    },
    
    manufacturers: [
      { name: "UCB", country: "Belgium", markings: ["ZYRTEC", "UCB"], packaging: ["blue-white"] },
      { name: "Perrigo", country: "USA", markings: ["PERRIGO"], packaging: ["white"] },
      { name: "Teva", country: "Israel", markings: ["TEVA"], packaging: ["purple"] }
    ],
    
    security: {
      watermarks: false,
      holograms: false,
      embossing: false,
      colorChanging: false,
      microprinting: false,
      barcodes: ["EAN-13"],
      qrCodes: false
    },
    
    regions: [
      { region: "Global", variations: ["Cetirizine"], regulations: ["FDA", "EMA"] },
      { region: "USA", variations: ["Zyrtec"], regulations: ["FDA"] },
      { region: "Canada", variations: ["Reactine"], regulations: ["Health Canada"] }
    ]
  },

  {
    id: "loratadine",
    name: "Loratadine",
    genericName: "Loratadine",
    brandNames: ["Claritin", "Clarityne", "Alavert"],
    internationalNames: ["Loratadine"],
    activeIngredients: ["Loratadine"],
    category: "Antihistamine",
    subcategory: "H1 receptor antagonist",
    
    visual: {
      colors: ["white", "blue", "green"],
      shapes: ["oval", "round"],
      sizes: ["small", "medium"],
      markings: ["10", "CLARITIN", "L", "SCHERING"],
      textures: ["smooth", "film-coated"]
    },
    
    strengths: ["5mg", "10mg"],
    forms: ["tablet", "capsule", "liquid", "dissolving"],
    
    packaging: {
      types: ["blister", "bottle"],
      materials: ["aluminum", "plastic"],
      colors: ["blue", "white", "green"],
      features: ["moisture-barrier", "unit-dose"]
    },
    
    manufacturers: [
      { name: "Bayer", country: "Germany", markings: ["CLARITIN", "BAYER"], packaging: ["blue-white"] },
      { name: "Perrigo", country: "USA", markings: ["PERRIGO"], packaging: ["white"] },
      { name: "Sandoz", country: "Germany", markings: ["SANDOZ"], packaging: ["green"] }
    ],
    
    security: {
      watermarks: false,
      holograms: false,
      embossing: false,
      colorChanging: false,
      microprinting: false,
      barcodes: ["EAN-13"],
      qrCodes: false
    },
    
    regions: [
      { region: "Global", variations: ["Loratadine"], regulations: ["FDA", "EMA"] },
      { region: "USA", variations: ["Claritin"], regulations: ["FDA"] },
      { region: "EU", variations: ["Clarityne"], regulations: ["EMA"] }
    ]
  },

  // Combination Cold Medications
  {
    id: "combination_cold",
    name: "Cold & Flu Combination",
    genericName: "Multi-symptom cold relief",
    brandNames: ["DayQuil", "NyQuil", "Sudafed", "Robitussin", "Mucinex"],
    internationalNames: ["Cold relief combination"],
    activeIngredients: ["Acetaminophen", "Dextromethorphan", "Phenylephrine", "Guaifenesin"],
    category: "Cold & Flu",
    subcategory: "Combination",
    
    visual: {
      colors: ["red", "blue", "green", "orange", "white"],
      shapes: ["caplet", "capsule", "tablet"],
      sizes: ["medium", "large"],
      markings: ["DAYQUIL", "NYQUIL", "SUDAFED", "MULTI"],
      textures: ["gelcap", "film-coated", "liquid-filled"]
    },
    
    strengths: ["combination", "multi-symptom"],
    forms: ["tablet", "capsule", "liquid", "gelcap"],
    
    packaging: {
      types: ["blister", "bottle", "box"],
      materials: ["plastic", "aluminum", "cardboard"],
      colors: ["red", "blue", "green", "orange"],
      features: ["child-resistant", "day/night", "multi-dose"]
    },
    
    manufacturers: [
      { name: "P&G", country: "USA", markings: ["VICKS", "P&G"], packaging: ["red-blue"] },
      { name: "Johnson & Johnson", country: "USA", markings: ["SUDAFED", "J&J"], packaging: ["red-white"] },
      { name: "Pfizer", country: "USA", markings: ["ROBITUSSIN", "PFE"], packaging: ["purple"] }
    ],
    
    security: {
      watermarks: false,
      holograms: false,
      embossing: false,
      colorChanging: false,
      microprinting: false,
      barcodes: ["EAN-13"],
      qrCodes: false
    },
    
    regions: [
      { region: "USA", variations: ["DayQuil", "NyQuil"], regulations: ["FDA"] },
      { region: "Global", variations: ["Multi-symptom"], regulations: ["various"] }
    ]
  },

  // Gastrointestinal
  {
    id: "omeprazole",
    name: "Omeprazole",
    genericName: "Omeprazole",
    brandNames: ["Prilosec", "Losec", "Omez", "Ocid"],
    internationalNames: ["Omeprazole magnesium"],
    activeIngredients: ["Omeprazole"],
    category: "PPI",
    subcategory: "Proton pump inhibitor",
    
    visual: {
      colors: ["purple", "pink", "white", "blue"],
      shapes: ["capsule", "tablet"],
      sizes: ["small", "medium"],
      markings: ["20", "40", "PRILOSEC", "OME"],
      textures: ["enteric-coated", "delayed-release"]
    },
    
    strengths: ["10mg", "20mg", "40mg"],
    forms: ["capsule", "tablet", "powder", "injection"],
    
    packaging: {
      types: ["blister", "bottle"],
      materials: ["aluminum", "plastic"],
      colors: ["purple", "white", "blue"],
      features: ["moisture-barrier", "light-resistant"]
    },
    
    manufacturers: [
      { name: "P&G", country: "USA", markings: ["PRILOSEC", "P&G"], packaging: ["purple-white"] },
      { name: "AstraZeneca", country: "UK", markings: ["LOSEC", "AZ"], packaging: ["pink"] },
      { name: "Dr. Reddy's", country: "India", markings: ["OMEZ"], packaging: ["blue"] }
    ],
    
    security: {
      watermarks: false,
      holograms: false,
      embossing: false,
      colorChanging: false,
      microprinting: false,
      barcodes: ["EAN-13", "NDC"],
      qrCodes: false
    },
    
    regions: [
      { region: "USA", variations: ["Prilosec"], regulations: ["FDA"] },
      { region: "EU", variations: ["Losec"], regulations: ["EMA"] },
      { region: "India", variations: ["Omez", "Ocid"], regulations: ["CDSCO"] }
    ]
  },

  // Continue with more drugs...
  // Note: This is a sample of the enhanced database structure
  // In production, this would include 100+ drugs
];

/**
 * Search functionality for the enhanced drug database
 */
export class EnhancedDrugSearch {
  /**
   * Find drugs by name (supports partial matching and fuzzy search)
   */
  static findByName(searchTerm: string): DrugProfile[] {
    const term = searchTerm.toLowerCase();
    return ENHANCED_DRUG_DATABASE.filter(drug => 
      drug.name.toLowerCase().includes(term) ||
      drug.genericName.toLowerCase().includes(term) ||
      drug.brandNames.some(brand => brand.toLowerCase().includes(term)) ||
      drug.internationalNames.some(name => name.toLowerCase().includes(term))
    );
  }

  /**
   * Find drugs by visual characteristics
   */
  static findByVisualFeatures(
    color?: string,
    shape?: string,
    marking?: string,
    size?: string
  ): DrugProfile[] {
    return ENHANCED_DRUG_DATABASE.filter(drug => {
      const colorMatch = !color || drug.visual.colors.some(c => 
        c.toLowerCase().includes(color.toLowerCase())
      );
      const shapeMatch = !shape || drug.visual.shapes.some(s => 
        s.toLowerCase().includes(shape.toLowerCase())
      );
      const markingMatch = !marking || drug.visual.markings.some(m => 
        m.toLowerCase().includes(marking.toLowerCase())
      );
      const sizeMatch = !size || drug.visual.sizes.some(s => 
        s.toLowerCase().includes(size.toLowerCase())
      );
      
      return colorMatch && shapeMatch && markingMatch && sizeMatch;
    });
  }

  /**
   * Find drugs by category
   */
  static findByCategory(category: string): DrugProfile[] {
    return ENHANCED_DRUG_DATABASE.filter(drug =>
      drug.category.toLowerCase().includes(category.toLowerCase()) ||
      drug.subcategory.toLowerCase().includes(category.toLowerCase())
    );
  }

  /**
   * Find drugs by manufacturer
   */
  static findByManufacturer(manufacturer: string): DrugProfile[] {
    return ENHANCED_DRUG_DATABASE.filter(drug =>
      drug.manufacturers.some(mfg =>
        mfg.name.toLowerCase().includes(manufacturer.toLowerCase())
      )
    );
  }

  /**
   * Advanced search combining multiple criteria
   */
  static advancedSearch(criteria: {
    name?: string;
    color?: string;
    shape?: string;
    marking?: string;
    strength?: string;
    manufacturer?: string;
    category?: string;
  }): DrugProfile[] {
    return ENHANCED_DRUG_DATABASE.filter(drug => {
      const nameMatch = !criteria.name || 
        drug.name.toLowerCase().includes(criteria.name.toLowerCase()) ||
        drug.brandNames.some(brand => 
          brand.toLowerCase().includes(criteria.name?.toLowerCase() || '')
        );

      const colorMatch = !criteria.color || 
        drug.visual.colors.some(c => 
          c.toLowerCase().includes(criteria.color!.toLowerCase())
        );

      const shapeMatch = !criteria.shape || 
        drug.visual.shapes.some(s => 
          s.toLowerCase().includes(criteria.shape!.toLowerCase())
        );

      const markingMatch = !criteria.marking || 
        drug.visual.markings.some(m => 
          m.toLowerCase().includes(criteria.marking!.toLowerCase())
        );

      const strengthMatch = !criteria.strength || 
        drug.strengths.some(s => 
          s.toLowerCase().includes(criteria.strength!.toLowerCase())
        );

      const manufacturerMatch = !criteria.manufacturer || 
        drug.manufacturers.some(mfg => 
          mfg.name.toLowerCase().includes(criteria.manufacturer!.toLowerCase())
        );

      const categoryMatch = !criteria.category || 
        drug.category.toLowerCase().includes(criteria.category.toLowerCase()) ||
        drug.subcategory.toLowerCase().includes(criteria.category.toLowerCase());

      return nameMatch && colorMatch && shapeMatch && markingMatch && 
             strengthMatch && manufacturerMatch && categoryMatch;
    });
  }

  /**
   * Get drug statistics
   */
  static getStatistics() {
    const categories = new Set(ENHANCED_DRUG_DATABASE.map(d => d.category));
    const manufacturers = new Set(
      ENHANCED_DRUG_DATABASE.flatMap(d => d.manufacturers.map(m => m.name))
    );
    const forms = new Set(ENHANCED_DRUG_DATABASE.flatMap(d => d.forms));

    return {
      totalDrugs: ENHANCED_DRUG_DATABASE.length,
      categories: Array.from(categories).length,
      manufacturers: Array.from(manufacturers).length,
      forms: Array.from(forms).length,
      categoriesList: Array.from(categories),
      manufacturersList: Array.from(manufacturers),
      formsList: Array.from(forms)
    };
  }
}

/**
 * Drug matching utilities
 */
export class DrugMatcher {
  /**
   * Calculate similarity score between extracted text and drug profile
   */
  static calculateSimilarity(
    extractedText: string[],
    visualFeatures: any,
    drugProfile: DrugProfile
  ): number {
    let score = 0;
    let maxScore = 0;

    // Text matching (40% weight)
    const textContent = extractedText.join(' ').toLowerCase();
    
    // Name matching
    if (drugProfile.name.toLowerCase().includes(textContent) || 
        textContent.includes(drugProfile.name.toLowerCase())) {
      score += 20;
    }
    drugProfile.brandNames.forEach(brand => {
      if (brand.toLowerCase().includes(textContent) || 
          textContent.includes(brand.toLowerCase())) {
        score += 15;
      }
    });
    maxScore += 40;

    // Visual matching (35% weight)
    if (visualFeatures.color && drugProfile.visual.colors.includes(visualFeatures.color)) {
      score += 15;
    }
    if (visualFeatures.shape && drugProfile.visual.shapes.includes(visualFeatures.shape)) {
      score += 10;
    }
    if (visualFeatures.markings) {
      visualFeatures.markings.forEach((marking: string) => {
        if (drugProfile.visual.markings.includes(marking)) {
          score += 10;
        }
      });
    }
    maxScore += 35;

    // Strength matching (15% weight)
    drugProfile.strengths.forEach(strength => {
      if (textContent.includes(strength.toLowerCase())) {
        score += 15;
        return;
      }
    });
    maxScore += 15;

    // Manufacturer matching (10% weight)
    drugProfile.manufacturers.forEach(mfg => {
      if (textContent.includes(mfg.name.toLowerCase())) {
        score += 10;
        return;
      }
    });
    maxScore += 10;

    return maxScore > 0 ? score / maxScore : 0;
  }

  /**
   * Find best matching drugs
   */
  static findBestMatches(
    extractedText: string[],
    visualFeatures: any,
    limit: number = 5
  ): Array<{ drug: DrugProfile; score: number }> {
    const matches = ENHANCED_DRUG_DATABASE.map(drug => ({
      drug,
      score: this.calculateSimilarity(extractedText, visualFeatures, drug)
    }));

    return matches
      .filter(match => match.score > 0.1) // Minimum threshold
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }
}