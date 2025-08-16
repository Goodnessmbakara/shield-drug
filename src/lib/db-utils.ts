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