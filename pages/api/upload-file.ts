import { NextApiRequest, NextApiResponse } from 'next';
import { createUpload } from '@/lib/db-utils';
import { IncomingForm } from 'formidable';
import { promises as fs } from 'fs';
import path from 'path';

// Disable body parsing, we'll handle it with formidable
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse form data (file upload handled by Next.js API route)
    const form = new IncomingForm({
      maxFileSize: Number(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
      allowEmptyFiles: false,
      filter: ({ mimetype }) => {
        return Boolean(mimetype && mimetype.includes('csv'));
      },
    });

    const [fields, files] = await new Promise<[any, any]>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve([fields, files]);
      });
    });

    const file = files.file?.[0];
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Validate file type
    if (!file.mimetype?.includes('csv')) {
      return res.status(400).json({ error: 'Only CSV files are allowed' });
    }

    // Create upload directory if it doesn't exist
    const uploadDir = process.env.UPLOAD_DIR || './public/uploads';
    await fs.mkdir(uploadDir, { recursive: true });

    // Generate unique filename
    const timestamp = Date.now();
    const fileName = `${timestamp}-${file.originalFilename}`;
    const filePath = path.join(uploadDir, fileName);

    // Move file to upload directory
    await fs.copyFile(file.filepath, filePath);
    await fs.unlink(file.filepath); // Clean up temp file

    // Calculate file hash (simplified - in production use crypto)
    const fileBuffer = await fs.readFile(filePath);
    const fileHash = `sha256:${Buffer.from(fileBuffer).toString('hex').substring(0, 64)}`;

    // Create upload record in database (same server)
    const uploadData = {
      fileName: file.originalFilename,
      drug: fields.drug?.[0] || 'Unknown Drug',
      quantity: parseInt(fields.quantity?.[0]) || 0,
      manufacturer: fields.manufacturer?.[0] || 'Unknown Manufacturer',
      batchId: fields.batchId?.[0] || `BATCH-${timestamp}`,
      expiryDate: new Date(fields.expiryDate?.[0] || Date.now() + 365 * 24 * 60 * 60 * 1000),
      description: fields.description?.[0] || '',
      size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
      records: parseInt(fields.records?.[0]) || 0,
      fileHash,
      userEmail: fields.userEmail?.[0] || 'unknown@example.com',
      userRole: fields.userRole?.[0] || 'manufacturer',
      status: 'pending' as const,
      location: fields.location?.[0] || 'Unknown Location',
      temperature: fields.temperature?.[0] || 'Unknown',
      humidity: fields.humidity?.[0] || 'Unknown'
    };

    const newUpload = await createUpload(uploadData);

    return res.status(201).json({
      message: 'File uploaded successfully',
      upload: {
        id: newUpload._id,
        fileName: newUpload.fileName,
        fileHash: newUpload.fileHash,
        status: newUpload.status,
        size: newUpload.size
      },
      filePath: `/uploads/${fileName}`
    });

  } catch (error) {
    console.error('Upload Error:', error);
    return res.status(500).json({
      error: 'Upload failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 