import mongoose, { Schema, Document } from "mongoose";

export interface IVerification extends Document {
  userEmail: string;           // Who performed verification
  verifiedBy: string;          // Alias for userEmail (for compatibility)
  drugName: string;            // Drug that was verified
  qrCodeId: string;            // QR code that was verified
  batchId: string;             // Batch ID of the drug
  manufacturer: string;        // Manufacturer of the drug
  method: string;              // Verification method (QR Scan, Photo Analysis, etc.)
  status: string;              // Verification status (Verified, Failed, etc.)
  result: string;              // Verification result (authentic, counterfeit, suspicious)
  pharmacy?: string;           // Pharmacy location
  location?: string;           // Scan location
  verifiedAt: Date;            // When verification occurred
  blockchainTx?: string;       // Blockchain transaction hash
  verificationCount: number;   // How many times this QR was verified
  createdAt: Date;             // Record creation time
  updatedAt: Date;             // Record update time
}

const VerificationSchema = new Schema<IVerification>(
  {
    userEmail: { 
      type: String, 
      required: true,
      index: true
    },
    verifiedBy: { 
      type: String, 
      required: true,
      index: true
    },
    drugName: { 
      type: String, 
      required: true,
      index: true
    },
    qrCodeId: { 
      type: String, 
      required: true,
      index: true
    },
    batchId: { 
      type: String, 
      required: true,
      index: true
    },
    manufacturer: { 
      type: String, 
      required: true
    },
    method: { 
      type: String, 
      required: true,
      enum: ['QR Code Scan', 'Photo Analysis', 'Manual Verification', 'AI Recognition']
    },
    status: { 
      type: String, 
      required: true,
      enum: ['Verified', 'Failed', 'Pending', 'Error']
    },
    result: { 
      type: String, 
      required: true,
      enum: ['authentic', 'counterfeit', 'suspicious', 'unknown']
    },
    pharmacy: { 
      type: String,
      index: true
    },
    location: { 
      type: String
    },
    verifiedAt: { 
      type: Date, 
      required: true,
      default: Date.now,
      index: true
    },
    blockchainTx: { 
      type: String
    },
    verificationCount: { 
      type: Number, 
      default: 1
    }
  },
  { 
    timestamps: true,
    indexes: [
      { userEmail: 1, verifiedAt: -1 },
      { qrCodeId: 1, verifiedAt: -1 },
      { drugName: 1, verifiedAt: -1 },
      { result: 1, verifiedAt: -1 }
    ]
  }
);

export default mongoose.models.Verification ||
  mongoose.model<IVerification>("Verification", VerificationSchema);
