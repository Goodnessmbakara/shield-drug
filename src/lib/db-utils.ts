import dbConnect from './database';
import Upload from './models/Upload';
import User from './models/User';
import QRCode from './models/QRCode';
import { IUpload, IUser, IQRCode } from './models';

// Upload operations
export const createUpload = async (uploadData: Partial<IUpload>): Promise<IUpload> => {
  await dbConnect();
  const upload = new Upload(uploadData);
  return await upload.save();
};

export const checkBatchIdExists = async (batchId: string, userEmail?: string): Promise<boolean> => {
  await dbConnect();
  const query: any = { batchId };
  if (userEmail) {
    query.userEmail = userEmail;
  }
  const existing = await Upload.findOne(query);
  return !!existing;
};

/**
 * Generate a unique batch ID by appending a version suffix if the original already exists
 * @param baseBatchId The original batch ID to make unique
 * @param userEmail Optional user email to scope the uniqueness check
 * @returns A unique batch ID (original if unique, or with _v2, _v3, etc. suffix)
 */
export const generateUniqueBatchId = async (
  baseBatchId: string,
  userEmail?: string
): Promise<{ uniqueBatchId: string; wasModified: boolean }> => {
  await dbConnect();
  
  // First check if the original batch ID is available
  const originalExists = await checkBatchIdExists(baseBatchId, userEmail);
  if (!originalExists) {
    return { uniqueBatchId: baseBatchId, wasModified: false };
  }
  
  // If it exists, try appending version suffixes (_v2, _v3, etc.)
  let version = 2;
  let uniqueBatchId = `${baseBatchId}_v${version}`;
  let exists = await checkBatchIdExists(uniqueBatchId, userEmail);
  
  // Keep incrementing version until we find a unique one
  while (exists && version < 1000) {
    version++;
    uniqueBatchId = `${baseBatchId}_v${version}`;
    exists = await checkBatchIdExists(uniqueBatchId, userEmail);
  }
  
  if (version >= 1000) {
    // Fallback to timestamp if we can't find a unique version
    const timestamp = Date.now().toString(36).slice(-6);
    uniqueBatchId = `${baseBatchId}_${timestamp}`;
  }
  
  return { uniqueBatchId, wasModified: true };
};

export const getUploadById = async (id: string): Promise<IUpload | null> => {
  await dbConnect();
  return await Upload.findById(id);
};

export const getUploadsByUser = async (userEmail: string, limit = 10): Promise<IUpload[]> => {
  await dbConnect();
  return await Upload.find({ userEmail })
    .sort({ createdAt: -1 })
    .limit(limit);
};

export const updateUploadStatus = async (id: string, status: string, additionalData?: any): Promise<IUpload | null> => {
  await dbConnect();
  return await Upload.findByIdAndUpdate(
    id,
    { status, ...additionalData },
    { new: true }
  );
};

// User operations
export const createUser = async (userData: Partial<IUser>): Promise<IUser> => {
  await dbConnect();
  const user = new User(userData);
  return await user.save();
};

export const getUserByEmail = async (email: string): Promise<IUser | null> => {
  await dbConnect();
  return await User.findOne({ email });
};

export const updateUserLastLogin = async (email: string): Promise<IUser | null> => {
  await dbConnect();
  return await User.findOneAndUpdate(
    { email },
    { lastLogin: new Date() },
    { new: true }
  );
};

// QR Code operations
export const createQRCode = async (qrData: Partial<IQRCode>): Promise<IQRCode> => {
  await dbConnect();
  const qrCode = new QRCode(qrData);
  return await qrCode.save();
};

export const getQRCodesByUpload = async (uploadId: string): Promise<IQRCode[]> => {
  await dbConnect();
  return await QRCode.find({ uploadId }).sort({ serialNumber: 1 });
};

export const markQRCodeAsScanned = async (
  qrCodeId: string, 
  scannedBy: string, 
  scannedLocation?: string
): Promise<IQRCode | null> => {
  await dbConnect();
  return await QRCode.findOneAndUpdate(
    { qrCodeId },
    { 
      isScanned: true, 
      scannedAt: new Date(),
      scannedBy,
      scannedLocation
    },
    { new: true }
  );
};

// Analytics operations
export const getUploadStats = async (userEmail?: string) => {
  await dbConnect();
  
  const matchStage = userEmail ? { userEmail } : {};
  
  const stats = await Upload.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalUploads: { $sum: 1 },
        successfulUploads: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        failedUploads: {
          $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
        },
        totalRecords: { $sum: '$records' },
        totalQuantity: { $sum: '$quantity' }
      }
    }
  ]);

  return stats[0] || {
    totalUploads: 0,
    successfulUploads: 0,
    failedUploads: 0,
    totalRecords: 0,
    totalQuantity: 0
  };
};

export const getQRCodeStats = async (uploadId?: string) => {
  await dbConnect();
  
  const matchStage = uploadId ? { uploadId } : {};
  
  const stats = await QRCode.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalQRCodes: { $sum: 1 },
        scannedQRCodes: {
          $sum: { $cond: ['$isScanned', 1, 0] }
        },
        unScannedQRCodes: {
          $sum: { $cond: ['$isScanned', 0, 1] }
        }
      }
    }
  ]);

  return stats[0] || {
    totalQRCodes: 0,
    scannedQRCodes: 0,
    unScannedQRCodes: 0
  };
};

// Search operations
export const searchUploads = async (
  query: string,
  userEmail?: string,
  limit = 20
): Promise<IUpload[]> => {
  await dbConnect();
  
  const searchQuery: any = {
    $or: [
      { drug: { $regex: query, $options: 'i' } },
      { batchId: { $regex: query, $options: 'i' } },
      { manufacturer: { $regex: query, $options: 'i' } },
      { fileName: { $regex: query, $options: 'i' } }
    ]
  };

  if (userEmail) {
    searchQuery.userEmail = userEmail;
  }

  return await Upload.find(searchQuery)
    .sort({ createdAt: -1 })
    .limit(limit);
}; 