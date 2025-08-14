import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditLog extends Document {
  timestamp: Date;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  category: 'API_CALL' | 'USER_ACTION' | 'SYSTEM_EVENT' | 'SECURITY' | 'BLOCKCHAIN' | 'DATABASE';
  action: string;
  description: string;
  userId?: string;
  userEmail?: string;
  userRole?: string;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
  endpoint?: string;
  method?: string;
  statusCode?: number;
  responseTime?: number;
  resourceId?: string;
  resourceType?: string;
  metadata?: Record<string, any>;
  error?: string;
  stackTrace?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AuditLogSchema: Schema = new Schema({
  timestamp: {
    type: Date,
    default: Date.now,
    required: true,
    index: true
  },
  level: {
    type: String,
    enum: ['INFO', 'WARN', 'ERROR', 'DEBUG'],
    default: 'INFO',
    required: true,
    index: true
  },
  category: {
    type: String,
    enum: ['API_CALL', 'USER_ACTION', 'SYSTEM_EVENT', 'SECURITY', 'BLOCKCHAIN', 'DATABASE'],
    required: true,
    index: true
  },
  action: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  userId: {
    type: String,
    trim: true,
    index: true
  },
  userEmail: {
    type: String,
    trim: true,
    lowercase: true,
    index: true
  },
  userRole: {
    type: String,
    enum: ['manufacturer', 'pharmacist', 'consumer', 'regulatory', 'admin'],
    index: true
  },
  ipAddress: {
    type: String,
    trim: true
  },
  userAgent: {
    type: String,
    trim: true
  },
  requestId: {
    type: String,
    trim: true,
    index: true
  },
  endpoint: {
    type: String,
    trim: true
  },
  method: {
    type: String,
    enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    uppercase: true
  },
  statusCode: {
    type: Number,
    min: 100,
    max: 599
  },
  responseTime: {
    type: Number,
    min: 0
  },
  resourceId: {
    type: String,
    trim: true,
    index: true
  },
  resourceType: {
    type: String,
    trim: true
  },
  metadata: {
    type: Schema.Types.Mixed
  },
  error: {
    type: String,
    trim: true
  },
  stackTrace: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Create indexes for better query performance
AuditLogSchema.index({ timestamp: -1 });
AuditLogSchema.index({ category: 1, timestamp: -1 });
AuditLogSchema.index({ level: 1, timestamp: -1 });
AuditLogSchema.index({ userEmail: 1, timestamp: -1 });
AuditLogSchema.index({ action: 1, timestamp: -1 });
AuditLogSchema.index({ endpoint: 1, timestamp: -1 });
AuditLogSchema.index({ statusCode: 1, timestamp: -1 });

// TTL index to automatically delete old logs (keep for 1 year)
AuditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 });

export default mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
