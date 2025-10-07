import mongoose, { Schema, Document } from "mongoose";

export interface IDrugAnalysis extends Document {
  userEmail: string;
  drugName: string;
  strength: string;
  confidence: number;
  status: 'authentic' | 'suspicious' | 'counterfeit' | 'not_a_drug';
  issues: string[];
  extractedText: string[];
  visualFeatures: {
    color: string;
    shape: string;
    markings: string[];
    objectDetections: any[];
  };
  isDrugImage: boolean;
  imageClassification: {
    isPharmaceutical: boolean;
    detectedObjects: string[];
    confidence: number;
    detectionMethod: string;
    boundingBoxCount: number;
  };
  processingTime?: number;
  modelStatus?: any;
  imageUrl?: string; // Store the image data URL or path
  method: string; // 'Photo Upload' or 'Camera Capture'
  createdAt: Date;
  updatedAt: Date;
}

const DrugAnalysisSchema = new Schema<IDrugAnalysis>(
  {
    userEmail: { 
      type: String, 
      required: true,
      index: true
    },
    drugName: { 
      type: String, 
      required: true,
      index: true
    },
    strength: { 
      type: String, 
      required: true
    },
    confidence: { 
      type: Number, 
      required: true,
      min: 0,
      max: 1
    },
    status: { 
      type: String, 
      required: true,
      enum: ['authentic', 'suspicious', 'counterfeit', 'not_a_drug'],
      index: true
    },
    issues: [{ 
      type: String 
    }],
    extractedText: [{ 
      type: String 
    }],
    visualFeatures: {
      color: { type: String, default: 'unknown' },
      shape: { type: String, default: 'unknown' },
      markings: [{ type: String }],
      objectDetections: [{ type: Schema.Types.Mixed }]
    },
    isDrugImage: { 
      type: Boolean, 
      default: true 
    },
    imageClassification: {
      isPharmaceutical: { type: Boolean, required: true },
      detectedObjects: [{ type: String }],
      confidence: { type: Number, required: true },
      detectionMethod: { type: String, required: true },
      boundingBoxCount: { type: Number, default: 0 }
    },
    processingTime: { 
      type: Number 
    },
    modelStatus: { 
      type: Schema.Types.Mixed 
    },
    imageUrl: { 
      type: String 
    },
    method: { 
      type: String, 
      required: true,
      enum: ['Photo Upload', 'Camera Capture', 'Photo Analysis']
    }
  },
  { 
    timestamps: true,
    indexes: [
      { userEmail: 1, createdAt: -1 },
      { drugName: 1, createdAt: -1 },
      { status: 1, createdAt: -1 }
    ]
  }
);

export default mongoose.models.DrugAnalysis ||
  mongoose.model<IDrugAnalysis>("DrugAnalysis", DrugAnalysisSchema);

