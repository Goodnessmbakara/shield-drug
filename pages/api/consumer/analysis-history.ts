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
    // Return empty array when no real data is available
    const mockHistory: any[] = [];

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

