import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/database';
import QRCode from '@/lib/models/QRCode';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  await dbConnect();

  try {
    const { id } = req.query;
    
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'QR Code ID is required' });
    }

    // Increment download count
    const updatedQRCode = await QRCode.findByIdAndUpdate(
      id,
      { $inc: { downloadCount: 1 } },
      { new: true }
    );

    if (!updatedQRCode) {
      return res.status(404).json({ error: 'QR Code not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Download tracked successfully',
      data: {
        qrCodeId: updatedQRCode.qrCodeId,
        downloadCount: updatedQRCode.downloadCount
      }
    });

  } catch (error) {
    console.error('Error tracking download:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
