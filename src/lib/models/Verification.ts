import mongoose, { Schema, Document } from "mongoose";

export interface IVerification extends Document {
  userEmail: string;
  drugName: string;
  method: string; // e.g., "Photo analysis"
  status: string; // e.g., "Verified"
  pharmacy?: string;
  createdAt: Date;
}

const VerificationSchema = new Schema<IVerification>(
  {
    userEmail: { type: String, required: true },
    drugName: { type: String, required: true },
    method: { type: String, required: true },
    status: { type: String, required: true },
    pharmacy: { type: String },
  },
  { timestamps: true }
);

export default mongoose.models.Verification ||
  mongoose.model<IVerification>("Verification", VerificationSchema);
