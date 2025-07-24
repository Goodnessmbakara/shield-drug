import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  password: string;
  role: 'manufacturer' | 'pharmacist' | 'consumer' | 'regulatory' | 'admin';
  companyName?: string;
  nafdacLicenseNumber?: string;
  address?: string;
  phone?: string;
  isActive: boolean;
  isVerified: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    required: true,
    enum: ['manufacturer', 'pharmacist', 'consumer', 'regulatory', 'admin'],
    default: 'consumer'
  },
  companyName: {
    type: String,
    trim: true
  },
  nafdacLicenseNumber: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  lastLogin: {
    type: Date
  }
}, {
  timestamps: true
});

// Create indexes for better query performance
UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ isActive: 1 });
UserSchema.index({ nafdacLicenseNumber: 1 });

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema); 