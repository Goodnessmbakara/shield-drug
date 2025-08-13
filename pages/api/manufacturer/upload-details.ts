import { NextApiRequest, NextApiResponse } from 'next';
import { getUploadById } from '@/lib/db-utils';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check authentication
    const userRole = req.headers['x-user-role'];
    const userEmail = req.headers['x-user-email'];
    
    if (userRole !== 'manufacturer') {
      return res.status(403).json({ error: 'Access denied. Manufacturer role required.' });
    }

    if (!userEmail) {
      return res.status(401).json({ error: 'User email required' });
    }

    // Get upload ID from query
    const { uploadId } = req.query;
    
    if (!uploadId || typeof uploadId !== 'string') {
      return res.status(400).json({ error: 'Upload ID is required' });
    }

    // Get upload details from database
    const upload = await getUploadById(uploadId);
    
    if (!upload) {
      return res.status(404).json({ error: 'Upload not found' });
    }

    // Check if the upload belongs to the authenticated user
    if (upload.userEmail !== userEmail) {
      return res.status(403).json({ error: 'Access denied. This upload does not belong to you.' });
    }

    // Transform the data to match the frontend interface
    const uploadDetails = {
      id: (upload._id as any).toString(),
      fileName: upload.fileName,
      drug: upload.drug,
      quantity: upload.quantity,
      status: upload.status,
      date: upload.createdAt ? new Date(upload.createdAt).toISOString() : new Date().toISOString(),
      size: upload.size,
      records: upload.records,
      blockchainTx: upload.blockchainTx,
      description: upload.description,
      manufacturer: upload.manufacturer,
      batchId: upload.batchId,
      expiryDate: upload.expiryDate ? new Date(upload.expiryDate).toISOString() : new Date().toISOString(),
      validationResult: upload.validationResult,
      qrCodesGenerated: upload.qrCodesGenerated || 0,
      processingTime: upload.processingTime,
      fileHash: upload.fileHash,
      location: upload.location,
      temperature: upload.temperature,
      humidity: upload.humidity,
      qualityScore: upload.qualityScore,
      complianceStatus: upload.complianceStatus,
      regulatoryApproval: upload.regulatoryApproval,
      userEmail: upload.userEmail,
      userRole: upload.userRole,
      createdAt: upload.createdAt ? new Date(upload.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: upload.updatedAt ? new Date(upload.updatedAt).toISOString() : new Date().toISOString()
    };

    res.status(200).json(uploadDetails);

  } catch (error) {
    console.error('Error fetching upload details:', error);
    res.status(500).json({ 
      error: 'Internal server error while fetching upload details' 
    });
  }
}
