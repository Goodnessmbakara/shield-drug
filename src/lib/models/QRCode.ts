import mongoose, { Schema, Document } from 'mongoose';

export interface IQRCode extends Document {
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

const QRCodeSchema: Schema = new Schema({
  qrCodeId: {
    type: String,
    required: true,
    unique: true,
    trim: true
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
    required: true
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
      required: true
    }
  },
  status: {
    type: String,
    default: 'generated',
    trim: true
  },
  downloadCount: {
    type: Number,
    default: 0
  },
  verificationCount: {
    type: Number,
    default: 0
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

// Create indexes for better query performance
QRCodeSchema.index({ uploadId: 1 });
QRCodeSchema.index({ batchId: 1 });
QRCodeSchema.index({ isScanned: 1 });
QRCodeSchema.index({ manufacturer: 1 });
QRCodeSchema.index({ drugName: 1 });

export default mongoose.models.QRCode || mongoose.model<IQRCode>('QRCode', QRCodeSchema);