import { NextApiRequest, NextApiResponse } from 'next';
import { createQRCode, getQRCodesByUpload, markQRCodeAsScanned } from '@/lib/db-utils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case 'GET':
        // Get QR codes for a specific upload (same server)
        const { uploadId } = req.query;
        
        if (!uploadId || typeof uploadId !== 'string') {
          return res.status(400).json({ error: 'Upload ID is required' });
        }

        const qrCodes = await getQRCodesByUpload(uploadId);
        return res.status(200).json({ qrCodes });

      case 'POST':
        // Create new QR codes (handled by Next.js API route)
        const qrData = req.body;
        
        if (!qrData.qrId || !qrData.uploadId) {
          return res.status(400).json({ 
            error: 'Missing required fields: qrId, uploadId' 
          });
        }

        const newQRCode = await createQRCode(qrData);
        return res.status(201).json({ 
          message: 'QR Code created successfully',
          qrCode: newQRCode 
        });

      case 'PUT':
        // Mark QR code as scanned (handled by Next.js API route)
        const { qrId, scannedBy, scannedLocation } = req.body;
        
        if (!qrId || !scannedBy) {
          return res.status(400).json({ 
            error: 'Missing required fields: qrId, scannedBy' 
          });
        }

        const scannedQRCode = await markQRCodeAsScanned(qrId, scannedBy, scannedLocation);
        
        if (!scannedQRCode) {
          return res.status(404).json({ error: 'QR Code not found' });
        }

        return res.status(200).json({ 
          message: 'QR Code marked as scanned',
          qrCode: scannedQRCode 
        });

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT']);
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