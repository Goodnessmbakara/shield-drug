// Drug Detection System Configuration
export const DRUG_DETECTION_CONFIG = {
  // Model Configuration
  models: {
    mobilenet: {
      url: 'https://tfhub.dev/google/imagenet/mobilenet_v2_100_224/classification/2',
      inputSize: 224,
      normalization: '0-1', // [0,1] range
      timeout: 10000, // 10 seconds
      retryAttempts: 3,
      warmupEnabled: true
    },
    cocoSsd: {
      base: 'lite_mobilenet_v2',
      maxDetections: 10,
      minConfidence: 0.3,
      timeout: 8000, // 8 seconds
      warmupEnabled: true
    },
    tesseract: {
      language: 'eng',
      timeout: 15000, // 15 seconds
      confidenceThreshold: 0.3,
      maxTextLength: 1000
    }
  },

  // Image Processing
  image: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    supportedFormats: ['image/jpeg', 'image/png', 'image/webp'],
    resizeDimensions: {
      width: 224,
      height: 224
    },
    quality: {
      jpeg: 0.8,
      webp: 0.8
    },
    preprocessing: {
      enableDenoising: true,
      enableSharpening: true,
      enableContrastEnhancement: true,
      enableDeskewing: true
    }
  },

  // Classification Thresholds
  classification: {
    pharmaceutical: {
      minConfidence: 0.3,
      preferredMethods: ['coco-ssd', 'mobilenet', 'heuristic'],
      fallbackThreshold: 0.2
    },
    rejection: {
      minConfidence: 0.8,
      maxProcessingTime: 15000 // 15 seconds
    }
  },

  // Drug Identification
  identification: {
    confidence: {
      high: 0.8,
      medium: 0.6,
      low: 0.4,
      minimum: 0.2
    },
    patterns: {
      drugNames: [
        'paracetamol', 'acetaminophen', 'ibuprofen', 'amoxicillin', 'aspirin',
        'levocetirizine', 'ambroxol', 'phenylephrine', 'tylenol', 'panadol',
        'advil', 'motrin', 'nurofen', 'amoxil', 'trimox', 'xyzal', 'levocet'
      ],
      strengths: [
        '250mg', '325mg', '500mg', '650mg', '1000mg',
        '200mg', '400mg', '600mg', '800mg', '875mg'
      ],
      manufacturers: [
        'gsk', 'pfizer', 'johnson', 'bayer', 'sandoz', 'teva',
        'novartis', 'merck', 'astrazeneca', 'generic'
      ],
      dosageForms: [
        'tablet', 'capsule', 'pill', 'oral', 'liquid', 'suspension',
        'syrup', 'injection', 'cream', 'ointment'
      ]
    }
  },

  // Authenticity Assessment
  authenticity: {
    riskFactors: {
      lowImageQuality: 0.2,
      missingText: 0.2,
      noExpiryDate: 0.1,
      noBatchNumber: 0.1,
      suspiciousColor: 0.15,
      irregularShape: 0.15,
      lowConfidence: 0.3
    },
    thresholds: {
      authentic: 0.3,
      suspicious: 0.6,
      counterfeit: 0.8
    }
  },

  // Performance Optimization
  performance: {
    enableGPU: true,
    enableParallelProcessing: true,
    maxConcurrentAnalyses: 3,
    memoryManagement: {
      enableTensorDisposal: true,
      enableGarbageCollection: true,
      maxTensorMemory: 100 * 1024 * 1024 // 100MB
    },
    caching: {
      enableModelCache: true,
      enableResultCache: true,
      cacheExpiry: 3600000 // 1 hour
    }
  },

  // Error Handling
  errorHandling: {
    maxRetries: 3,
    retryDelay: 1000, // 1 second
    fallbackStrategies: ['heuristic', 'basic', 'none'],
    timeoutHandling: 'graceful',
    logLevel: 'info'
  },

  // Security & Privacy
  security: {
    enableImageValidation: true,
    maxImageDimensions: 4096,
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],
    enableContentScanning: true,
    dataRetention: {
      images: 24 * 60 * 60 * 1000, // 24 hours
      results: 30 * 24 * 60 * 60 * 1000, // 30 days
      metadata: 90 * 24 * 60 * 60 * 1000 // 90 days
    }
  },

  // Monitoring & Analytics
  monitoring: {
    enablePerformanceTracking: true,
    enableErrorTracking: true,
    enableUsageAnalytics: true,
    metrics: {
      processingTime: true,
      accuracy: true,
      throughput: true,
      errorRate: true
    }
  }
};

// Environment-specific overrides
export const getConfig = () => {
  const env = process.env.NODE_ENV || 'development';
  
  if (env === 'production') {
    return {
      ...DRUG_DETECTION_CONFIG,
      performance: {
        ...DRUG_DETECTION_CONFIG.performance,
        maxConcurrentAnalyses: 5,
        enableGPU: true
      },
      security: {
        ...DRUG_DETECTION_CONFIG.security,
        enableContentScanning: true
      }
    };
  }
  
  if (env === 'development') {
    return {
      ...DRUG_DETECTION_CONFIG,
      performance: {
        ...DRUG_DETECTION_CONFIG.performance,
        maxConcurrentAnalyses: 1,
        enableGPU: false
      },
      monitoring: {
        ...DRUG_DETECTION_CONFIG.monitoring,
        enablePerformanceTracking: true,
        enableErrorTracking: true
      }
    };
  }
  
  return DRUG_DETECTION_CONFIG;
};

// Utility functions
export const isPharmaceuticalObject = (className: string): boolean => {
  const pharmaTerms = [
    'pill', 'tablet', 'capsule', 'medicine', 'drug', 'pharmaceutical',
    'bottle', 'container', 'package', 'box', 'blister', 'pack',
    'vial', 'ampoule', 'syringe', 'inhaler', 'stethoscope'
  ];
  
  return pharmaTerms.some(term => 
    className.toLowerCase().includes(term)
  );
};

export const calculateConfidence = (scores: number[], weights: number[]): number => {
  if (scores.length !== weights.length || scores.length === 0) {
    return 0;
  }
  
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  if (totalWeight === 0) return 0;
  
  const weightedSum = scores.reduce((sum, score, index) => 
    sum + (score * weights[index]), 0
  );
  
  return Math.min(weightedSum / totalWeight, 1.0);
};

export const validateImageFile = (file: File): { valid: boolean; error?: string } => {
  // Check file size
  if (file.size > DRUG_DETECTION_CONFIG.image.maxFileSize) {
    return {
      valid: false,
      error: `File size exceeds ${DRUG_DETECTION_CONFIG.image.maxFileSize / (1024 * 1024)}MB limit`
    };
  }
  
  // Check file type
  if (!DRUG_DETECTION_CONFIG.image.supportedFormats.includes(file.type)) {
    return {
      valid: false,
      error: `Unsupported file type. Supported formats: ${DRUG_DETECTION_CONFIG.image.supportedFormats.join(', ')}`
    };
  }
  
  return { valid: true };
};

export default DRUG_DETECTION_CONFIG;
