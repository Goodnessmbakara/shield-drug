import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/database';
import QRCode from '@/lib/models/QRCode';
import Verification from '@/lib/models/Verification';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await dbConnect();
    
    const { 
      qrCodeId, 
      pharmacistEmail, 
      pharmacy, 
      location, 
      method = 'QR Code Scan',
      result = 'authentic'
    } = req.body;

    if (!qrCodeId || !pharmacistEmail) {
      return res.status(400).json({
        error: 'Missing required fields: qrCodeId and pharmacistEmail'
      });
    }

    console.log('🔍 Pharmacist verifying QR code:', qrCodeId);

    // Find the QR code
    const qrCode = await QRCode.findOne({ qrCodeId });
    
    if (!qrCode) {
      // Create failed verification record for unknown QR code
      const failedVerification = new Verification({
        userEmail: pharmacistEmail,
        verifiedBy: pharmacistEmail,
        drugName: 'Unknown Drug',
        qrCodeId,
        batchId: 'unknown',
        manufacturer: 'unknown',
        method,
        status: 'Failed',
        result: 'unknown',
        pharmacy,
        location,
        verifiedAt: new Date(),
        verificationCount: 1
      });

      await failedVerification.save();

      return res.status(404).json({
        success: false,
        message: 'QR code not found',
        error: 'Invalid QR code'
      });
    }

    // Update QR code verification count and scan status
    qrCode.verificationCount = (qrCode.verificationCount || 0) + 1;
    qrCode.isScanned = true;
    qrCode.scannedAt = new Date();
    qrCode.scannedBy = pharmacistEmail;
    qrCode.scannedLocation = location;
    await qrCode.save();

    // Create verification record
    const verificationRecord = new Verification({
      userEmail: pharmacistEmail,
      verifiedBy: pharmacistEmail,
      drugName: qrCode.metadata.drugName,
      qrCodeId: qrCode.qrCodeId,
      batchId: qrCode.metadata.batchId,
      manufacturer: qrCode.metadata.manufacturer,
      method,
      status: 'Verified',
      result,
      pharmacy,
      location,
      verifiedAt: new Date(),
      blockchainTx: qrCode.blockchainTx?.hash,
      verificationCount: qrCode.verificationCount
    });

    await verificationRecord.save();

    console.log('✅ Pharmacist verification successful:', verificationRecord._id);

    return res.status(200).json({
      success: true,
      message: 'QR code verified successfully',
      data: {
        verification: verificationRecord,
        qrCode: {
          qrCodeId: qrCode.qrCodeId,
          drugName: qrCode.metadata.drugName,
          batchId: qrCode.metadata.batchId,
          manufacturer: qrCode.metadata.manufacturer,
          expiryDate: qrCode.metadata.expiryDate,
          verificationCount: qrCode.verificationCount,
          blockchainTx: qrCode.blockchainTx
        }
      }
    });

  } catch (error) {
    console.error('❌ Pharmacist verification failed:', error);
    
    return res.status(500).json({
      error: 'Failed to verify QR code',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
