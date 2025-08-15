import type { NextApiRequest, NextApiResponse } from 'next';
import { aiDrugAnalysis } from '@/services/aiDrugAnalysis';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { imageData } = req.body;

    if (!imageData) {
      return res.status(400).json({ error: 'Image data is required' });
    }

    const result = await aiDrugAnalysis.analyzeImage(imageData);
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Image analysis error:', error);
    res.status(500).json({ 
      error: 'Failed to analyze image',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
