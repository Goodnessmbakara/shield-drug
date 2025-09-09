import { NextApiRequest, NextApiResponse } from 'next';
import { qrCodeService } from '../../../src/lib/qr-code';
import dbConnect from '../../../src/lib/database';
import Verification from '../../../src/lib/models/Verification';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Connect to database
    await dbConnect();
    
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

      // Create verification record
      try {
        const verificationRecord = new Verification({
          userEmail: 'system@drugshield.com', // Default system user for QR code verifications
          verifiedBy: 'system@drugshield.com',
          drugName: data.metadata.drugName,
          qrCodeId: data.qrCodeId,
          batchId: data.metadata.batchId,
          manufacturer: data.metadata.manufacturer,
          method: 'QR Code Scan',
          status: 'Verified',
          result: 'authentic',
          verifiedAt: new Date(),
          blockchainTx: data.blockchainTx?.hash,
          verificationCount: data.verificationCount || 1
        });

        await verificationRecord.save();
        console.log('📝 Verification record created:', verificationRecord._id);
      } catch (verificationError) {
        console.warn('⚠️ Failed to create verification record:', verificationError);
        // Don't fail the verification if record creation fails
      }

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
              ? `https://testnet.snowtrace.io/tx/${data.blockchainTx.hash}`
              : undefined,
          },
        },
      });

    } else {
      console.log('❌ QR code verification failed');

      // Create failed verification record
      try {
        const failedVerificationRecord = new Verification({
          userEmail: 'system@drugshield.com',
          verifiedBy: 'system@drugshield.com',
          drugName: 'Unknown Drug',
          qrCodeId: qrCodeId || 'unknown',
          batchId: 'unknown',
          manufacturer: 'unknown',
          method: 'QR Code Scan',
          status: 'Failed',
          result: 'unknown',
          verifiedAt: new Date(),
          verificationCount: 1
        });

        await failedVerificationRecord.save();
        console.log('📝 Failed verification record created:', failedVerificationRecord._id);
      } catch (verificationError) {
        console.warn('⚠️ Failed to create failed verification record:', verificationError);
      }

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