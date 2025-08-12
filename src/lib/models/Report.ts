import mongoose, { Schema, Document } from "mongoose";

export interface IReport extends Document {
  userEmail: string;
  drugName: string;
  batchNumber: string;
  description: string;
  status: "pending" | "resolved";
  createdAt: Date;
}

const ReportSchema = new Schema<IReport>(
  {
    userEmail: { type: String, required: true },
    drugName: { type: String, required: true },
    batchNumber: { type: String, required: true },
    description: { type: String, required: true },
    status: { type: String, default: "pending" },
  },
  { timestamps: true }
);

export default mongoose.models.Report || mongoose.model<IReport>("Report", ReportSchema);
