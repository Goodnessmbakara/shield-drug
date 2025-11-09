import { NextApiRequest, NextApiResponse } from 'next';
import { parseCSV, validateDrugBatchData, validateFileSize, validateFileType, generateUploadId } from '@/lib/validation';
import { UploadResponse, ValidationResult, UploadStatus } from '@/lib/types';
import { blockchainService } from '@/lib/blockchain';
import { createUpload, checkBatchIdExists, generateUniqueBatchId } from '@/lib/db-utils';
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

    // Determine the base batchId that will be saved to database (same logic as line 244)
    // This is critical - we must check the SAME batchId that will be saved
    const baseBatchId = formBatchId || validationResult.data[0]?.batch_id || uploadId;

    // AUTO-GENERATE UNIQUE BATCH ID: If the batchId already exists, automatically generate a unique one
    // This prevents upload failures and improves UX
    const { uniqueBatchId: finalBatchId, wasModified: batchIdWasModified } = await generateUniqueBatchId(
      baseBatchId,
      userEmail as string
    );

    // If batch ID was modified, log it for transparency
    if (batchIdWasModified) {
      console.log(`ℹ️ Batch ID "${baseBatchId}" already exists globally. Auto-generated unique ID: "${finalBatchId}"`);
      updateUploadProgress(uploadId, {
        stage: 'validation',
        progress: 5,
        message: `Batch ID "${baseBatchId}" already exists (used by another manufacturer). Auto-assigned unique ID: "${finalBatchId}"`,
        totalQuantity: 0,
        processedQuantity: 0,
        estimatedTimeRemaining: 0,
        isComplete: false
      });
    }

    // Check for duplicate batch IDs within the CSV file itself and make them unique
    const batchIdMapping = new Map<string, string>(); // Maps original batch_id to unique batch_id
    const processedBatchIds = new Map<string, number>(); // Tracks how many times each batch ID appears
    
    // First pass: count occurrences of each batch ID in CSV
    for (const row of validationResult.data) {
      const batchId = row.batch_id;
      processedBatchIds.set(batchId, (processedBatchIds.get(batchId) || 0) + 1);
    }
    
    // Second pass: process each row and ensure batch IDs are unique
    const batchIdCounters = new Map<string, number>(); // Track which occurrence we're on
    
    for (let i = 0; i < validationResult.data.length; i++) {
      const row = validationResult.data[i];
      const originalBatchId = row.batch_id;
      const occurrenceCount = processedBatchIds.get(originalBatchId) || 1;
      
      // If this batch ID appears multiple times in CSV, we need unique versions
      if (occurrenceCount > 1) {
        const occurrence = (batchIdCounters.get(originalBatchId) || 0) + 1;
        batchIdCounters.set(originalBatchId, occurrence);
        
        // Generate unique version for this occurrence
        const baseUniqueId = occurrence === 1 ? originalBatchId : `${originalBatchId}_dup${occurrence}`;
        const { uniqueBatchId } = await generateUniqueBatchId(baseUniqueId, userEmail as string);
        
        // Store mapping for this specific occurrence
        const mappingKey = `${originalBatchId}_row${i}`;
        batchIdMapping.set(mappingKey, uniqueBatchId);
        row.batch_id = uniqueBatchId;
        
        console.log(`ℹ️ Duplicate batch ID "${originalBatchId}" in CSV row ${i + 1} (occurrence ${occurrence}/${occurrenceCount}). Using unique ID: "${uniqueBatchId}"`);
      } else {
        // This batch ID appears only once in CSV, but check if it exists in database
        const exists = await checkBatchIdExists(originalBatchId, userEmail as string);
        if (exists) {
          // Generate unique version
          const { uniqueBatchId } = await generateUniqueBatchId(originalBatchId, userEmail as string);
          batchIdMapping.set(originalBatchId, uniqueBatchId);
          row.batch_id = uniqueBatchId;
          console.log(`ℹ️ Batch ID "${originalBatchId}" already exists globally in database. Using unique ID: "${uniqueBatchId}"`);
        } else {
          // Batch ID is unique, no mapping needed
          batchIdMapping.set(originalBatchId, originalBatchId);
        }
      }
    }

    // Collect all batch ID modifications for reporting
    const allModifications: string[] = [];
    for (const [key, uniqueId] of batchIdMapping.entries()) {
      // Extract original batch ID from key (remove _rowX suffix if present)
      const originalBatchId = key.includes('_row') ? key.split('_row')[0] : key;
      if (uniqueId !== originalBatchId) {
        allModifications.push(`${originalBatchId} → ${uniqueId}`);
      }
    }
    
    if (allModifications.length > 0) {
      console.log(`ℹ️ Auto-generated unique batch IDs for ${allModifications.length} duplicate(s):`, allModifications);
    }

    // Calculate total quantity and estimate processing time
    const totalQuantity = validationResult.data.reduce((sum, row) => sum + parseInt(row.quantity.toString()), 0);
    const estimatedTime = estimateProcessingTime(totalQuantity);

    // If validation fails, return errors BEFORE updating progress
    if (!validationResult.isValid) {
      // Log detailed validation errors for debugging
      console.error('❌ Validation failed:', {
        totalErrors: validationResult.errors.length,
        errors: validationResult.errors.map(e => ({
          row: e.row,
          column: e.column,
          message: e.message,
          value: e.value
        }))
      });

      // Update progress with failure status
      updateUploadProgress(uploadId, {
        stage: 'validation',
        progress: 0,
        message: `Validation failed. ${validationResult.errors.length} error(s) found.`,
        totalQuantity,
        processedQuantity: 0,
        estimatedTimeRemaining: 0,
        isComplete: true,
        error: `Validation failed: ${validationResult.errors.map(e => `${e.message} (Row ${e.row}, Column: ${e.column})`).join('; ')}`
      });

      return res.status(400).json({
        error: `Validation failed. ${validationResult.errors.length} error(s) found.`,
        uploadId,
        status: 'failed' as UploadStatus,
        validationResult,
        errorDetails: validationResult.errors.map(e => ({
          row: e.row,
          column: e.column,
          message: e.message,
          value: e.value
        }))
      });
    }

    // Validation passed - update progress with success
    updateUploadProgress(uploadId, {
      stage: 'validation',
      progress: 10,
      message: 'Validation completed successfully',
      totalQuantity,
      processedQuantity: 0,
      estimatedTimeRemaining: estimatedTime,
      isComplete: false
    });

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

    // FINAL SAFEGUARD: Check batchId one more time right before save
    // If it exists (race condition), auto-generate a unique one
    const finalCheckExists = await checkBatchIdExists(uploadData.batchId, userEmail as string);
    if (finalCheckExists) {
      console.log(`⚠️ Race condition detected: Batch ID "${uploadData.batchId}" was just created. Generating unique version...`);
      const { uniqueBatchId: finalUniqueBatchId } = await generateUniqueBatchId(
        uploadData.batchId,
        userEmail as string
      );
      uploadData.batchId = finalUniqueBatchId;
      console.log(`✅ Using unique batch ID: "${finalUniqueBatchId}"`);
      
      // Update progress to inform user
      updateUploadProgress(uploadId, {
        stage: 'database',
        progress: 90,
        message: `Batch ID conflict resolved. Using unique ID: "${finalUniqueBatchId}"`,
        totalQuantity,
        processedQuantity: qrCodesGenerated,
        estimatedTimeRemaining: 1,
        isComplete: false
      });
    }

    let savedUpload;
    try {
      savedUpload = await createUpload(uploadData);
      console.log('✅ Upload record saved to database:', savedUpload._id);
    } catch (error) {
      console.error('❌ Failed to save upload to database:', error);
      
      // Handle duplicate key error by automatically generating a unique batch ID
      if (error instanceof Error && error.message.includes('E11000') && error.message.includes('batchId')) {
        const match = error.message.match(/dup key:.*batchId[^}]*"([^"]+)"/);
        const duplicateBatchId = match ? match[1] : uploadData.batchId;
        
        console.log(`⚠️ Race condition: Batch ID "${duplicateBatchId}" conflict detected. Auto-generating unique ID...`);
        
        // Generate a unique batch ID and update the upload data
        const { uniqueBatchId: resolvedBatchId } = await generateUniqueBatchId(
          duplicateBatchId,
          userEmail as string,
          true // Global check
        );
        
        uploadData.batchId = resolvedBatchId;
        
        // Update progress to inform user
        updateUploadProgress(uploadId, {
          stage: 'database',
          progress: 90,
          message: `Batch ID conflict resolved. Using unique ID: "${resolvedBatchId}"`,
          totalQuantity,
          processedQuantity: qrCodesGenerated,
          estimatedTimeRemaining: 1,
          isComplete: false
        });
        
        // Retry saving with the new unique batch ID
        try {
          savedUpload = await createUpload(uploadData);
          console.log('✅ Upload record saved to database with auto-generated batch ID:', savedUpload._id);
          // Continue with success flow below
        } catch (retryError) {
          console.error('❌ Failed to save upload after batch ID resolution:', retryError);
          
          // Update progress with error
          updateUploadProgress(uploadId, {
            stage: 'database',
            progress: 0,
            message: 'Failed to save to database after resolving batch ID conflict',
            totalQuantity,
            processedQuantity: qrCodesGenerated,
            estimatedTimeRemaining: 0,
            isComplete: true,
            error: retryError instanceof Error ? retryError.message : 'Database save failed'
          });
          
          return res.status(500).json({
            error: 'Failed to save upload record after resolving batch ID conflict. Please try again.',
            uploadId,
            status: 'failed' as UploadStatus,
            validationResult
          });
        }
      } else {
        // Other errors (non-duplicate or non-batchId duplicate)
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
        
        if (error instanceof Error && error.message.includes('E11000')) {
          // Other duplicate key error (not batchId)
          return res.status(409).json({
            error: 'A duplicate record already exists in the database.',
            uploadId,
            status: 'failed' as UploadStatus,
            validationResult
          });
        }
        
        return res.status(500).json({
          error: 'Failed to save upload record to database. Please try again.',
          uploadId,
          status: 'failed' as UploadStatus,
          validationResult
        });
      }
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

    // Prepare response with batch ID modification info if applicable
    const batchIdModifications: string[] = [];
    if (batchIdWasModified) {
      batchIdModifications.push(`${baseBatchId} → ${finalBatchId}`);
    }
    
    // Add CSV batch ID modifications
    for (const [key, uniqueId] of batchIdMapping.entries()) {
      // Extract original batch ID from key (remove _rowX suffix if present)
      const originalBatchId = key.includes('_row') ? key.split('_row')[0] : key;
      if (uniqueId !== originalBatchId) {
        batchIdModifications.push(`${originalBatchId} → ${uniqueId}`);
      }
    }

    const response: UploadResponse = {
      uploadId: uploadId,
      status: 'completed',
      validationResult,
      blockchainTx,
      qrCodesGenerated,
      ...(batchIdModifications.length > 0 && {
        batchIdModifications: {
          message: `Batch ID(s) were auto-modified to ensure uniqueness: ${batchIdModifications.join(', ')}`,
          modifications: batchIdModifications
        }
      })
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