import { NextApiRequest, NextApiResponse } from 'next';
import { parseCSV, validateDrugBatchData, validateFileSize, validateFileType, generateUploadId } from '@/lib/validation';
import { UploadResponse, ValidationResult, UploadStatus } from '@/lib/types';

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

    // Simulate blockchain transaction (in a real app, this would interact with actual blockchain)
    const blockchainTx = await simulateBlockchainTransaction(uploadId, validationResult);

    // Simulate QR code generation
    const qrCodesGenerated = await simulateQRCodeGeneration(uploadId, validationResult);

    // Store upload record (in a real app, this would be saved to database)
    const uploadRecord = {
      id: uploadId,
      fileName,
      drug: validationResult.data[0]?.drug_name || 'Unknown',
      quantity: validationResult.data.reduce((sum, row) => sum + parseInt(row.quantity.toString()), 0),
      status: 'completed' as UploadStatus,
      date: new Date().toISOString(),
      size: `${(fileSize / 1024 / 1024).toFixed(2)} MB`,
      records: validationResult.totalRows,
      blockchainTx: blockchainTx.hash,
      manufacturer: userEmail as string,
      uploadProgress: 100,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // In a real app, save to database
    // await saveUploadRecord(uploadRecord);

    const response: UploadResponse = {
      uploadId,
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

// Simulate blockchain transaction
async function simulateBlockchainTransaction(uploadId: string, validationResult: ValidationResult): Promise<any> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Generate mock transaction hash
  const hash = '0x' + Math.random().toString(16).substring(2, 10) + '...' + Math.random().toString(16).substring(2, 10);
  
  return {
    hash,
    status: 'confirmed',
    gasUsed: Math.floor(Math.random() * 50000) + 100000,
    gasPrice: Math.floor(Math.random() * 50) + 20,
    blockNumber: Math.floor(Math.random() * 1000000) + 45000000,
    timestamp: new Date().toISOString()
  };
}

// Simulate QR code generation
async function simulateQRCodeGeneration(uploadId: string, validationResult: ValidationResult): Promise<number> {
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Return total number of QR codes generated
  return validationResult.data.reduce((sum, row) => sum + parseInt(row.quantity.toString()), 0);
} 