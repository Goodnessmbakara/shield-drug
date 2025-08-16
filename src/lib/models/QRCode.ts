import mongoose, { Schema, Document } from 'mongoose';

export interface IQRCode {
  qrCodeId: string;
  uploadId: string;
  userEmail: string;
  drugCode: string;
  serialNumber: number;
  blockchainTx?: {
    hash: string;
    status: string;
    blockNumber?: number;
    timestamp: string;
  };
  verificationUrl: string;
  imageUrl: string;
  metadata: {
    drugName: string;
    batchId: string;
    manufacturer: string;
    expiryDate: string;
    quantity: number;
  };
  status: string;
  downloadCount: number;
  verificationCount: number;
  isScanned: boolean;
  scannedAt?: Date;
  scannedBy?: string;
  scannedLocation?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IQRCodeModel extends mongoose.Model<IQRCode> {
  isQRCodeIdUnique(qrCodeId: string): Promise<boolean>;
  generateUniqueQRCodeId(uploadId: string, drugCode: string, serialNumber: number, maxAttempts?: number): Promise<string>;
}

const QRCodeSchema = new Schema({
  qrCodeId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    validate: {
      validator: function(v: string): boolean {
        return Boolean(v && v.length > 0 && v !== null && v !== undefined);
      },
      message: 'QR Code ID cannot be null or empty'
    }
  },
  uploadId: {
    type: String,
    required: true,
    trim: true
  },
  userEmail: {
    type: String,
    required: true,
    trim: true
  },
  drugCode: {
    type: String,
    required: true,
    trim: true
  },
  serialNumber: {
    type: Number,
    required: true,
    min: [1, 'Serial number must be at least 1']
  },
  blockchainTx: {
    hash: {
      type: String,
      trim: true
    },
    status: {
      type: String,
      trim: true
    },
    blockNumber: {
      type: Number
    },
    timestamp: {
      type: String,
      trim: true
    }
  },
  verificationUrl: {
    type: String,
    required: true,
    trim: true
  },
  imageUrl: {
    type: String,
    required: true,
    trim: true
  },
  metadata: {
    drugName: {
      type: String,
      required: true,
      trim: true
    },
    batchId: {
      type: String,
      required: true,
      trim: true
    },
    manufacturer: {
      type: String,
      required: true,
      trim: true
    },
    expiryDate: {
      type: String,
      required: true,
      trim: true
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1']
    }
  },
  status: {
    type: String,
    default: 'generated',
    trim: true,
    enum: {
      values: ['generated', 'verified', 'expired', 'recalled', 'invalid'],
      message: 'Status must be one of: generated, verified, expired, recalled, invalid'
    }
  },
  downloadCount: {
    type: Number,
    default: 0,
    min: [0, 'Download count cannot be negative']
  },
  verificationCount: {
    type: Number,
    default: 0,
    min: [0, 'Verification count cannot be negative']
  },
  isScanned: {
    type: Boolean,
    default: false
  },
  scannedAt: {
    type: Date
  },
  scannedBy: {
    type: String,
    trim: true
  },
  scannedLocation: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Create indexes for better query performance and uniqueness
QRCodeSchema.index({ qrCodeId: 1 }, { unique: true });
QRCodeSchema.index({ uploadId: 1 });
QRCodeSchema.index({ batchId: 1 });
QRCodeSchema.index({ isScanned: 1 });
QRCodeSchema.index({ manufacturer: 1 });
QRCodeSchema.index({ drugName: 1 });
QRCodeSchema.index({ userEmail: 1 });
QRCodeSchema.index({ createdAt: -1 });

// Compound indexes for better query performance
QRCodeSchema.index({ uploadId: 1, serialNumber: 1 });
QRCodeSchema.index({ userEmail: 1, createdAt: -1 });
QRCodeSchema.index({ status: 1, createdAt: -1 });

// Pre-save middleware to ensure qrCodeId is not null
QRCodeSchema.pre('save', function(next) {
  if (!this.qrCodeId || (typeof this.qrCodeId === 'string' && this.qrCodeId.trim() === '')) {
    return next(new Error('QR Code ID cannot be null or empty'));
  }
  
  // Ensure qrCodeId follows the expected format
  if (!this.qrCodeId.startsWith('QR-') || this.qrCodeId.length < 5) {
    return next(new Error('QR Code ID must follow the format QR-XXXXXXXX'));
  }
  
  next();
});

// Pre-validate middleware to check for duplicates
QRCodeSchema.pre('save', async function(next) {
  if (this.isNew) {
    try {
      const existingQRCode = await (this.constructor as any).findOne({ qrCodeId: this.qrCodeId });
      if (existingQRCode) {
        return next(new Error(`QR Code ID ${this.qrCodeId} already exists`));
      }
    } catch (error) {
      // If we can't check for duplicates, continue with save
      console.warn('Could not check for QR code duplicates:', error);
    }
  }
  next();
});

// Static method to check if QR code ID exists
QRCodeSchema.statics.isQRCodeIdUnique = async function(qrCodeId: string): Promise<boolean> {
  try {
    const existingQRCode = await this.findOne({ qrCodeId });
    return !existingQRCode;
  } catch (error) {
    console.error('Error checking QR code uniqueness:', error);
    return false;
  }
};

// Static method to generate unique QR code ID
QRCodeSchema.statics.generateUniqueQRCodeId = async function(
  uploadId: string,
  drugCode: string,
  serialNumber: number,
  maxAttempts: number = 10
): Promise<string> {
  const crypto = require('crypto');
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const uuid = crypto.randomUUID();
      const timestamp = Date.now();
      const processId = process.pid || Math.floor(Math.random() * 10000);
      const randomPart = Math.random().toString(36).substring(2, 8);
      
      const uniqueString = `${uploadId}-${drugCode}-${serialNumber}-${timestamp}-${processId}-${uuid}-${randomPart}`;
      const hash = crypto.createHash('sha256').update(uniqueString).digest('hex');
      const shortHash = hash.substring(0, 8).toUpperCase();
      const qrCodeId = `QR-${shortHash}`;
      
      // Check if this ID is unique
      const isUnique = await (this as any).isQRCodeIdUnique(qrCodeId);
      if (isUnique) {
        return qrCodeId;
      }
      
      // Add small delay before retry
      await new Promise(resolve => setTimeout(resolve, 10));
    } catch (error) {
      console.error(`Error generating QR code ID (attempt ${attempt}):`, error);
      if (attempt === maxAttempts) {
        throw new Error(`Failed to generate unique QR code ID after ${maxAttempts} attempts`);
      }
    }
  }
  
  throw new Error(`Failed to generate unique QR code ID after ${maxAttempts} attempts`);
};

export default mongoose.models.QRCode || mongoose.model<IQRCode, IQRCodeModel>('QRCode', QRCodeSchema);