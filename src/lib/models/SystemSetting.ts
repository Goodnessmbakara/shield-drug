import mongoose, { Document, Schema } from 'mongoose';

export interface ISystemSetting extends Document {
  key: string;
  value: any;
  category: 'system' | 'security' | 'blockchain' | 'notifications';
  description: string;
  updatedBy: string;
  updatedAt: Date;
}

const SystemSettingSchema = new Schema<ISystemSetting>({
  key: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  value: {
    type: Schema.Types.Mixed,
    required: true
  },
  category: {
    type: String,
    enum: ['system', 'security', 'blockchain', 'notifications'],
    required: true,
    index: true
  },
  description: {
    type: String,
    required: true
  },
  updatedBy: {
    type: String,
    required: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index for efficient queries
SystemSettingSchema.index({ category: 1, key: 1 });

export default mongoose.models.SystemSetting || mongoose.model<ISystemSetting>('SystemSetting', SystemSettingSchema);
