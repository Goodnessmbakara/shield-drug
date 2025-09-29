import { NextApiRequest, NextApiResponse } from 'next';
import { pharmaceuticalAI } from '@/services/pharmaceuticalAI';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🧪 Testing Medical Pills Detection API...');
    
    // Initialize the service
    await pharmaceuticalAI.initialize();
    
    // Test with a sample image (1x1 pixel for testing)
    const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    const testImageBuffer = Buffer.from(testImageBase64, 'base64');
    
    // Analyze the image for pills
    const result = await pharmaceuticalAI.analyzePharmaceuticalImage(testImageBuffer);
    
    console.log('✅ Medical Pills Detection Test Results:', {
      drugName: result.drugName,
      confidence: result.confidence,
      isAuthentic: result.isAuthentic,
      counterfeitRisk: result.counterfeitRisk,
      detectedFeatures: result.detectedFeatures
    });
    
    res.status(200).json({
      success: true,
      message: 'Medical pills detection test completed',
      result: {
        drugName: result.drugName,
        confidence: result.confidence,
        isAuthentic: result.isAuthentic,
        counterfeitRisk: result.counterfeitRisk,
        detectedFeatures: result.detectedFeatures,
        imageClassification: result.imageClassification,
        textExtraction: result.textExtraction
      }
    });
    
  } catch (error) {
    console.error('❌ Medical Pills Detection Test Failed:', error);
    res.status(500).json({
      success: false,
      error: 'Medical pills detection test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
