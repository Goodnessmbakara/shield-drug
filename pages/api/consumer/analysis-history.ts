import { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '@/lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userEmail } = req.query;

    if (!userEmail || typeof userEmail !== 'string') {
      return res.status(400).json({
        error: 'User email is required',
        message: 'Please provide a valid user email',
      });
    }

    console.log('📊 Fetching analysis history for user:', userEmail);

    // Connect to database
    const { db } = await connectToDatabase();
    
    // Get analysis history from the database
    // For now, return mock data - in production this would come from a real database
    const mockHistory = [
      {
        id: '1',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        imageUrl: '/api/placeholder-image/1',
        result: {
          drugName: 'Paracetamol 500mg',
          strength: '500mg',
          confidence: 0.85,
          status: 'authentic',
          issues: [],
          extractedText: ['PARACETAMOL', '500mg', 'GSK Pharmaceuticals'],
          visualFeatures: {
            color: 'white',
            shape: 'round',
            markings: ['500', 'mg'],
            objectDetections: []
          },
          isDrugImage: true,
          imageClassification: {
            isPharmaceutical: true,
            detectedObjects: ['pill', 'tablet'],
            confidence: 0.85,
            detectionMethod: 'ensemble',
            boundingBoxCount: 2
          }
        },
        status: 'authentic'
      },
      {
        id: '2',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        imageUrl: '/api/placeholder-image/2',
        result: {
          drugName: 'Ibuprofen 400mg',
          strength: '400mg',
          confidence: 0.78,
          status: 'suspicious',
          issues: ['Low image quality', 'Missing expiry date'],
          extractedText: ['IBUPROFEN', '400mg'],
          visualFeatures: {
            color: 'white',
            shape: 'oval',
            markings: ['400'],
            objectDetections: []
          },
          isDrugImage: true,
          imageClassification: {
            isPharmaceutical: true,
            detectedObjects: ['tablet'],
            confidence: 0.78,
            detectionMethod: 'mobilenet',
            boundingBoxCount: 1
          }
        },
        status: 'suspicious'
      },
      {
        id: '3',
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        imageUrl: '/api/placeholder-image/3',
        result: {
          drugName: 'Amoxicillin 500mg',
          strength: '500mg',
          confidence: 0.92,
          status: 'authentic',
          issues: [],
          extractedText: ['AMOXICILLIN', '500mg', 'Batch: B2024001', 'Exp: 12/2025'],
          visualFeatures: {
            color: 'white',
            shape: 'capsule',
            markings: ['500', 'AMOX'],
            objectDetections: []
          },
          isDrugImage: true,
          imageClassification: {
            isPharmaceutical: true,
            detectedObjects: ['capsule', 'medicine'],
            confidence: 0.92,
            detectionMethod: 'coco-ssd',
            boundingBoxCount: 3
          }
        },
        status: 'authentic'
      }
    ];

    // In production, you would query the database like this:
    /*
    const history = await db.collection('drugAnalysisHistory')
      .find({ userEmail })
      .sort({ timestamp: -1 })
      .limit(50)
      .toArray();
    */

    console.log(`✅ Retrieved ${mockHistory.length} analysis records for user`);

    return res.status(200).json(mockHistory);

  } catch (error) {
    console.error('❌ Failed to fetch analysis history:', error);
    
    return res.status(500).json({
      error: 'Failed to fetch analysis history',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
}
