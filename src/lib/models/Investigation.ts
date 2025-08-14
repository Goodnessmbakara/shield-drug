import mongoose, { Schema, Document } from 'mongoose';

export interface IInvestigation extends Document {
  title: string;
  description: string;
  type: 'counterfeit' | 'quality' | 'compliance' | 'safety' | 'other';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'investigating' | 'resolved' | 'closed';
  assignedTo?: string;
  reportedBy: string;
  manufacturer?: string;
  drugName?: string;
  batchId?: string;
  qrCodeId?: string;
  evidence: string[];
  findings?: string;
  resolution?: string;
  startDate: Date;
  dueDate?: Date;
  completedDate?: Date;
  tags: string[];
  attachments: string[];
  notes: string[];
  createdAt: Date;
  updatedAt: Date;
}

const InvestigationSchema = new Schema<IInvestigation>({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['counterfeit', 'quality', 'compliance', 'safety', 'other'],
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['pending', 'investigating', 'resolved', 'closed'],
    default: 'pending'
  },
  assignedTo: {
    type: String,
    ref: 'User'
  },
  reportedBy: {
    type: String,
    required: true,
    ref: 'User'
  },
  manufacturer: {
    type: String,
    trim: true
  },
  drugName: {
    type: String,
    trim: true
  },
  batchId: {
    type: String,
    trim: true
  },
  qrCodeId: {
    type: String,
    trim: true
  },
  evidence: [{
    type: String,
    trim: true
  }],
  findings: {
    type: String,
    trim: true
  },
  resolution: {
    type: String,
    trim: true
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  dueDate: {
    type: Date
  },
  completedDate: {
    type: Date
  },
  tags: [{
    type: String,
    trim: true
  }],
  attachments: [{
    type: String,
    trim: true
  }],
  notes: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true
});

// Indexes for better query performance
InvestigationSchema.index({ status: 1, priority: 1 });
InvestigationSchema.index({ assignedTo: 1 });
InvestigationSchema.index({ manufacturer: 1 });
InvestigationSchema.index({ type: 1 });
InvestigationSchema.index({ createdAt: -1 });

// Virtual for investigation duration
InvestigationSchema.virtual('duration').get(function() {
  if (this.completedDate && this.startDate) {
    return Math.ceil((this.completedDate.getTime() - this.startDate.getTime()) / (1000 * 60 * 60 * 24));
  }
  return null;
});

// Virtual for days remaining
InvestigationSchema.virtual('daysRemaining').get(function() {
  if (this.dueDate && this.status !== 'resolved' && this.status !== 'closed') {
    const now = new Date();
    const remaining = Math.ceil((this.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return remaining > 0 ? remaining : 0;
  }
  return null;
});

// Ensure virtuals are included in JSON output
InvestigationSchema.set('toJSON', { virtuals: true });
InvestigationSchema.set('toObject', { virtuals: true });

export default mongoose.models.Investigation || mongoose.model<IInvestigation>('Investigation', InvestigationSchema);
