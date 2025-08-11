import mongoose, { Schema, Document } from 'mongoose';

export interface IUpload extends Document {
  id: string;
  fileName: string;
  drug: string;
  quantity: number;
  status: 'pending' | 'validating' | 'uploading' | 'completed' | 'failed' | 'in-progress';
  date: Date;
  size: string;
  records: number;
  blockchainTx?: string;
  description?: string;
  manufacturer: string;
  batchId: string;
  expiryDate: Date;
  validationResult?: {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  };
  qrCodesGenerated?: number;
  processingTime?: number;
  fileHash?: string;
  location?: string;
  temperature?: string;
  humidity?: string;
  qualityScore?: number;
  complianceStatus?: string;
  regulatoryApproval?: string;
  userEmail: string;
  userRole: string;
  createdAt: Date;
  updatedAt: Date;
}

const UploadSchema: Schema = new Schema({
  fileName: {
    type: String,
    required: true,
    trim: true
  },
  drug: {
    type: String,
    required: true,
    trim: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  status: {
    type: String,
    enum: ['pending', 'validating', 'uploading', 'completed', 'failed', 'in-progress'],
    default: 'pending'
  },
  date: {
    type: Date,
    default: Date.now
  },
  size: {
    type: String,
    required: true
  },
  records: {
    type: Number,
    required: true,
    min: 1
  },
  blockchainTx: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  manufacturer: {
    type: String,
    required: true,
    trim: true
  },
  batchId: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  expiryDate: {
    type: Date,
    required: true
  },
  validationResult: {
    isValid: {
      type: Boolean,
      default: false
    },
    errors: [{
      type: String
    }],
    warnings: [{
      type: String
    }]
  },
  qrCodesGenerated: {
    type: Number,
    default: 0
  },
  processingTime: {
    type: Number
  },
  fileHash: {
    type: String,
    trim: true
  },
  location: {
    type: String,
    trim: true
  },
  temperature: {
    type: String,
    trim: true
  },
  humidity: {
    type: String,
    trim: true
  },
  qualityScore: {
    type: Number,
    min: 0,
    max: 100
  },
  complianceStatus: {
    type: String,
    trim: true
  },
  regulatoryApproval: {
    type: String,
    trim: true
  },
  userEmail: {
    type: String,
    required: true,
    trim: true
  },
  userRole: {
    type: String,
    required: true,
    enum: ['manufacturer', 'pharmacist', 'consumer', 'regulatory', 'admin']
  }
}, {
  timestamps: true
});

// Create indexes for better query performance
UploadSchema.index({ userEmail: 1, createdAt: -1 });
UploadSchema.index({ batchId: 1 });
UploadSchema.index({ status: 1 });
UploadSchema.index({ manufacturer: 1 });
UploadSchema.index({ drug: 1 });

export default mongoose.models.Upload || mongoose.model<IUpload>('Upload', UploadSchema);