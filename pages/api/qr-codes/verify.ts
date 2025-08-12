import { NextApiRequest, NextApiResponse } from 'next';
import { qrCodeService } from '../../../src/lib/qr-code';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { qrCodeId, qrCodeData } = req.body;

    if (!qrCodeId && !qrCodeData) {
      return res.status(400).json({
        error: 'Missing required field: qrCodeId or qrCodeData',
      });
    }

    console.log('🔍 Verifying QR code against blockchain...');

    let verificationResult;

    if (qrCodeData) {
      // Verify QR code data directly
      const qrData = JSON.parse(qrCodeData);
      verificationResult = await qrCodeService.verifyQRCode(qrData.qrCodeId);
    } else {
      // Verify by QR code ID
      verificationResult = await qrCodeService.verifyQRCode(qrCodeId);
    }

    if (verificationResult.isValid && verificationResult.data) {
      const { data, blockchainStatus } = verificationResult;
      
      console.log('✅ QR code verification successful');

      return res.status(200).json({
        success: true,
        message: 'QR code verified successfully',
        data: {
          qrCode: data,
          blockchainStatus,
          verificationInfo: {
            verifiedAt: new Date().toISOString(),
            isValid: true,
            blockchainConfirmed: blockchainStatus?.confirmed || false,
            explorerUrl: data.blockchainTx?.hash 
              ? `https://snowtrace.io/tx/${data.blockchainTx.hash}`
              : undefined,
          },
        },
      });

    } else {
      console.log('❌ QR code verification failed');

      return res.status(400).json({
        success: false,
        message: 'QR code verification failed',
        error: verificationResult.error || 'Invalid QR code',
        data: {
          verificationInfo: {
            verifiedAt: new Date().toISOString(),
            isValid: false,
            blockchainConfirmed: false,
          },
        },
      });
    }

  } catch (error) {
    console.error('❌ QR code verification failed:', error);
    
    return res.status(500).json({
      error: 'Failed to verify QR code',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
} 