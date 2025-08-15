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

// Pre-save middleware to ensure qrCodeId is not null
QRCodeSchema.pre('save', function(next) {
  if (!this.qrCodeId || (typeof this.qrCodeId === 'string' && this.qrCodeId.trim() === '')) {
    return next(new Error('QR Code ID cannot be null or empty'));
  }
  next();
});

export default mongoose.models.QRCode || mongoose.model<IQRCode>('QRCode', QRCodeSchema);