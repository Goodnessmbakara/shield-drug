import { NextApiRequest, NextApiResponse } from 'next';
import { pharmaceuticalAI } from '@/services/pharmaceuticalAI';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🧪 Testing Medical Classification API...');
    
    // Initialize the service
    await pharmaceuticalAI.initialize();
    
    // Test with a sample image (1x1 pixel for testing)
    const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    const testImageBuffer = Buffer.from(testImageBase64, 'base64');
    
    // Analyze the image
    const result = await pharmaceuticalAI.analyzePharmaceuticalImage(testImageBuffer);
    
    console.log('✅ Medical Classification Test Results:', {
      drugName: result.drugName,
      confidence: result.confidence,
      isAuthentic: result.isAuthentic,
      counterfeitRisk: result.counterfeitRisk,
      imageClassification: result.imageClassification
    });
    
    res.status(200).json({
      success: true,
      message: 'Medical classification test completed',
      result: {
        drugName: result.drugName,
        confidence: result.confidence,
        isAuthentic: result.isAuthentic,
        counterfeitRisk: result.counterfeitRisk,
        imageClassification: result.imageClassification,
        textExtraction: result.textExtraction
      }
    });
    
  } catch (error) {
    console.error('❌ Medical Classification Test Failed:', error);
    res.status(500).json({
      success: false,
      error: 'Medical classification test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
