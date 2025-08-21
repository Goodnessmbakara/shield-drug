import { NextApiRequest, NextApiResponse } from 'next';
import { cloudPharmaceuticalAnalyzer } from '../../../src/services/cloudModels';
import { huggingFacePharmaceuticalAnalyzer } from '../../../src/services/huggingFaceModels';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🏥 AI Health Check Requested');

    const healthStatus: any = {
      timestamp: new Date().toISOString(),
      overall: 'healthy',
      services: {
        cloudModels: {
          status: 'unknown',
          availableProviders: [] as string[],
          configuredProviders: [] as string[],
          details: {} as any
        },
        huggingFace: {
          status: 'unknown',
          apiKeyConfigured: false,
          models: [] as string[],
          details: {} as any
        },
        localModels: {
          status: 'unknown',
          tensorflowBackend: process.env.TENSORFLOW_BACKEND || 'node',
          details: {} as any
        }
      },
      environment: {
        nodeEnv: process.env.NODE_ENV || 'development',
        debugMode: process.env.DEBUG_CLOUD_MODELS === 'true'
      }
    };

    // Check Cloud Models
    try {
      const availableProviders = cloudPharmaceuticalAnalyzer.getAvailableProviders();
      const configuredProviders = availableProviders.filter(provider => 
        provider.includes('(Configured)') || provider.includes('(Available)')
      );

      healthStatus.services.cloudModels = {
        status: configuredProviders.length > 0 ? 'healthy' : 'degraded',
        availableProviders,
        configuredProviders,
        details: {
          totalProviders: availableProviders.length,
          configuredCount: configuredProviders.length
        }
      };
    } catch (error) {
      healthStatus.services.cloudModels.status = 'unhealthy';
      healthStatus.services.cloudModels.details.error = (error as Error).message;
    }

    // Check HuggingFace
    try {
      const hasApiKey = !!(process.env.HUGGINGFACE_API_KEY && 
        process.env.HUGGINGFACE_API_KEY !== 'your_huggingface_api_key_here');
      
      const models = Array.from((huggingFacePharmaceuticalAnalyzer as any).models.keys()) as string[];

      healthStatus.services.huggingFace = {
        status: hasApiKey ? 'healthy' : 'degraded',
        apiKeyConfigured: hasApiKey,
        models,
        details: {
          modelCount: models.length,
          apiKeyPresent: hasApiKey
        }
      };
    } catch (error) {
      healthStatus.services.huggingFace.status = 'unhealthy';
      healthStatus.services.huggingFace.details.error = (error as Error).message;
    }

    // Check Local Models
    try {
      const tensorflowBackend = process.env.TENSORFLOW_BACKEND || 'node';
      
      healthStatus.services.localModels = {
        status: 'healthy',
        tensorflowBackend,
        details: {
          backend: tensorflowBackend,
          fallbackMode: process.env.AI_FALLBACK_MODE || 'auto'
        }
      };
    } catch (error) {
      healthStatus.services.localModels.status = 'unhealthy';
      healthStatus.services.localModels.details.error = (error as Error).message;
    }

    // Determine overall status
    const serviceStatuses = Object.values(healthStatus.services).map((service: any) => service.status);
    if (serviceStatuses.every(status => status === 'healthy')) {
      healthStatus.overall = 'healthy';
    } else if (serviceStatuses.some(status => status === 'unhealthy')) {
      healthStatus.overall = 'unhealthy';
    } else {
      healthStatus.overall = 'degraded';
    }

    // Add recommendations
    const recommendations = [];
    
    if (!healthStatus.services.huggingFace.apiKeyConfigured) {
      recommendations.push('Add HUGGINGFACE_API_KEY to .env.local for enhanced analysis');
    }
    
    if (healthStatus.services.cloudModels.configuredProviders.length === 0) {
      recommendations.push('Configure at least one cloud AI provider for redundancy');
    }
    
    if (healthStatus.services.localModels.tensorflowBackend === 'node') {
      recommendations.push('Consider using TENSORFLOW_BACKEND=webgl for better browser performance');
    }

    healthStatus.recommendations = recommendations;

    console.log('✅ AI Health Check Completed:', healthStatus.overall);

    return res.status(200).json(healthStatus);

  } catch (error) {
    console.error('❌ AI Health Check Failed:', error);
    
    return res.status(500).json({
      timestamp: new Date().toISOString(),
      overall: 'unhealthy',
      error: 'Health check failed',
      details: (error as Error).message
    });
  }
}
