import mongoose, { Schema, Document } from 'mongoose';

export interface IBlockchainTransaction extends Document {
  transactionHash: string;
  blockNumber: number;
  gasUsed: number;
  gasPrice: number;
  status: 'pending' | 'confirmed' | 'failed';
  type: 'batch_record' | 'qr_record' | 'verification' | 'other';
  userEmail: string;
  userRole: string;
  resourceId: string; // Upload ID, QR Code ID, etc.
  resourceType: 'upload' | 'qr_code' | 'verification' | 'other';
  network: string;
  chainId: number;
  timestamp: Date;
  confirmedAt?: Date;
  errorMessage?: string;
  metadata: any;
  createdAt: Date;
  updatedAt: Date;
}

const BlockchainTransactionSchema = new Schema<IBlockchainTransaction>({
  transactionHash: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  blockNumber: {
    type: Number,
    required: true
  },
  gasUsed: {
    type: Number,
    required: true,
    min: 0
  },
  gasPrice: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'failed'],
    default: 'pending'
  },
  type: {
    type: String,
    enum: ['batch_record', 'qr_record', 'verification', 'other'],
    required: true
  },
  userEmail: {
    type: String,
    required: true,
    ref: 'User'
  },
  userRole: {
    type: String,
    required: true,
    enum: ['manufacturer', 'pharmacist', 'consumer', 'regulatory', 'admin']
  },
  resourceId: {
    type: String,
    required: true,
    trim: true
  },
  resourceType: {
    type: String,
    enum: ['upload', 'qr_code', 'verification', 'other'],
    required: true
  },
  network: {
    type: String,
    default: 'avalanche_fuji',
    trim: true
  },
  chainId: {
    type: Number,
    default: 43113 // Avalanche Fuji testnet
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  confirmedAt: {
    type: Date
  },
  errorMessage: {
    type: String,
    trim: true
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes for better query performance
BlockchainTransactionSchema.index({ transactionHash: 1 });
BlockchainTransactionSchema.index({ userEmail: 1, type: 1 });
BlockchainTransactionSchema.index({ status: 1, timestamp: 1 });
BlockchainTransactionSchema.index({ resourceId: 1, resourceType: 1 });
BlockchainTransactionSchema.index({ network: 1, chainId: 1 });
BlockchainTransactionSchema.index({ createdAt: -1 });

// Virtual for transaction fee
BlockchainTransactionSchema.virtual('transactionFee').get(function() {
  return this.gasUsed * this.gasPrice;
});

// Virtual for confirmation time
BlockchainTransactionSchema.virtual('confirmationTime').get(function() {
  if (this.confirmedAt && this.timestamp) {
    return this.confirmedAt.getTime() - this.timestamp.getTime();
  }
  return null;
});

// Ensure virtuals are included in JSON output
BlockchainTransactionSchema.set('toJSON', { virtuals: true });
BlockchainTransactionSchema.set('toObject', { virtuals: true });

export default mongoose.models.BlockchainTransaction || mongoose.model<IBlockchainTransaction>('BlockchainTransaction', BlockchainTransactionSchema);
