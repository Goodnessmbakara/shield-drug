import mongoose, { Schema, Document } from 'mongoose';

export interface IQRCode extends Document {
  qrId: string;
  uploadId: string;
  serialNumber: number;
  drugName: string;
  batchId: string;
  expiryDate: Date;
  manufacturer: string;
  qrCodeUrl: string;
  verificationUrl: string;
  blockchainTx?: string;
  isScanned: boolean;
  scannedAt?: Date;
  scannedBy?: string;
  scannedLocation?: string;
  createdAt: Date;
  updatedAt: Date;
}

const QRCodeSchema: Schema = new Schema({
  qrId: {
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
  serialNumber: {
    type: Number,
    required: true
  },
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
  expiryDate: {
    type: Date,
    required: true
  },
  manufacturer: {
    type: String,
    required: true,
    trim: true
  },
  qrCodeUrl: {
    type: String,
    required: true,
    trim: true
  },
  verificationUrl: {
    type: String,
    required: true,
    trim: true
  },
  blockchainTx: {
    type: String,
    trim: true
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
QRCodeSchema.index({ qrId: 1 });
QRCodeSchema.index({ uploadId: 1 });
QRCodeSchema.index({ batchId: 1 });
QRCodeSchema.index({ isScanned: 1 });
QRCodeSchema.index({ manufacturer: 1 });
QRCodeSchema.index({ drugName: 1 });

export default mongoose.models.QRCode || mongoose.model<IQRCode>('QRCode', QRCodeSchema); 