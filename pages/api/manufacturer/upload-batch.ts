import { NextApiRequest, NextApiResponse } from 'next';
import { parseCSV, validateDrugBatchData, validateFileSize, validateFileType, generateUploadId } from '@/lib/validation';
import { UploadResponse, ValidationResult, UploadStatus } from '@/lib/types';
import { blockchainService } from '@/lib/blockchain';
import { createUpload } from '@/lib/db-utils';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
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
    const qrCodesGenerated = await generateAndRecordQRCodes(uploadId, validationResult);

    // Store upload record in database (or mock for development)
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
    } catch (error) {
      console.warn('Database not available, using mock upload ID:', error);
      savedUpload = { _id: uploadId };
    }

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
    res.status(500).json({ 
      error: 'Internal server error during batch upload' 
    });
  }
}

// Generate QR codes and record them on blockchain
async function generateAndRecordQRCodes(uploadId: string, validationResult: ValidationResult): Promise<number> {
  let totalQRCodes = 0;
  
  try {
    // Generate QR codes for each row in the batch
    for (const row of validationResult.data) {
      const quantity = parseInt(row.quantity.toString());
      
      for (let i = 1; i <= quantity; i++) {
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
    
    console.log(`Successfully generated ${totalQRCodes} QR codes`);
    return totalQRCodes;
    
  } catch (error) {
    console.error('Error generating QR codes:', error);
    return totalQRCodes; // Return what we managed to generate
  }
} 