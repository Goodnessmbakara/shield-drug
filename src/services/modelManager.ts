/**
 * Model Management Service
 * Handles loading, caching, and management of all AI models based on environment configuration
 */

import * as tf from '@tensorflow/tfjs';
import { environmentConfig } from '@/config/environmentConfig';

interface ModelMetadata {
  name: string;
  url: string;
  loaded: boolean;
  loadTime?: number;
  size?: number;
  lastUsed?: Date;
  version?: string;
  checksum?: string;
}

interface ModelPerformance {
  averageInferenceTime: number;
  totalInferences: number;
  successRate: number;
  lastError?: string;
}

class ModelManager {
  private models: Map<string, tf.GraphModel | tf.LayersModel> = new Map();
  private modelMetadata: Map<string, ModelMetadata> = new Map();
  private modelPerformance: Map<string, ModelPerformance> = new Map();
  private loadingPromises: Map<string, Promise<tf.GraphModel | tf.LayersModel>> = new Map();

  constructor() {
    this.initializeModelMetadata();
    
    // Setup cleanup intervals
    if (typeof window === 'undefined') {
      // Node.js environment - setup periodic cleanup
      setInterval(() => this.cleanupUnusedModels(), 30 * 60 * 1000); // 30 minutes
    }
  }

  private initializeModelMetadata(): void {
    // Initialize metadata for all configured models
    const modelConfigs = {
      'drug-classifier': environmentConfig.models.drugClassifier,
      'authenticity-verifier': environmentConfig.models.authenticityVerifier,
      'pill-detector': environmentConfig.models.pillDetector,
      'text-detector': environmentConfig.models.textDetector
    };

    for (const [name, config] of Object.entries(modelConfigs)) {
      this.modelMetadata.set(name, {
        name,
        url: config.url,
        loaded: false
      });

      this.modelPerformance.set(name, {
        averageInferenceTime: 0,
        totalInferences: 0,
        successRate: 1.0
      });
    }
  }

  /**
   * Load a model with automatic retry and caching
   */
  async loadModel(modelName: string): Promise<tf.GraphModel | tf.LayersModel> {
    const metadata = this.modelMetadata.get(modelName);
    if (!metadata) {
      throw new Error(`Unknown model: ${modelName}`);
    }

    // Return cached model if already loaded
    if (this.models.has(modelName)) {
      const model = this.models.get(modelName)!;
      metadata.lastUsed = new Date();
      return model;
    }

    // Return existing loading promise if already in progress
    if (this.loadingPromises.has(modelName)) {
      return this.loadingPromises.get(modelName)!;
    }

    console.log(`🔄 Loading model: ${modelName}`);
    const startTime = Date.now();

    const loadingPromise = this.loadModelWithRetry(modelName, metadata);
    this.loadingPromises.set(modelName, loadingPromise);

    try {
      const model = await loadingPromise;
      
      // Update metadata
      metadata.loaded = true;
      metadata.loadTime = Date.now() - startTime;
      metadata.lastUsed = new Date();
      
      // Cache the model
      this.models.set(modelName, model);
      
      console.log(`✅ Model loaded: ${modelName} (${metadata.loadTime}ms)`);
      
      if (environmentConfig.development.debugModelLoading) {
        console.log(`Model ${modelName} details:`, {
          inputs: model.inputs.map(input => ({
            name: input.name,
            shape: input.shape
          })),
          outputs: model.outputs.map(output => ({
            name: output.name,
            shape: output.shape
          }))
        });
      }
      
      return model;
    } catch (error) {
      console.error(`❌ Failed to load model ${modelName}:`, error);
      throw error;
    } finally {
      this.loadingPromises.delete(modelName);
    }
  }

  private async loadModelWithRetry(
    modelName: string, 
    metadata: ModelMetadata
  ): Promise<tf.GraphModel | tf.LayersModel> {
    const maxRetries = environmentConfig.models.drugClassifier.retryCount;
    const timeout = environmentConfig.models.drugClassifier.timeout;
    
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Attempt ${attempt}/${maxRetries} for model: ${modelName}`);
        
        // Create timeout promise
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error(`Model loading timeout after ${timeout}ms`)), timeout);
        });

        // Load model with timeout
        const loadPromise = this.loadModelFromUrl(metadata.url);
        const model = await Promise.race([loadPromise, timeoutPromise]);
        
        return model;
      } catch (error) {
        lastError = error as Error;
        console.warn(`Attempt ${attempt} failed for ${modelName}:`, error);
        
        if (attempt < maxRetries) {
          // Exponential backoff
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
          console.log(`Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw new Error(`Failed to load model ${modelName} after ${maxRetries} attempts. Last error: ${lastError!.message}`);
  }

  private async loadModelFromUrl(url: string): Promise<tf.GraphModel | tf.LayersModel> {
    try {
      // Try loading as GraphModel first (TensorFlow.js format)
      return await tf.loadGraphModel(url);
    } catch (graphError) {
      try {
        // Fallback to LayersModel (Keras format)
        return await tf.loadLayersModel(url);
      } catch (layersError) {
        throw new Error(`Failed to load model from ${url}. GraphModel error: ${graphError}. LayersModel error: ${layersError}`);
      }
    }
  }

  /**
   * Perform inference with performance tracking
   */
  async predict(
    modelName: string, 
    input: tf.Tensor | tf.Tensor[] | tf.NamedTensorMap,
    options?: { trackPerformance?: boolean }
  ): Promise<tf.Tensor | tf.Tensor[] | tf.NamedTensorMap> {
    const model = await this.loadModel(modelName);
    const performance = this.modelPerformance.get(modelName)!;
    const trackPerformance = options?.trackPerformance ?? true;

    const startTime = trackPerformance ? Date.now() : 0;

    try {
      const prediction = model.predict(input) as tf.Tensor | tf.Tensor[] | tf.NamedTensorMap;
      
      if (trackPerformance) {
        const inferenceTime = Date.now() - startTime;
        this.updatePerformanceStats(modelName, inferenceTime, true);
      }
      
      return prediction;
    } catch (error) {
      if (trackPerformance) {
        this.updatePerformanceStats(modelName, 0, false);
        performance.lastError = (error as Error).message;
      }
      throw error;
    }
  }

  private updatePerformanceStats(modelName: string, inferenceTime: number, success: boolean): void {
    const performance = this.modelPerformance.get(modelName)!;
    
    if (success) {
      const totalTime = performance.averageInferenceTime * performance.totalInferences + inferenceTime;
      performance.totalInferences++;
      performance.averageInferenceTime = totalTime / performance.totalInferences;
    }
    
    // Update success rate
    const totalAttempts = performance.totalInferences + (success ? 0 : 1);
    const successfulAttempts = Math.floor(performance.successRate * performance.totalInferences) + (success ? 1 : 0);
    performance.successRate = successfulAttempts / totalAttempts;
  }

  /**
   * Preload all models for better performance
   */
  async preloadAllModels(): Promise<void> {
    console.log('🚀 Preloading all models...');
    
    const modelNames = Array.from(this.modelMetadata.keys());
    const loadPromises = modelNames.map(name => 
      this.loadModel(name).catch(error => {
        console.warn(`Failed to preload model ${name}:`, error);
        return null;
      })
    );
    
    await Promise.allSettled(loadPromises);
    
    const loadedCount = Array.from(this.models.keys()).length;
    console.log(`✅ Preloaded ${loadedCount}/${modelNames.length} models`);
  }

  /**
   * Get model status and performance information
   */
  getModelStatus(): { [key: string]: ModelMetadata & ModelPerformance } {
    const status: { [key: string]: ModelMetadata & ModelPerformance } = {};
    
    for (const [name] of this.modelMetadata) {
      const metadata = this.modelMetadata.get(name)!;
      const performance = this.modelPerformance.get(name)!;
      
      status[name] = {
        ...metadata,
        ...performance
      };
    }
    
    return status;
  }

  /**
   * Health check for all models
   */
  async healthCheck(): Promise<{ [key: string]: boolean }> {
    console.log('🏥 Performing model health check...');
    
    const results: { [key: string]: boolean } = {};
    
    for (const [name] of this.modelMetadata) {
      try {
        const model = await this.loadModel(name);
        
        // Perform a simple inference test with dummy data
        const inputShape = model.inputs[0].shape!.slice(1); // Remove batch dimension
        const dummyInput = tf.randomNormal([1, ...inputShape]);
        
        const prediction = await this.predict(name, dummyInput, { trackPerformance: false });
        
        // Cleanup
        dummyInput.dispose();
        if (Array.isArray(prediction)) {
          prediction.forEach(tensor => tensor.dispose());
        } else {
          (prediction as tf.Tensor).dispose();
        }
        
        results[name] = true;
        console.log(`✅ Health check passed: ${name}`);
      } catch (error) {
        console.error(`❌ Health check failed for ${name}:`, error);
        results[name] = false;
      }
    }
    
    return results;
  }

  /**
   * Clean up unused models to free memory
   */
  private cleanupUnusedModels(): void {
    const now = new Date();
    const maxIdleTime = 30 * 60 * 1000; // 30 minutes
    
    for (const [name, model] of this.models) {
      const metadata = this.modelMetadata.get(name)!;
      
      if (metadata.lastUsed && (now.getTime() - metadata.lastUsed.getTime()) > maxIdleTime) {
        console.log(`🧹 Cleaning up unused model: ${name}`);
        
        model.dispose();
        this.models.delete(name);
        metadata.loaded = false;
      }
    }
  }

  /**
   * Manually dispose of a specific model
   */
  disposeModel(modelName: string): void {
    const model = this.models.get(modelName);
    if (model) {
      model.dispose();
      this.models.delete(modelName);
      
      const metadata = this.modelMetadata.get(modelName);
      if (metadata) {
        metadata.loaded = false;
      }
      
      console.log(`🗑️ Disposed model: ${modelName}`);
    }
  }

  /**
   * Dispose of all loaded models
   */
  disposeAllModels(): void {
    console.log('🗑️ Disposing all models...');
    
    for (const [name, model] of this.models) {
      model.dispose();
      const metadata = this.modelMetadata.get(name);
      if (metadata) {
        metadata.loaded = false;
      }
    }
    
    this.models.clear();
    this.loadingPromises.clear();
  }

  /**
   * Update model URL and reload
   */
  async updateModelUrl(modelName: string, newUrl: string): Promise<void> {
    const metadata = this.modelMetadata.get(modelName);
    if (!metadata) {
      throw new Error(`Unknown model: ${modelName}`);
    }
    
    // Dispose old model if loaded
    this.disposeModel(modelName);
    
    // Update URL
    metadata.url = newUrl;
    
    // Reload model
    await this.loadModel(modelName);
  }

  /**
   * Get memory usage information
   */
  getMemoryInfo(): { numTensors: number; numBytes: number; models: { [key: string]: string } } {
    const memInfo = tf.memory();
    const modelInfo: { [key: string]: string } = {};
    
    for (const [name] of this.models) {
      const metadata = this.modelMetadata.get(name)!;
      modelInfo[name] = `${metadata.loaded ? 'loaded' : 'not loaded'}`;
    }
    
    return {
      numTensors: memInfo.numTensors,
      numBytes: memInfo.numBytes,
      models: modelInfo
    };
  }
}

export const modelManager = new ModelManager();