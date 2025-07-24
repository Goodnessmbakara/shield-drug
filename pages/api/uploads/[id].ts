import { NextApiRequest, NextApiResponse } from 'next';
import { getUploadById, updateUploadStatus } from '@/lib/db-utils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Upload ID is required' });
  }

  try {
    switch (req.method) {
      case 'GET':
        // Get specific upload by ID (same server)
        const upload = await getUploadById(id);
        
        if (!upload) {
          return res.status(404).json({ error: 'Upload not found' });
        }

        return res.status(200).json({ upload });

      case 'PUT':
        // Update upload status (handled by Next.js API route)
        const { status, ...updateData } = req.body;
        
        if (!status) {
          return res.status(400).json({ error: 'Status is required' });
        }

        const updatedUpload = await updateUploadStatus(id, status, updateData);
        
        if (!updatedUpload) {
          return res.status(404).json({ error: 'Upload not found' });
        }

        return res.status(200).json({ 
          message: 'Upload updated successfully',
          upload: updatedUpload 
        });

      case 'DELETE':
        // Delete upload (handled by Next.js API route)
        // In a real app, you might want to soft delete instead
        return res.status(405).json({ error: 'Delete not implemented yet' });

      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
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