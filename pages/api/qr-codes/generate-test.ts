import { NextApiRequest, NextApiResponse } from 'next';
import QRCode from 'qrcode';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { qrCodeId, drug, batchId, manufacturer, expiryDate, verificationUrl } = req.body;

    if (!qrCodeId || !drug || !batchId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Create QR code data
    const qrData = {
      qrCodeId,
      drug,
      batchId,
      manufacturer: manufacturer || 'DrugShield Manufacturer',
      expiryDate: expiryDate || new Date().toISOString().split('T')[0],
      verificationUrl: verificationUrl || `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/verify/${qrCodeId}`,
      serialNumber: 1
    };

    // Generate QR code as data URL
    const qrString = JSON.stringify(qrData);
    const dataURL = await QRCode.toDataURL(qrString, {
      errorCorrectionLevel: 'M',
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      width: 256
    });

    res.status(200).json({
      success: true,
      data: {
        qrCodeId,
        dataURL,
        qrData
      }
    });
  } catch (error) {
    console.error('Error generating QR code:', error);
    res.status(500).json({ 
      error: 'Failed to generate QR code',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
