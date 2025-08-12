import { NextApiRequest, NextApiResponse } from 'next';
import { qrCodeService } from '../../../src/lib/qr-code';
import { blockchainService } from '../../../src/lib/blockchain';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { uploadId, drugCode, serialNumber, metadata, generateBatch } = req.body;

    // Validate required fields
    if (!uploadId || !drugCode || !metadata) {
      return res.status(400).json({
        error: 'Missing required fields: uploadId, drugCode, metadata',
      });
    }

    console.log('🔗 Generating QR code with blockchain transaction...');

    if (generateBatch && metadata.quantity) {
      // Generate QR codes for entire batch
      const qrCodes = await qrCodeService.generateBatchQRCodes(
        uploadId,
        drugCode,
        metadata.quantity,
        {
          drugName: metadata.drugName,
          batchId: metadata.batchId,
          manufacturer: metadata.manufacturer,
          expiryDate: metadata.expiryDate,
        }
      );

      // Generate image URLs for each QR code
      const qrCodesWithImages = qrCodes.map(qrCode => ({
        ...qrCode,
        imageUrl: qrCodeService.generateQRCodeImageUrl(qrCode),
      }));

      console.log(`✅ Generated ${qrCodes.length} QR codes for batch`);

      return res.status(200).json({
        success: true,
        message: `Generated ${qrCodes.length} QR codes successfully`,
        data: {
          qrCodes: qrCodesWithImages,
          batchInfo: {
            uploadId,
            drugCode,
            totalQRCodes: qrCodes.length,
            blockchainTransactions: qrCodes.filter(qr => qr.blockchainTx).length,
          },
        },
      });

    } else {
      // Generate single QR code
      const qrCode = await qrCodeService.generateQRCode(
        uploadId,
        drugCode,
        serialNumber || 1,
        metadata
      );

      const qrCodeWithImage = {
        ...qrCode,
        imageUrl: qrCodeService.generateQRCodeImageUrl(qrCode),
      };

      console.log('✅ Generated single QR code with blockchain transaction');

      return res.status(200).json({
        success: true,
        message: 'QR code generated successfully',
        data: {
          qrCode: qrCodeWithImage,
          blockchainInfo: {
            transactionHash: qrCode.blockchainTx?.hash,
            status: qrCode.blockchainTx?.status,
            blockNumber: qrCode.blockchainTx?.blockNumber,
            explorerUrl: qrCode.blockchainTx?.hash 
              ? `https://snowtrace.io/tx/${qrCode.blockchainTx.hash}`
              : undefined,
          },
        },
      });
    }

  } catch (error) {
    console.error('❌ QR code generation failed:', error);
    
    return res.status(500).json({
      error: 'Failed to generate QR code',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
} 