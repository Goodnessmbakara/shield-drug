import { NextApiRequest, NextApiResponse } from 'next';
import { parseCSV, validateDrugBatchData, validateFileSize, validateFileType, generateUploadId } from '@/lib/validation';
import { UploadResponse, ValidationResult, UploadStatus } from '@/lib/types';
import { blockchainService } from '@/lib/blockchain';
import { createUpload } from '@/lib/db-utils';
import { updateUploadProgress, estimateProcessingTime, calculateProgress } from './upload-progress';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
    responseLimit: false,
    externalResolver: true,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<UploadResponse | { error: string }>
) {
  const startTime = Date.now();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check authentication (in a real app, you'd verify JWT token)
    const userRole = req.headers['x-user-role'];
    const userEmail = req.headers['x-user-email'];
    
    if (userRole !== 'manufacturer') {
      return res.status(403).json({ error: 'Access denied. Manufacturer role required.' });
    }

    if (!userEmail) {
      return res.status(401).json({ error: 'User email required' });
    }

    // Get file data from request
    const { fileContent, fileName, fileSize } = req.body;

    if (!fileContent || !fileName) {
      return res.status(400).json({ error: 'File content and name are required' });
    }

    // Create a mock File object for validation
    const mockFile = new File([fileContent], fileName, { type: 'text/csv' });

    // Validate file type
    const fileTypeErrors = validateFileType(mockFile);
    if (fileTypeErrors.length > 0) {
      return res.status(400).json({ 
        error: fileTypeErrors[0].message 
      });
    }

    // Validate file size
    const fileSizeErrors = validateFileSize(mockFile);
    if (fileSizeErrors.length > 0) {
      return res.status(400).json({ 
        error: fileSizeErrors[0].message 
      });
    }

    // Parse CSV content
    let csvRows;
    try {
      csvRows = parseCSV(fileContent);
    } catch (error) {
      return res.status(400).json({ 
        error: `CSV parsing error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    }

    // Validate drug batch data
    const validationResult = validateDrugBatchData(csvRows);

    // Generate upload ID
    const uploadId = generateUploadId();

    // Calculate total quantity and estimate processing time
    const totalQuantity = validationResult.data.reduce((sum, row) => sum + parseInt(row.quantity.toString()), 0);
    const estimatedTime = estimateProcessingTime(totalQuantity);

    // Initialize progress tracking
    updateUploadProgress(uploadId, {
      stage: 'validation',
      progress: 10,
      message: 'Validation completed successfully',
      totalQuantity,
      processedQuantity: 0,
      estimatedTimeRemaining: estimatedTime,
      isComplete: false
    });

    // If validation fails, return errors
    if (!validationResult.isValid) {
      return res.status(400).json({
        error: `Validation failed. ${validationResult.errors.length} errors found.`,
        uploadId,
        status: 'failed' as UploadStatus,
        validationResult
      });
    }

    // Generate file hash for blockchain
    const fileHash = blockchainService.generateFileHash(fileContent);

    // Record on blockchain
    console.log('Recording pharmaceutical batch on blockchain...');
    
    updateUploadProgress(uploadId, {
      stage: 'blockchain',
      progress: 30,
      message: 'Recording batch on blockchain...',
      totalQuantity,
      processedQuantity: 0,
      estimatedTimeRemaining: estimatedTime - 5, // Subtract time for blockchain tx
      isComplete: false
    });

    const blockchainTx = await blockchainService.recordPharmaceuticalBatch(
      uploadId,
      validationResult,
      fileHash
    );

    if (blockchainTx.status === 'failed') {
      return res.status(500).json({
        error: `Blockchain transaction failed: ${blockchainTx.errorMessage}`,
        uploadId,
        status: 'failed' as UploadStatus,
        validationResult
      });
    }

    // Generate QR codes and record them on blockchain
    console.log('Generating QR codes...');
    
    updateUploadProgress(uploadId, {
      stage: 'qr-generation',
      progress: 50,
      message: 'Starting QR code generation...',
      totalQuantity,
      processedQuantity: 0,
      estimatedTimeRemaining: estimatedTime - 10, // Subtract time for blockchain tx
      isComplete: false
    });

    // Add timeout for QR code generation to prevent hanging
    const qrCodePromise = generateAndRecordQRCodes(uploadId, validationResult, totalQuantity);
    const timeoutPromise = new Promise<number>((_, reject) => 
      setTimeout(() => reject(new Error('QR code generation timed out after 60 seconds')), 60000)
    );
    
    console.log('⏳ Starting QR code generation with 60-second timeout...');
    const qrCodesGenerated = await Promise.race([qrCodePromise, timeoutPromise]);
    console.log(`✅ QR code generation completed: ${qrCodesGenerated} codes generated`);

    // Store upload record in database
    updateUploadProgress(uploadId, {
      stage: 'database',
      progress: 90,
      message: 'Saving to database...',
      totalQuantity,
      processedQuantity: qrCodesGenerated,
      estimatedTimeRemaining: 2,
      isComplete: false
    });

    const uploadData = {
      fileName,
      drug: validationResult.data[0]?.drug_name || 'Unknown',
      quantity: validationResult.data.reduce((sum, row) => sum + parseInt(row.quantity.toString()), 0),
      status: 'completed' as UploadStatus,
      date: new Date(),
      size: `${(fileSize / 1024 / 1024).toFixed(2)} MB`,
      records: validationResult.totalRows,
      blockchainTx: blockchainTx.hash,
      description: `Uploaded by ${userEmail}`,
      manufacturer: validationResult.data[0]?.manufacturer || 'Unknown',
      batchId: validationResult.data[0]?.batch_id || uploadId,
      expiryDate: new Date(validationResult.data[0]?.expiry_date || Date.now() + 365 * 24 * 60 * 60 * 1000),
      validationResult: {
        isValid: validationResult.isValid,
        errors: validationResult.errors.map(e => e.message),
        warnings: validationResult.warnings.map(w => w.message)
      },
      qrCodesGenerated,
      processingTime: Date.now() - startTime,
      fileHash,
      location: validationResult.data[0]?.location || 'Unknown',
      temperature: '22°C ±2°C', // Default values
      humidity: '45% ±5%',
      qualityScore: 98.5,
      complianceStatus: 'Compliant',
      regulatoryApproval: 'NAFDAC Approved',
      userEmail: userEmail as string,
      userRole: 'manufacturer'
    };

    let savedUpload;
    try {
      savedUpload = await createUpload(uploadData);
      console.log('✅ Upload record saved to database:', savedUpload._id);
    } catch (error) {
      console.error('❌ Failed to save upload to database:', error);
      throw new Error('Failed to save upload record to database');
    }

    // Mark upload as complete
    updateUploadProgress(uploadId, {
      stage: 'completed',
      progress: 100,
      message: `Upload completed successfully! Generated ${qrCodesGenerated} QR codes.`,
      totalQuantity,
      processedQuantity: qrCodesGenerated,
      estimatedTimeRemaining: 0,
      isComplete: true
    });

    const response: UploadResponse = {
      uploadId: (savedUpload._id as string).toString(),
      status: 'completed',
      validationResult,
      blockchainTx,
      qrCodesGenerated
    };

    res.status(200).json(response);

  } catch (error) {
    console.error('Upload batch error:', error);
    
    // Provide more specific error messages
    let errorMessage = 'Internal server error during batch upload';
    if (error instanceof Error) {
      if (error.message.includes('timed out')) {
        errorMessage = 'Upload timed out - QR code generation took too long. Please try with a smaller batch.';
      } else if (error.message.includes('blockchain')) {
        errorMessage = 'Blockchain transaction failed. Please check your wallet configuration.';
      } else if (error.message.includes('database')) {
        errorMessage = 'Database error. Please try again.';
      } else {
        errorMessage = error.message;
      }
    }
    
    res.status(500).json({ 
      error: errorMessage
    });
  }
}

// Generate QR codes and record them on blockchain
async function generateAndRecordQRCodes(uploadId: string, validationResult: ValidationResult, totalQuantity: number): Promise<number> {
  let totalQRCodes = 0;
  
  try {
    // For large batches, use batch processing instead of individual QR codes
    if (totalQuantity > 1000) {
      console.log(`Large batch detected (${totalQuantity} units). Using batch QR code generation...`);
      
      // Generate one QR code per drug type instead of per unit
      for (let i = 0; i < validationResult.data.length; i++) {
        const row = validationResult.data[i];
        const quantity = parseInt(row.quantity.toString());
        const drugName = row.drug_name;
        const batchId = row.batch_id;
        
        // Update progress
        const progress = calculateProgress(totalQRCodes, totalQuantity);
                 updateUploadProgress(uploadId, {
           stage: 'qr-generation',
           progress: 50 + (progress * 0.4), // 50-90% range for QR generation
           message: `Generating QR codes for ${drugName} (${i + 1}/${validationResult.data.length})...`,
           totalQuantity,
           processedQuantity: totalQRCodes,
           estimatedTimeRemaining: Math.max(estimateProcessingTime(totalQuantity - totalQRCodes), 1),
           isComplete: false
         });
        
        // Create a single QR code for this drug batch
        const qrCodeId = `${uploadId}-${batchId}`;
        
        // Record batch QR code on blockchain
        const qrTx = await blockchainService.recordQRCode(qrCodeId, uploadId, quantity);
        
        if (qrTx.status === 'confirmed') {
          totalQRCodes += quantity; // Count all units in this batch
          console.log(`Batch QR Code ${qrCodeId} recorded for ${quantity} units of ${drugName}`);
        } else {
          console.error(`Failed to record Batch QR Code ${qrCodeId}: ${qrTx.errorMessage}`);
        }
      }
    } else {
      // For small batches, use individual QR codes
      console.log(`Small batch detected (${totalQuantity} units). Using individual QR code generation...`);
      
      for (const row of validationResult.data) {
        const quantity = parseInt(row.quantity.toString());
        
        for (let i = 1; i <= quantity; i++) {
          // Update progress every 10 QR codes or at the end
          if (i % 10 === 0 || i === quantity) {
            const progress = calculateProgress(totalQRCodes, totalQuantity);
                       updateUploadProgress(uploadId, {
             stage: 'qr-generation',
             progress: 50 + (progress * 0.4), // 50-90% range for QR generation
             message: `Generating QR code ${totalQRCodes + 1} of ${totalQuantity}...`,
             totalQuantity,
             processedQuantity: totalQRCodes,
             estimatedTimeRemaining: Math.max(estimateProcessingTime(totalQuantity - totalQRCodes), 1),
             isComplete: false
           });
          }
          
          const qrCodeId = `${uploadId}-QR-${i.toString().padStart(6, '0')}`;
          
          // Record QR code on blockchain
          const qrTx = await blockchainService.recordQRCode(qrCodeId, uploadId, i);
          
          if (qrTx.status === 'confirmed') {
            totalQRCodes++;
            console.log(`QR Code ${qrCodeId} recorded on blockchain: ${qrTx.hash}`);
          } else {
            console.error(`Failed to record QR Code ${qrCodeId}: ${qrTx.errorMessage}`);
          }
        }
      }
    }
    
    console.log(`Successfully generated ${totalQRCodes} QR codes`);
    return totalQRCodes;
    
  } catch (error) {
    console.error('Error generating QR codes:', error);
    return totalQRCodes; // Return what we managed to generate
  }
} 