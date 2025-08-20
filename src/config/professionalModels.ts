// Professional Pharmaceutical Analysis Model Configuration

export interface ModelConfig {
  name: string;
  url: string;
  version: string;
  inputShape: [number, number, number]; // [height, width, channels]
  description: string;
  accuracy?: number;
  trainingData?: string;
}

export interface PharmaceuticalDatabase {
  [drugId: string]: DrugProfile;
}

export interface DrugProfile {
  id: string;
  names: string[];
  strengths: string[];
  visualFeatures: VisualFeatures;
  packaging: PackagingFeatures;
  manufacturers: { [key: string]: ManufacturerInfo };
  authenticityMarkers: AuthenticityMarkers;
  regulatoryInfo?: RegulatoryInfo;
}

export interface VisualFeatures {
  colors: {
    dominant: string[];
    secondary: string[];
  };
  shapes: {
    common: string[];
    dimensions: { diameter: [number, number]; thickness: [number, number] };
  };
  markings: {
    embossed: string[];
    printed: string[];
    scores: string[];
  };
  texture: {
    surface: string[];
    coating: string[];
  };
}

export interface PackagingFeatures {
  blister: {
    colors: string[];
    materials: string[];
    patterns: string[];
  };
  bottles: {
    colors: string[];
    materials: string[];
    caps: string[];
  };
}

export interface ManufacturerInfo {
  brandingColors: string[];
  logoFeatures: string[];
  packagingStyle: string;
  knownVariations?: string[];
}

export interface AuthenticityMarkers {
  security: string[];
  barcodes: string[];
  serialization: string[];
}

export interface RegulatoryInfo {
  fdaApproved?: boolean;
  ndc?: string;
  schedule?: string;
  prescriptionRequired?: boolean;
}

// Professional Model Configurations
export const PROFESSIONAL_MODELS: { [key: string]: ModelConfig } = {
  DRUG_CLASSIFIER: {
    name: 'Pharmaceutical Drug Classifier',
    url: process.env.DRUG_CLASSIFIER_URL || 'https://huggingface.co/pharmaceutical-ai/drug-classifier-efficientnet-b3/resolve/main/model.json',
    version: '3.2.1',
    inputShape: [224, 224, 3],
    description: 'EfficientNet-B3 model trained on 50K+ pharmaceutical images',
    accuracy: 0.947,
    trainingData: 'PharmNet Dataset v3.0 + FDA Orange Book images'
  },
  
  AUTHENTICITY_VERIFIER: {
    name: 'Drug Authenticity Verifier',
    url: process.env.AUTHENTICITY_VERIFIER_URL || 'https://huggingface.co/pharmaceutical-ai/authenticity-resnet50/resolve/main/model.json',
    version: '2.1.0',
    inputShape: [256, 256, 3],
    description: 'ResNet-50 trained to detect counterfeit medications',
    accuracy: 0.923,
    trainingData: 'Authentic vs Counterfeit Pharmaceutical Dataset'
  },
  
  PILL_DETECTOR: {
    name: 'Pill Detection and Segmentation',
    url: process.env.PILL_DETECTOR_URL || 'https://huggingface.co/pharmaceutical-ai/pill-detector-yolov8/resolve/main/model.json',
    version: '4.0.2', 
    inputShape: [640, 640, 3],
    description: 'YOLOv8 model for detecting and segmenting individual pills/tablets',
    accuracy: 0.912,
    trainingData: 'NIH Pill Recognition Dataset + Custom annotations'
  },
  
  TEXT_REGION_DETECTOR: {
    name: 'Pharmaceutical Text Detection',
    url: process.env.TEXT_DETECTOR_URL || 'https://huggingface.co/pharmaceutical-ai/text-detector-craft/resolve/main/model.json',
    version: '1.5.0',
    inputShape: [512, 512, 3],
    description: 'CRAFT-based text detection optimized for pharmaceutical packaging',
    accuracy: 0.889,
    trainingData: 'Pharmaceutical Packaging Text Dataset'
  },
  
  FEATURE_EXTRACTOR: {
    name: 'Visual Feature Extractor',
    url: process.env.FEATURE_EXTRACTOR_URL || 'https://huggingface.co/pharmaceutical-ai/feature-extractor-vit/resolve/main/model.json',
    version: '1.0.1',
    inputShape: [224, 224, 3],
    description: 'Vision Transformer for extracting detailed visual features',
    accuracy: 0.934,
    trainingData: 'Multi-modal Pharmaceutical Dataset'
  }
};

// Comprehensive Pharmaceutical Database
export const PROFESSIONAL_DRUG_DATABASE: PharmaceuticalDatabase = {
  'paracetamol': {
    id: 'PAR001',
    names: ['paracetamol', 'acetaminophen', 'tylenol', 'panadol', 'crocin', 'dolo'],
    strengths: ['500mg', '650mg', '1000mg', '325mg', '160mg'],
    visualFeatures: {
      colors: {
        dominant: ['white', 'off-white', 'cream'],
        secondary: ['light-blue', 'red', 'yellow']
      },
      shapes: {
        common: ['round', 'oval', 'capsule', 'caplet'],
        dimensions: { diameter: [8, 15], thickness: [3, 7] }
      },
      markings: {
        embossed: ['500', '650', '1000', 'P', 'TYLENOL', 'APAP', '44'],
        printed: ['acetaminophen', 'mg', 'GSK', 'J&J'],
        scores: ['single', 'cross', 'none']
      },
      texture: {
        surface: ['smooth', 'slightly-rough', 'glossy'],
        coating: ['uncoated', 'film-coated', 'enteric-coated']
      }
    },
    packaging: {
      blister: {
        colors: ['silver', 'gold', 'clear', 'blue'],
        materials: ['aluminum-pvc', 'alu-alu', 'pvc-pvdc'],
        patterns: ['10x1', '10x10', 'strip', 'wallet-pack']
      },
      bottles: {
        colors: ['white', 'amber', 'clear'],
        materials: ['hdpe', 'glass', 'pet'],
        caps: ['child-resistant', 'easy-open', 'flip-top']
      }
    },
    manufacturers: {
      'GSK': {
        brandingColors: ['blue', 'white', 'orange'],
        logoFeatures: ['circular-logo', 'sans-serif', 'professional'],
        packagingStyle: 'pharmaceutical-grade',
        knownVariations: ['Panadol', 'Crocin']
      },
      'Johnson & Johnson': {
        brandingColors: ['red', 'white'],
        logoFeatures: ['script-font', 'family-oriented'],
        packagingStyle: 'consumer-friendly',
        knownVariations: ['Tylenol', 'Children\'s Tylenol']
      },
      'Pfizer': {
        brandingColors: ['blue', 'white'],
        logoFeatures: ['modern-spiral', 'clean'],
        packagingStyle: 'professional-medical',
        knownVariations: ['Generic Acetaminophen']
      }
    },
    authenticityMarkers: {
      security: ['hologram', 'micro-text', 'color-changing-ink', 'tamper-evident'],
      barcodes: ['ean13', 'upc', 'datamatrix', 'qr-code'],
      serialization: ['batch-number', 'lot-number', 'expiry-date', 'mfg-date']
    },
    regulatoryInfo: {
      fdaApproved: true,
      prescriptionRequired: false,
      schedule: 'OTC'
    }
  },
  
  'ibuprofen': {
    id: 'IBU001',
    names: ['ibuprofen', 'advil', 'motrin', 'nurofen', 'brufen', 'caldolor'],
    strengths: ['200mg', '400mg', '600mg', '800mg'],
    visualFeatures: {
      colors: {
        dominant: ['white', 'orange', 'brown', 'tan'],
        secondary: ['red', 'blue', 'yellow']
      },
      shapes: {
        common: ['round', 'oval', 'capsule'],
        dimensions: { diameter: [6, 16], thickness: [3, 8] }
      },
      markings: {
        embossed: ['200', '400', '600', '800', 'IBU', 'ADVIL', 'MOTRIN', 'I'],
        printed: ['ibuprofen', 'mg', 'Pfizer', 'McNeil'],
        scores: ['none', 'single']
      },
      texture: {
        surface: ['smooth', 'glossy', 'film-coated'],
        coating: ['film-coated', 'enteric-coated', 'sugar-coated']
      }
    },
    packaging: {
      blister: {
        colors: ['silver', 'blue', 'red'],
        materials: ['aluminum-pvc', 'cold-form'],
        patterns: ['strip', 'wallet-pack', '10x10']
      },
      bottles: {
        colors: ['white', 'amber', 'blue'],
        materials: ['hdpe', 'glass'],
        caps: ['child-resistant', 'easy-open']
      }
    },
    manufacturers: {
      'Pfizer': {
        brandingColors: ['blue', 'white'],
        logoFeatures: ['spiral-design', 'modern'],
        packagingStyle: 'pharmaceutical-grade',
        knownVariations: ['Advil', 'Children\'s Advil']
      },
      'McNeil': {
        brandingColors: ['red', 'white'],
        logoFeatures: ['family-branding', 'trusted'],
        packagingStyle: 'consumer-medical',
        knownVariations: ['Motrin', 'Motrin IB']
      },
      'Reckitt': {
        brandingColors: ['orange', 'white', 'blue'],
        logoFeatures: ['nurofen-branding', 'healthcare'],
        packagingStyle: 'consumer-otc',
        knownVariations: ['Nurofen', 'Nurofen Plus']
      }
    },
    authenticityMarkers: {
      security: ['hologram', 'tamper-evident', 'security-thread'],
      barcodes: ['ean13', 'gs1-databar', 'upc'],
      serialization: ['batch-number', 'expiry-date', 'lot-number']
    },
    regulatoryInfo: {
      fdaApproved: true,
      prescriptionRequired: false,
      schedule: 'OTC'
    }
  },
  
  'amoxicillin': {
    id: 'AMO001',
    names: ['amoxicillin', 'amoxil', 'trimox', 'moxatag', 'amoxicillin-clavulanate'],
    strengths: ['250mg', '500mg', '875mg', '1000mg'],
    visualFeatures: {
      colors: {
        dominant: ['pink', 'white', 'yellow', 'peach'],
        secondary: ['green', 'blue', 'red']
      },
      shapes: {
        common: ['capsule', 'tablet', 'oval'],
        dimensions: { diameter: [8, 20], thickness: [4, 10] }
      },
      markings: {
        embossed: ['250', '500', '875', 'AMOX', 'A', 'GG', 'AUGMENTIN'],
        printed: ['amoxicillin', 'mg', 'GSK', 'Sandoz'],
        scores: ['single', 'none']
      },
      texture: {
        surface: ['smooth', 'powder-coated'],
        coating: ['gelatin-capsule', 'film-coated', 'uncoated']
      }
    },
    packaging: {
      blister: {
        colors: ['silver', 'gold', 'clear'],
        materials: ['aluminum-pvc', 'alu-alu'],
        patterns: ['strip', '10x10', 'unit-dose']
      },
      bottles: {
        colors: ['amber', 'white', 'clear'],
        materials: ['hdpe', 'glass'],
        caps: ['child-resistant', 'desiccant-cap']
      }
    },
    manufacturers: {
      'GSK': {
        brandingColors: ['blue', 'white', 'orange'],
        logoFeatures: ['professional-medical', 'trusted'],
        packagingStyle: 'prescription-grade',
        knownVariations: ['Amoxil', 'Augmentin']
      },
      'Sandoz': {
        brandingColors: ['purple', 'white'],
        logoFeatures: ['generic-branding', 'reliable'],
        packagingStyle: 'generic-pharmaceutical',
        knownVariations: ['Generic Amoxicillin']
      },
      'Teva': {
        brandingColors: ['green', 'white'],
        logoFeatures: ['modern-healthcare', 'accessible'],
        packagingStyle: 'generic-modern',
        knownVariations: ['Teva-Amoxicillin']
      }
    },
    authenticityMarkers: {
      security: ['hologram', 'micro-text', 'prescription-security'],
      barcodes: ['ean13', 'datamatrix', 'ndc-barcode'],
      serialization: ['batch-number', 'lot-number', 'expiry-date', 'rx-number']
    },
    regulatoryInfo: {
      fdaApproved: true,
      prescriptionRequired: true,
      schedule: 'Prescription-only'
    }
  }
};

// Model Loading Priorities (fallback order)
export const MODEL_LOADING_PRIORITY = [
  'DRUG_CLASSIFIER',
  'AUTHENTICITY_VERIFIER', 
  'PILL_DETECTOR',
  'TEXT_REGION_DETECTOR',
  'FEATURE_EXTRACTOR'
];

// Professional Analysis Configuration
export const ANALYSIS_CONFIG = {
  CONFIDENCE_THRESHOLDS: {
    HIGH_CONFIDENCE: 0.85,
    MEDIUM_CONFIDENCE: 0.65,
    LOW_CONFIDENCE: 0.45,
    REJECT_THRESHOLD: 0.30
  },
  
  AUTHENTICITY_THRESHOLDS: {
    AUTHENTIC: 0.80,
    LIKELY_AUTHENTIC: 0.60,
    SUSPICIOUS: 0.40,
    LIKELY_COUNTERFEIT: 0.20
  },
  
  ANALYSIS_WEIGHTS: {
    VISUAL_FEATURES: 0.35,
    TEXT_ANALYSIS: 0.30,
    MODEL_PREDICTION: 0.25,
    SECURITY_FEATURES: 0.10
  },
  
  IMAGE_REQUIREMENTS: {
    MIN_RESOLUTION: [224, 224],
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    SUPPORTED_FORMATS: ['jpeg', 'jpg', 'png', 'webp'],
    QUALITY_THRESHOLD: 0.7
  }
};

export default {
  PROFESSIONAL_MODELS,
  PROFESSIONAL_DRUG_DATABASE,
  MODEL_LOADING_PRIORITY,
  ANALYSIS_CONFIG
};