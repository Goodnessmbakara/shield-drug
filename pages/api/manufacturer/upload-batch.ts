import { NextApiRequest, NextApiResponse } from 'next';
import { parseCSV, validateDrugBatchData, validateFileSize, validateFileType, generateUploadId } from '@/lib/validation';
import { UploadResponse, ValidationResult, UploadStatus } from '@/lib/types';
import { blockchainService } from '@/lib/blockchain';
import { createUpload, checkBatchIdExists } from '@/lib/db-utils';
import { updateUploadProgress, estimateProcessingTime, calculateProgress } from './upload-progress';
import QRCode from '@/lib/models/QRCode';
import { qrCodeService } from '@/lib/qr-code';
import { generateUniqueQRCodeId, sanitizeQRCodeData, validateQRCodeId } from '@/lib/utils';
import mongoose from 'mongoose';

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

    // Get file data and metadata from request
    const { fileContent, fileName, fileSize, metadata, clientUploadId } = req.body;

    if (!fileContent || !fileName) {
      return res.status(400).json({ error: 'File content and name are required' });
    }

    // Extract metadata (optional)
    const formMetadata = metadata || {};
    const {
      drugName: formDrugName,
      batchId: formBatchId,
      manufacturer: formManufacturer,
      description: formDescription
    } = formMetadata;

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

    // Generate upload ID (use client-provided if present so frontend can poll immediately)
    const uploadId = typeof clientUploadId === 'string' && clientUploadId.length > 0
      ? clientUploadId
      : generateUploadId();

    // Check for duplicate batch IDs before processing
    const uniqueBatchIds = new Set<string>();
    const duplicateBatchIds: string[] = [];
    
    for (const row of validationResult.data) {
      const batchId = row.batch_id;
      if (uniqueBatchIds.has(batchId)) {
        duplicateBatchIds.push(batchId);
      } else {
        uniqueBatchIds.add(batchId);
        // Check if batch ID already exists in database
        const exists = await checkBatchIdExists(batchId, userEmail as string);
        if (exists) {
          duplicateBatchIds.push(batchId);
        }
      }
    }

    if (duplicateBatchIds.length > 0) {
      updateUploadProgress(uploadId, {
        stage: 'validation',
        progress: 0,
        message: 'Duplicate batch IDs found',
        totalQuantity: 0,
        processedQuantity: 0,
        estimatedTimeRemaining: 0,
        isComplete: true,
        error: `Duplicate batch IDs detected: ${duplicateBatchIds.join(', ')}`
      });

      return res.status(400).json({
        error: `Duplicate batch IDs detected: ${duplicateBatchIds.join(', ')}. These batches have already been uploaded.`,
        uploadId,
        status: 'failed' as UploadStatus,
        validationResult: {
          ...validationResult,
          isValid: false,
          errors: [
            ...validationResult.errors,
            ...duplicateBatchIds.map(id => ({
              row: 0,
              column: 'batch_id',
              value: id,
              message: `Batch ID '${id}' already exists in the database`,
              severity: 'error' as const
            }))
          ]
        }
      });
    }

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

    // Start QR code generation without timeout - let it complete naturally
    console.log('⏳ Starting QR code generation...');
    const qrCodesGenerated = await generateAndRecordQRCodes(uploadId, validationResult, totalQuantity, userEmail as string);
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
      drug: formDrugName || validationResult.data[0]?.drug_name || 'Unknown',
      quantity: validationResult.data.reduce((sum, row) => sum + parseInt(row.quantity.toString()), 0),
      status: 'completed' as UploadStatus,
      date: new Date(),
      size: `${(fileSize / 1024 / 1024).toFixed(2)} MB`,
      records: validationResult.totalRows,
      blockchainTx: blockchainTx.hash,
      description: formDescription || `Uploaded by ${userEmail}`,
      manufacturer: formManufacturer || validationResult.data[0]?.manufacturer || 'Unknown',
      batchId: formBatchId || validationResult.data[0]?.batch_id || uploadId,
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
      userRole: 'manufacturer',
      // Store form metadata for future reference
      formMetadata: {
        drugName: formDrugName,
        batchId: formBatchId,
        manufacturer: formManufacturer,
        description: formDescription
      }
    };

    let savedUpload;
    try {
      savedUpload = await createUpload(uploadData);
      console.log('✅ Upload record saved to database:', savedUpload._id);
    } catch (error) {
      console.error('❌ Failed to save upload to database:', error);
      
      // Update progress with error
      updateUploadProgress(uploadId, {
        stage: 'database',
        progress: 0,
        message: 'Failed to save to database',
        totalQuantity,
        processedQuantity: qrCodesGenerated,
        estimatedTimeRemaining: 0,
        isComplete: true,
        error: error instanceof Error ? error.message : 'Database save failed'
      });
      
      // Handle duplicate key error specifically
      if (error instanceof Error && error.message.includes('E11000') && error.message.includes('batchId')) {
        const match = error.message.match(/dup key: { batchId: "([^"]+)" }/);
        const duplicateBatchId = match ? match[1] : 'unknown';
        throw new Error(`Batch ID "${duplicateBatchId}" already exists. Please use a different batch ID or check if this batch was already uploaded by you or another user.`);
      }
      
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
      uploadId: uploadId,
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
      if (error.message.includes('blockchain')) {
        errorMessage = 'Blockchain transaction failed. Please check your wallet configuration.';
      } else if (error.message.includes('database')) {
        errorMessage = 'Database error. Please try again.';
      } else if (error.message.includes('validation')) {
        errorMessage = 'Data validation failed. Please check your CSV file format.';
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
async function generateAndRecordQRCodes(uploadId: string, validationResult: ValidationResult, totalQuantity: number, userEmail: string): Promise<number> {
  let totalQRCodes = 0;
  const transactionTimes: number[] = [];
  const startTime = Date.now();
  
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
        
                  // Create a unique QR code for this drug batch using the utility function
          const qrCodeId = generateUniqueQRCodeId(uploadId, drugName, 1);
        
        // Record batch QR code on blockchain with time tracking
        const txStartTime = Date.now();
        const qrTx = await blockchainService.recordQRCode(qrCodeId, uploadId, quantity);
        const txTime = Date.now() - txStartTime;
        transactionTimes.push(txTime);
        
        if (qrTx.status === 'confirmed') {
          totalQRCodes += quantity; // Count all units in this batch
          console.log(`Batch QR Code ${qrCodeId} recorded for ${quantity} units of ${drugName} in ${txTime}ms`);
          
          // Store QR code in database
          try {
            const qrCodeData = await qrCodeService.generateQRCode(
              uploadId,
              drugName,
              1, // Serial number for batch QR code
              {
                drugName: drugName,
                batchId: batchId,
                manufacturer: row.manufacturer || 'Unknown',
                expiryDate: row.expiry_date || new Date().toISOString(),
                quantity: quantity
              }
            );

            // Validate and sanitize QR code data before saving
            if (!validateQRCodeId(qrCodeId)) {
              throw new Error(`Invalid QR Code ID format: ${qrCodeId}`);
            }

            const qrCodeDataToSave = sanitizeQRCodeData({
              qrCodeId: qrCodeId,
              uploadId: uploadId,
              userEmail: userEmail,
              drugCode: qrCodeData.drugCode,
              serialNumber: 1,
              blockchainTx: qrTx.hash,
              verificationUrl: qrCodeData.verificationUrl,
              imageUrl: qrCodeService.generateQRCodeImageUrl(qrCodeData),
              metadata: qrCodeData.metadata,
              status: 'generated',
              downloadCount: 0,
              verificationCount: 0
            });

            const qrCodeDoc = new QRCode(qrCodeDataToSave);
            await qrCodeDoc.save();
            console.log(`✅ QR Code ${qrCodeId} saved to database`);
          } catch (dbError) {
            console.error(`❌ Failed to save QR Code ${qrCodeId} to database:`, dbError);
            // Continue with blockchain record even if DB save fails
          }
          
          // Calculate average transaction time and estimate remaining time
          const avgTxTime = transactionTimes.reduce((sum, time) => sum + time, 0) / transactionTimes.length;
          const remainingBatches = validationResult.data.length - (i + 1);
          const estimatedRemainingTime = Math.ceil((avgTxTime * remainingBatches) / 1000);
          
          // Update progress with real-time estimation
          const progress = calculateProgress(totalQRCodes, totalQuantity);
          updateUploadProgress(uploadId, {
            stage: 'qr-generation',
            progress: 50 + (progress * 0.4), // 50-90% range for QR generation
            message: `Generating QR codes for ${drugName} (${i + 1}/${validationResult.data.length})...`,
            totalQuantity,
            processedQuantity: totalQRCodes,
            estimatedTimeRemaining: estimatedRemainingTime,
            isComplete: false
          });
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
            // Calculate average transaction time and estimate remaining time
            const avgTxTime = transactionTimes.reduce((sum, time) => sum + time, 0) / transactionTimes.length;
            const remainingQRCodes = totalQuantity - totalQRCodes;
            const estimatedRemainingTime = Math.ceil((avgTxTime * remainingQRCodes) / 1000);
            
            const progress = calculateProgress(totalQRCodes, totalQuantity);
            updateUploadProgress(uploadId, {
              stage: 'qr-generation',
              progress: 50 + (progress * 0.4), // 50-90% range for QR generation
              message: `Generating QR code ${totalQRCodes + 1} of ${totalQuantity}...`,
              totalQuantity,
              processedQuantity: totalQRCodes,
              estimatedTimeRemaining: Math.max(estimatedRemainingTime, 1),
              isComplete: false
            });
          }
          
          const qrCodeId = generateUniqueQRCodeId(uploadId, row.drug_name, i);
          
          // Record QR code on blockchain with time tracking
          const txStartTime = Date.now();
          const qrTx = await blockchainService.recordQRCode(qrCodeId, uploadId, i);
          const txTime = Date.now() - txStartTime;
          transactionTimes.push(txTime);
          
          if (qrTx.status === 'confirmed') {
            totalQRCodes++;
            console.log(`QR Code ${qrCodeId} recorded on blockchain: ${qrTx.hash} in ${txTime}ms`);
            
            // Store QR code in database
            try {
              const qrCodeData = await qrCodeService.generateQRCode(
                uploadId,
                row.drug_name,
                i,
                {
                  drugName: row.drug_name,
                  batchId: row.batch_id,
                  manufacturer: row.manufacturer || 'Unknown',
                  expiryDate: row.expiry_date || new Date().toISOString(),
                  quantity: 1
                }
              );

              // Validate and sanitize QR code data before saving
              if (!validateQRCodeId(qrCodeId)) {
                throw new Error(`Invalid QR Code ID format: ${qrCodeId}`);
              }

              const qrCodeDataToSave = sanitizeQRCodeData({
                qrCodeId: qrCodeId,
                uploadId: uploadId,
                userEmail: userEmail,
                drugCode: qrCodeData.drugCode,
                serialNumber: i,
                blockchainTx: qrTx.hash,
                verificationUrl: qrCodeData.verificationUrl,
                imageUrl: qrCodeService.generateQRCodeImageUrl(qrCodeData),
                metadata: qrCodeData.metadata,
                status: 'generated',
                downloadCount: 0,
                verificationCount: 0
              });

              const qrCodeDoc = new QRCode(qrCodeDataToSave);
              await qrCodeDoc.save();
              console.log(`✅ QR Code ${qrCodeId} saved to database`);
            } catch (dbError) {
              console.error(`❌ Failed to save QR Code ${qrCodeId} to database:`, dbError);
              // Continue with blockchain record even if DB save fails
            }
          } else {
            console.error(`Failed to record QR Code ${qrCodeId}: ${qrTx.errorMessage}`);
          }
        }
      }
    }
    
    const totalTime = Date.now() - startTime;
    const avgTxTime = transactionTimes.length > 0 ? transactionTimes.reduce((sum, time) => sum + time, 0) / transactionTimes.length : 0;
    
    console.log(`✅ Successfully generated ${totalQRCodes} QR codes in ${totalTime}ms`);
    console.log(`📊 Transaction Statistics:`);
    console.log(`   - Total transactions: ${transactionTimes.length}`);
    console.log(`   - Average transaction time: ${avgTxTime.toFixed(0)}ms`);
    console.log(`   - Fastest transaction: ${Math.min(...transactionTimes)}ms`);
    console.log(`   - Slowest transaction: ${Math.max(...transactionTimes)}ms`);
    
    return totalQRCodes;
    
  } catch (error) {
    console.error('Error generating QR codes:', error);
    return totalQRCodes; // Return what we managed to generate
  }
} 