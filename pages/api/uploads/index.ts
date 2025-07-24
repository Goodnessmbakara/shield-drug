import { NextApiRequest, NextApiResponse } from 'next';
import { createUpload, getUploadsByUser, getUploadStats } from '@/lib/db-utils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Connect to database (same server, no separate backend)
  try {
    switch (req.method) {
      case 'GET':
        // Get uploads for a specific user or all uploads
        const { userEmail, limit = 10 } = req.query;
        
        if (userEmail && typeof userEmail === 'string') {
          const uploads = await getUploadsByUser(userEmail, Number(limit));
          return res.status(200).json({ uploads });
        } else {
          // Get upload statistics
          const stats = await getUploadStats();
          return res.status(200).json({ stats });
        }

      case 'POST':
        // Create new upload (handled by Next.js API route)
        const uploadData = req.body;
        
        // Validate required fields
        if (!uploadData.fileName || !uploadData.drug || !uploadData.userEmail) {
          return res.status(400).json({ 
            error: 'Missing required fields: fileName, drug, userEmail' 
          });
        }

        const newUpload = await createUpload({
          ...uploadData,
          date: new Date(),
          status: 'pending'
        });

        return res.status(201).json({ 
          message: 'Upload created successfully',
          upload: newUpload 
        });

      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 