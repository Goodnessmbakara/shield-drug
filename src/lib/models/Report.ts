import mongoose, { Schema, Document } from "mongoose";

export interface IReport extends Document {
  userEmail: string;
  reportedBy: string;
  drugName: string;
  batchNumber: string;
  title: string;
  description: string;
  type: "verification" | "inventory" | "security" | "compliance" | "analytics" | "blockchain" | "general";
  status: "pending" | "resolved" | "completed" | "urgent" | "failed";
  priority: "low" | "medium" | "high";
  category: string;
  pharmacy?: string;
  manufacturer?: string;
  fileSize?: string;
  format?: string;
  downloads?: number;
  lastAccessed?: Date;
  dateRange?: string;
  summary?: any;
  createdAt: Date;
  updatedAt: Date;
}

const ReportSchema = new Schema<IReport>(
  {
    userEmail: { type: String, required: true, index: true },
    reportedBy: { type: String, required: true, index: true },
    drugName: { type: String, required: true },
    batchNumber: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    type: { 
      type: String, 
      enum: ["verification", "inventory", "security", "compliance", "analytics", "blockchain", "general"],
      default: "general"
    },
    status: { 
      type: String, 
      enum: ["pending", "resolved", "completed", "urgent", "failed"],
      default: "pending" 
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium"
    },
    category: { type: String, default: "general" },
    pharmacy: { type: String },
    manufacturer: { type: String },
    fileSize: { type: String, default: "1.2 MB" },
    format: { type: String, default: "PDF" },
    downloads: { type: Number, default: 0 },
    lastAccessed: { type: Date, default: Date.now },
    dateRange: { type: String },
    summary: { type: Schema.Types.Mixed }
  },
  { 
    timestamps: true,
    indexes: [
      { reportedBy: 1, createdAt: -1 },
      { type: 1, status: 1 },
      { priority: 1, status: 1 }
    ]
  }
);

export default mongoose.models.Report || mongoose.model<IReport>("Report", ReportSchema);
