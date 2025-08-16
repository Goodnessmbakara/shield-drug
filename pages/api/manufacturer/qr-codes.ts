import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/database';
import Upload from '@/lib/models/Upload';
import QRCode from '@/lib/models/QRCode';
import { qrCodeService } from '@/lib/qr-code';
import mongoose from 'mongoose';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Check authentication
  const userRole = req.headers['x-user-role'];
  const userEmail = req.headers['x-user-email'];
  
  if (userRole !== 'manufacturer') {
    return res.status(403).json({ error: 'Access denied. Manufacturer role required.' });
  }

  if (!userEmail) {
    return res.status(401).json({ error: 'User email required' });
  }

  await dbConnect();

  if (req.method === 'GET') {
    // Get QR codes for the manufacturer
    try {
      const { 
        page = '1', 
        limit = '10', 
        search = '', 
        status = 'all',
        batchId = 'all'
      } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      // Build filter conditions
      const filter: any = { userEmail: userEmail as string };
      
      if (search) {
        filter.$or = [
          { qrCodeId: { $regex: search, $options: 'i' } },
          { 'metadata.drugName': { $regex: search, $options: 'i' } },
          { 'metadata.batchId': { $regex: search, $options: 'i' } }
        ];
      }

      if (status !== 'all') {
        filter.status = status;
      }

      if (batchId !== 'all') {
        // Support both uploadId and metadata.batchId filtering
        const { ObjectId } = mongoose.Types;
        filter.$or = [
          { uploadId: batchId },
          { 'metadata.batchId': batchId }
        ];
        
        // If batchId looks like a Mongo ObjectId, also include the string version
        if (ObjectId.isValid(batchId as string)) {
          filter.$or.push({ uploadId: new ObjectId(batchId as string).toString() });
        }
      }

      // Get QR codes with pagination
      const qrCodes = await QRCode.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean();

      // Get total count for pagination
      const totalQRCodes = await QRCode.countDocuments(filter);

      // Get statistics
      const stats = await getQRCodeStats(userEmail as string);

      // Get available batches for dropdown
      const batches = await Upload.find({ userEmail: userEmail as string })
        .select('_id fileName drug quantity status createdAt')
        .sort({ createdAt: -1 })
        .lean();

      // Calculate pagination info
      const totalPages = Math.ceil(totalQRCodes / limitNum);
      const hasNextPage = pageNum < totalPages;
      const hasPrevPage = pageNum > 1;

      res.status(200).json({
        qrCodes: qrCodes.map(qrCode => ({
          id: (qrCode._id as mongoose.Types.ObjectId).toString(),
          qrCodeId: qrCode.qrCodeId,
          batchId: qrCode.uploadId,
          drug: qrCode.metadata?.drugName || 'Unknown',
          quantity: qrCode.metadata?.quantity || 0,
          generated: 1, // Each QR code represents 1 unit
          status: qrCode.status || 'generated',
          date: qrCode.createdAt,
          downloads: qrCode.downloadCount || 0,
          verifications: qrCode.verificationCount || 0,
          blockchainTx: qrCode.blockchainTx,
          verificationUrl: qrCode.verificationUrl,
          imageUrl: qrCode.imageUrl
        })),
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalQRCodes,
          hasNextPage,
          hasPrevPage,
          limit: limitNum
        },
        stats,
        batches: batches.map(batch => ({
          id: (batch._id as mongoose.Types.ObjectId).toString(),
          drug: batch.drug || 'Unknown',
          quantity: batch.quantity || 0,
          status: batch.status || 'pending',
          fileName: batch.fileName,
          createdAt: batch.createdAt
        }))
      });

    } catch (error) {
      console.error('Error fetching QR codes:', error);
      res.status(500).json({ 
        error: 'Internal server error while fetching QR codes' 
      });
    }

  } else if (req.method === 'POST') {
    // Generate new QR codes
    try {
      const { batchId, quantity, generateForBatch } = req.body;

      if (!batchId) {
        return res.status(400).json({ error: 'Batch ID is required' });
      }

      // Get the batch/upload record
      const upload = await Upload.findOne({ 
        _id: batchId, 
        userEmail: userEmail as string 
      });

      if (!upload) {
        return res.status(404).json({ error: 'Batch not found' });
      }

      let generatedQRCodes = [];

      if (generateForBatch) {
        // Generate QR codes for the entire batch
        const batchQuantity = upload.quantity || 0;
        
        // Generate QR codes in batches to avoid overwhelming the system
        const batchSize = 100;
        const totalBatches = Math.ceil(batchQuantity / batchSize);
        
        for (let i = 0; i < totalBatches; i++) {
          const startIndex = i * batchSize + 1;
          const endIndex = Math.min((i + 1) * batchSize, batchQuantity);
          
          console.log(`Generating QR codes ${startIndex} to ${endIndex} for batch ${batchId}`);
          
          for (let serialNumber = startIndex; serialNumber <= endIndex; serialNumber++) {
            try {
              let qrCode = await qrCodeService.generateQRCode(
                batchId,
                upload.drug || 'Unknown',
                serialNumber,
                {
                  drugName: upload.drug || 'Unknown',
                  batchId: upload.batchId || batchId,
                  manufacturer: upload.manufacturer || 'Unknown',
                  expiryDate: upload.expiryDate || new Date().toISOString(),
                  quantity: batchQuantity
                }
              );

              // Save QR code to database with retry logic
              let qrCodeDoc;
              let saveAttempts = 0;
              const maxSaveAttempts = 3;
              
              do {
                try {
                  qrCodeDoc = new QRCode({
                    qrCodeId: qrCode.qrCodeId,
                    uploadId: batchId,
                    userEmail: userEmail as string,
                    drugCode: qrCode.drugCode,
                    serialNumber: qrCode.serialNumber,
                    blockchainTx: qrCode.blockchainTx,
                    verificationUrl: qrCode.verificationUrl,
                    imageUrl: qrCodeService.generateQRCodeImageUrl(qrCode),
                    metadata: qrCode.metadata,
                    status: 'generated',
                    downloadCount: 0,
                    verificationCount: 0
                  });

                  await qrCodeDoc.save();
                  break; // Success, exit retry loop
                } catch (saveError: any) {
                  saveAttempts++;
                  console.error(`Save attempt ${saveAttempts} failed for QR code ${serialNumber}:`, saveError);
                  
                  if (saveError.code === 11000 && saveError.keyPattern?.qrCodeId) {
                    // Duplicate key error - regenerate QR code ID
                    if (saveAttempts < maxSaveAttempts) {
                      console.log(`Regenerating QR code ID for serial number ${serialNumber} (attempt ${saveAttempts})`);
                      // Regenerate the QR code with a new ID
                      qrCode = await qrCodeService.generateQRCode(
                        batchId,
                        upload.drug || 'Unknown',
                        serialNumber,
                        {
                          drugName: upload.drug || 'Unknown',
                          batchId: upload.batchId || batchId,
                          manufacturer: upload.manufacturer || 'Unknown',
                          expiryDate: upload.expiryDate || new Date().toISOString(),
                          quantity: batchQuantity
                        }
                      );
                      continue; // Retry with new QR code
                    }
                  }
                  
                  // If we've exhausted retries or it's not a duplicate key error, throw
                  throw saveError;
                }
              } while (saveAttempts < maxSaveAttempts);

              generatedQRCodes.push(qrCodeDoc);

            } catch (error) {
              console.error(`Failed to generate QR code ${serialNumber}:`, error);
              // Continue with next QR code
            }
          }
        }

        // Update upload record with QR codes generated
        await Upload.findByIdAndUpdate(batchId, {
          qrCodesGenerated: batchQuantity,
          status: 'active'
        });

      } else {
        // Generate specific quantity of QR codes
        const qty = Math.min(quantity || 1, upload.quantity || 1);
        
        for (let i = 1; i <= qty; i++) {
          try {
            let qrCode = await qrCodeService.generateQRCode(
              batchId,
              upload.drug || 'Unknown',
              i,
              {
                drugName: upload.drug || 'Unknown',
                batchId: upload.batchId || batchId,
                manufacturer: upload.manufacturer || 'Unknown',
                expiryDate: upload.expiryDate || new Date().toISOString(),
                quantity: qty
              }
            );

            // Save QR code to database with retry logic
            let qrCodeDoc;
            let saveAttempts = 0;
            const maxSaveAttempts = 3;
            
            do {
              try {
                qrCodeDoc = new QRCode({
                  qrCodeId: qrCode.qrCodeId,
                  uploadId: batchId,
                  userEmail: userEmail as string,
                  drugCode: qrCode.drugCode,
                  serialNumber: qrCode.serialNumber,
                  blockchainTx: qrCode.blockchainTx,
                  verificationUrl: qrCode.verificationUrl,
                  imageUrl: qrCodeService.generateQRCodeImageUrl(qrCode),
                  metadata: qrCode.metadata,
                  status: 'generated',
                  downloadCount: 0,
                  verificationCount: 0
                });

                await qrCodeDoc.save();
                break; // Success, exit retry loop
              } catch (saveError: any) {
                saveAttempts++;
                console.error(`Save attempt ${saveAttempts} failed for QR code ${i}:`, saveError);
                
                if (saveError.code === 11000 && saveError.keyPattern?.qrCodeId) {
                  // Duplicate key error - regenerate QR code ID
                  if (saveAttempts < maxSaveAttempts) {
                    console.log(`Regenerating QR code ID for serial number ${i} (attempt ${saveAttempts})`);
                    // Regenerate the QR code with a new ID
                    qrCode = await qrCodeService.generateQRCode(
                      batchId,
                      upload.drug || 'Unknown',
                      i,
                      {
                        drugName: upload.drug || 'Unknown',
                        batchId: upload.batchId || batchId,
                        manufacturer: upload.manufacturer || 'Unknown',
                        expiryDate: upload.expiryDate || new Date().toISOString(),
                        quantity: qty
                      }
                    );
                    continue; // Retry with new QR code
                  }
                }
                
                // If we've exhausted retries or it's not a duplicate key error, throw
                throw saveError;
              }
            } while (saveAttempts < maxSaveAttempts);

            generatedQRCodes.push(qrCodeDoc);

          } catch (error) {
            console.error(`Failed to generate QR code ${i}:`, error);
            // Continue with next QR code
          }
        }

        // Update upload record
        const currentGenerated = upload.qrCodesGenerated || 0;
        await Upload.findByIdAndUpdate(batchId, {
          qrCodesGenerated: currentGenerated + qty
        });
      }

      res.status(200).json({
        success: true,
        message: `Generated ${generatedQRCodes.length} QR codes successfully`,
        data: {
          generatedCount: generatedQRCodes.length,
          qrCodes: generatedQRCodes.map(qr => ({
            id: qr._id,
            qrCodeId: qr.qrCodeId,
            imageUrl: qr.imageUrl,
            verificationUrl: qr.verificationUrl,
            blockchainTx: qr.blockchainTx
          }))
        }
      });

    } catch (error) {
      console.error('Error generating QR codes:', error);
      res.status(500).json({ 
        error: 'Internal server error while generating QR codes',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }

  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}

async function getQRCodeStats(userEmail: string) {
  const [
    totalQRCodes,
    generatedToday,
    pendingGeneration,
    totalDownloads,
    totalVerifications
  ] = await Promise.all([
    QRCode.countDocuments({ userEmail }),
    QRCode.countDocuments({ 
      userEmail, 
      createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
    }),
    Upload.aggregate([
      { $match: { userEmail, status: 'pending' } },
      { $group: { _id: null, total: { $sum: { $ifNull: ['$quantity', 0] } } } }
    ]),
    QRCode.aggregate([
      { $match: { userEmail } },
      { $group: { _id: null, total: { $sum: { $ifNull: ['$downloadCount', 0] } } } }
    ]),
    QRCode.aggregate([
      { $match: { userEmail } },
      { $group: { _id: null, total: { $sum: { $ifNull: ['$verificationCount', 0] } } } }
    ])
  ]);

  const pendingCount = pendingGeneration[0]?.total || 0;
  const downloadsCount = totalDownloads[0]?.total || 0;
  const verificationsCount = totalVerifications[0]?.total || 0;

  // Calculate rates
  const downloadRate = totalQRCodes > 0 ? (downloadsCount / totalQRCodes * 100) : 0;
  const verificationRate = totalQRCodes > 0 ? (verificationsCount / totalQRCodes * 100) : 0;
  const blockchainSuccess = 99.8; // Mock value for now

  return {
    totalQRCodes,
    generatedToday,
    pendingGeneration: pendingCount,
    downloadRate: Math.round(downloadRate * 10) / 10,
    verificationRate: Math.round(verificationRate * 10) / 10,
    blockchainSuccess
  };
}
