
/**
 * Environment Configuration Management for Professional Drug Analysis
 * Centralized configuration for all model URLs, API keys, and system settings
 */

interface ModelConfig {
  url: string;
  timeout: number;
  retryCount: number;
  confidenceThreshold: number;
}

interface APIProviderConfig {
  apiKey: string;
  endpoint: string;
  timeout: number;
  enabled: boolean;
}

interface TrainingConfig {
  dataPath: string;
  outputPath: string;
  batchSize: number;
  epochs: number;
  learningRate: number;
  useGPU: boolean;
}

interface SecurityConfig {
  maxImageSize: number;
  allowedImageTypes: string[];
  enableImageValidation: boolean;
  rateLimitRequests: number;
  rateLimitWindow: number;
}

class EnvironmentConfigManager {
  // Model URLs and configurations
  readonly models: {
    drugClassifier: ModelConfig;
    authenticityVerifier: ModelConfig;
    pillDetector: ModelConfig;
    textDetector: ModelConfig;
  };

  // Cloud API providers
  readonly cloudProviders: {
    huggingface: APIProviderConfig;
    googleVision: APIProviderConfig;
    azureVision: APIProviderConfig;
    awsRekognition: APIProviderConfig;
    openaiVision: APIProviderConfig;
    pharmaSpecialist: APIProviderConfig;
  };

  // Training configuration
  readonly training: TrainingConfig;

  // Security settings
  readonly security: SecurityConfig;

  // Analysis settings
  readonly analysis: {
    modelTimeout: number;
    professionalTimeout: number;
    minDrugConfidence: number;
    minAuthenticityConfidence: number;
    minSafetyConfidence: number;
    useCloudFallback: boolean;
    useHuggingFaceFallback: boolean;
    useLocalFallback: boolean;
    enableOfflineMode: boolean;
    legacyApiFormat: boolean;
  };

  // Database settings
  readonly database: {
    pharmaDbUrl: string;
    pharmaDbUsername: string;
    pharmaDbPassword: string;
    fdaOrangeBookApi: string;
    nihPillboxApi: string;
    pharmaceuticalDatasetEndpoint: string;
  };

  // Development settings
  readonly development: {
    debugDrugAnalysis: boolean;
    debugModelLoading: boolean;
    debugApiRequests: boolean;
    verboseLogging: boolean;
    enableTestMode: boolean;
    testModelUrls: boolean;
    mockApiResponses: boolean;
  };

  // Monitoring settings
  readonly monitoring: {
    enablePerformanceMetrics: boolean;
    metricsEndpoint: string;
    healthCheckEnabled: boolean;
    healthCheckInterval: number;
    alertOnModelFailure: boolean;
    alertOnLowConfidence: boolean;
    alertEmail: string;
  };

  constructor() {
    // Load and validate environment variables
    this.validateEnvironmentVariables();

    // Initialize model configurations
    this.models = {
      drugClassifier: {
        url: process.env.DRUG_CLASSIFIER_MODEL_URL || 'https://storage.googleapis.com/pharmaceutical-models/efficientnet-b3-drug-classifier/model.json',
        timeout: parseInt(process.env.MODEL_DOWNLOAD_TIMEOUT || '120000'),
        retryCount: parseInt(process.env.MODEL_DOWNLOAD_RETRY_COUNT || '3'),
        confidenceThreshold: parseFloat(process.env.MIN_DRUG_CONFIDENCE || '0.3')
      },
      authenticityVerifier: {
        url: process.env.AUTHENTICITY_MODEL_URL || 'https://storage.googleapis.com/pharmaceutical-models/resnet50-authenticity/model.json',
        timeout: parseInt(process.env.MODEL_DOWNLOAD_TIMEOUT || '120000'),
        retryCount: parseInt(process.env.MODEL_DOWNLOAD_RETRY_COUNT || '3'),
        confidenceThreshold: parseFloat(process.env.MIN_AUTHENTICITY_CONFIDENCE || '0.5')
      },
      pillDetector: {
        url: process.env.PILL_DETECTOR_MODEL_URL || 'https://storage.googleapis.com/pharmaceutical-models/yolov5-pill-detector/model.json',
        timeout: parseInt(process.env.MODEL_DOWNLOAD_TIMEOUT || '120000'),
        retryCount: parseInt(process.env.MODEL_DOWNLOAD_RETRY_COUNT || '3'),
        confidenceThreshold: parseFloat(process.env.MIN_SAFETY_CONFIDENCE || '0.4')
      },
      textDetector: {
        url: process.env.TEXT_DETECTOR_MODEL_URL || 'https://storage.googleapis.com/pharmaceutical-models/text-detection/model.json',
        timeout: parseInt(process.env.MODEL_DOWNLOAD_TIMEOUT || '120000'),
        retryCount: parseInt(process.env.MODEL_DOWNLOAD_RETRY_COUNT || '3'),
        confidenceThreshold: 0.5
      }
    };

    // Initialize cloud provider configurations
    this.cloudProviders = {
      huggingface: {
        apiKey: process.env.HUGGINGFACE_API_KEY || '',
        endpoint: 'https://api-inference.huggingface.co/models/',
        timeout: parseInt(process.env.HUGGINGFACE_API_TIMEOUT || '45000'),
        enabled: !!process.env.HUGGINGFACE_API_KEY
      },
      googleVision: {
        apiKey: process.env.GOOGLE_CLOUD_API_KEY || '',
        endpoint: 'https://vision.googleapis.com/v1/images:annotate',
        timeout: parseInt(process.env.CLOUD_API_TIMEOUT || '30000'),
        enabled: !!process.env.GOOGLE_CLOUD_API_KEY
      },
      azureVision: {
        apiKey: process.env.AZURE_VISION_API_KEY || '',
        endpoint: process.env.AZURE_VISION_ENDPOINT || 'https://eastus.api.cognitive.microsoft.com/vision/v3.2',
        timeout: parseInt(process.env.CLOUD_API_TIMEOUT || '30000'),
        enabled: !!process.env.AZURE_VISION_API_KEY
      },
      awsRekognition: {
        apiKey: process.env.AWS_ACCESS_KEY_ID || '',
        endpoint: 'https://rekognition.us-east-1.amazonaws.com/',
        timeout: parseInt(process.env.CLOUD_API_TIMEOUT || '30000'),
        enabled: !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY)
      },
      openaiVision: {
        apiKey: process.env.OPENAI_API_KEY || '',
        endpoint: 'https://api.openai.com/v1/chat/completions',
        timeout: parseInt(process.env.CLOUD_API_TIMEOUT || '30000'),
        enabled: !!process.env.OPENAI_API_KEY
      },
      pharmaSpecialist: {
        apiKey: process.env.PHARMA_API_KEY || '',
        endpoint: process.env.PHARMA_API_ENDPOINT || '',
        timeout: parseInt(process.env.CLOUD_API_TIMEOUT || '30000'),
        enabled: !!(process.env.PHARMA_API_KEY && process.env.PHARMA_API_ENDPOINT)
      }
    };

    // Initialize training configuration
    this.training = {
      dataPath: process.env.TRAINING_DATA_PATH || './data/pharmaceutical_images',
      outputPath: process.env.MODEL_OUTPUT_PATH || './models',
      batchSize: parseInt(process.env.TRAINING_BATCH_SIZE || '32'),
      epochs: parseInt(process.env.TRAINING_EPOCHS || '100'),
      learningRate: parseFloat(process.env.TRAINING_LEARNING_RATE || '0.001'),
      useGPU: process.env.USE_GPU_TRAINING === 'true'
    };

    // Initialize security configuration
    this.security = {
      maxImageSize: parseInt(process.env.MAX_IMAGE_SIZE || '10485760'), // 10MB
      allowedImageTypes: (process.env.ALLOWED_IMAGE_TYPES || 'image/jpeg,image/png,image/bmp,image/webp').split(','),
      enableImageValidation: process.env.ENABLE_IMAGE_VALIDATION !== 'false',
      rateLimitRequests: parseInt(process.env.API_RATE_LIMIT_REQUESTS || '100'),
      rateLimitWindow: parseInt(process.env.API_RATE_LIMIT_WINDOW_MS || '3600000')
    };

    // Initialize analysis configuration
    this.analysis = {
      modelTimeout: parseInt(process.env.AI_MODEL_TIMEOUT || '60000'),
      professionalTimeout: parseInt(process.env.PROFESSIONAL_ANALYSIS_TIMEOUT || '300000'),
      minDrugConfidence: parseFloat(process.env.MIN_DRUG_CONFIDENCE || '0.3'),
      minAuthenticityConfidence: parseFloat(process.env.MIN_AUTHENTICITY_CONFIDENCE || '0.5'),
      minSafetyConfidence: parseFloat(process.env.MIN_SAFETY_CONFIDENCE || '0.4'),
      useCloudFallback: process.env.USE_CLOUD_FALLBACK !== 'false',
      useHuggingFaceFallback: process.env.USE_HUGGINGFACE_FALLBACK !== 'false',
      useLocalFallback: process.env.USE_LOCAL_FALLBACK !== 'false',
      enableOfflineMode: process.env.ENABLE_OFFLINE_MODE === 'true',
      legacyApiFormat: process.env.AI_API_LEGACY_FORMAT === 'true'
    };

    // Initialize database configuration
    this.database = {
      pharmaDbUrl: process.env.PHARMA_DB_URL || '',
      pharmaDbUsername: process.env.PHARMA_DB_USERNAME || '',
      pharmaDbPassword: process.env.PHARMA_DB_PASSWORD || '',
      fdaOrangeBookApi: process.env.FDA_ORANGE_BOOK_API || 'https://api.fda.gov/drug/label.json',
      nihPillboxApi: process.env.NIH_PILLBOX_API || 'https://pillbox.nlm.nih.gov/API',
      pharmaceuticalDatasetEndpoint: process.env.PHARMACEUTICAL_DATASET_ENDPOINT || ''
    };

    // Initialize development configuration
    this.development = {
      debugDrugAnalysis: process.env.DEBUG_DRUG_ANALYSIS === 'true',
      debugModelLoading: process.env.DEBUG_MODEL_LOADING === 'true',
      debugApiRequests: process.env.DEBUG_API_REQUESTS === 'true',
      verboseLogging: process.env.VERBOSE_LOGGING === 'true',
      enableTestMode: process.env.ENABLE_TEST_MODE === 'true',
      testModelUrls: process.env.TEST_MODEL_URLS === 'true',
      mockApiResponses: process.env.MOCK_API_RESPONSES === 'true'
    };

    // Initialize monitoring configuration
    this.monitoring = {
      enablePerformanceMetrics: process.env.ENABLE_PERFORMANCE_METRICS !== 'false',
      metricsEndpoint: process.env.METRICS_ENDPOINT || '',
      healthCheckEnabled: process.env.HEALTH_CHECK_ENABLED !== 'false',
      healthCheckInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL || '300000'),
      alertOnModelFailure: process.env.ALERT_ON_MODEL_FAILURE === 'true',
      alertOnLowConfidence: process.env.ALERT_ON_LOW_CONFIDENCE === 'true',
      alertEmail: process.env.ALERT_EMAIL || ''
    };
  }

  private validateEnvironmentVariables(): void {
    const criticalEnvVars: string[] = [
      // Add critical environment variables that must be present
    ];

    const missingVars = criticalEnvVars.filter(varName => !process.env[varName]);

    if (missingVars.length > 0) {
      console.warn('Missing critical environment variables:', missingVars);
      console.warn('Some features may not work correctly. Please check your .env file.');
    }
  }

  /**
   * Get the best available model URL based on configuration
   */
  getBestModelUrl(modelType: keyof typeof this.models): string {
    const model = this.models[modelType];
    
    if (this.development.testModelUrls && model.url.startsWith('http')) {
      // In test mode, you might want to use local or test model URLs
      console.log(`Using configured model URL for ${modelType}: ${model.url}`);
    }
    
    return model.url;
  }

  /**
   * Get enabled cloud providers
   */
  getEnabledCloudProviders(): string[] {
    return Object.entries(this.cloudProviders)
      .filter(([_, config]) => config.enabled)
      .map(([name]) => name);
  }

  /**
   * Check if a specific cloud provider is available
   */
  isCloudProviderEnabled(provider: keyof typeof this.cloudProviders): boolean {
    return this.cloudProviders[provider].enabled;
  }

  /**
   * Get configuration summary for debugging
   */
  getConfigurationSummary(): object {
    return {
      models: {
        drugClassifier: { url: this.models.drugClassifier.url.substring(0, 50) + '...', enabled: true },
        authenticityVerifier: { url: this.models.authenticityVerifier.url.substring(0, 50) + '...', enabled: true },
        pillDetector: { url: this.models.pillDetector.url.substring(0, 50) + '...', enabled: true },
        textDetector: { url: this.models.textDetector.url.substring(0, 50) + '...', enabled: true }
      },
      cloudProviders: Object.fromEntries(
        Object.entries(this.cloudProviders).map(([name, config]) => [
          name,
          { enabled: config.enabled, hasApiKey: !!config.apiKey }
        ])
      ),
      analysis: {
        timeouts: {
          model: this.analysis.modelTimeout,
          professional: this.analysis.professionalTimeout
        },
        fallbacks: {
          cloud: this.analysis.useCloudFallback,
          huggingface: this.analysis.useHuggingFaceFallback,
          local: this.analysis.useLocalFallback
        }
      },
      development: this.development,
      security: {
        maxImageSize: `${(this.security.maxImageSize / 1024 / 1024).toFixed(1)}MB`,
        allowedTypes: this.security.allowedImageTypes.length,
        rateLimiting: this.security.rateLimitRequests > 0
      }
    };
  }

  /**
   * Validate model URLs
   */
  async validateModelUrls(): Promise<{ [key: string]: boolean }> {
    const results: { [key: string]: boolean } = {};
    
    for (const [modelName, config] of Object.entries(this.models)) {
      try {
        const response = await fetch(config.url, { method: 'HEAD' });
        results[modelName] = response.ok;
      } catch (error) {
        results[modelName] = false;
      }
    }
    
    return results;
  }

  /**
   * Test cloud provider connectivity
   */
  async testCloudProviders(): Promise<{ [key: string]: boolean }> {
    const results: { [key: string]: boolean } = {};
    
    for (const [providerName, config] of Object.entries(this.cloudProviders)) {
      if (!config.enabled) {
        results[providerName] = false;
        continue;
      }
      
      try {
        // Simple connectivity test
        const controller = new AbortController();
        setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(config.endpoint, {
          method: 'HEAD',
          signal: controller.signal
        });
        
        results[providerName] = response.status < 500; // Accept auth errors but not server errors
      } catch (error) {
        results[providerName] = false;
      }
    }
    
    return results;
  }
}

// Export singleton instance
export const environmentConfig = new EnvironmentConfigManager();

// Export configuration types for use in other modules
export type {
  ModelConfig,
  APIProviderConfig,
  TrainingConfig,
  SecurityConfig
};