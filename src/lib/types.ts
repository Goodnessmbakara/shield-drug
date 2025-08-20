import { NextApiResponse } from 'next';

export interface NextApiResponseServerIO extends NextApiResponse {
  socket: any & {
    server: any & {
      io: any;
    };
  };
}

// Drug Batch Types
export interface DrugBatch {
  id: string;
  drugName: string;
  batchId: string;
  quantity: number;
  manufacturer: string;
  location: string;
  expiryDate: string;
  nafdacNumber: string;
  manufacturingDate: string;
  activeIngredient: string;
  dosageForm: string;
  strength: string;
  packageSize: string;
  storageConditions: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

// Batch Details Types - Extended interface for detailed batch information
export interface BatchDetails extends DrugBatch {
  // Status and processing information
  status: 'active' | 'pending' | 'expired' | 'failed';
  blockchainTx: string;
  qrCodesGenerated: number;
  processingTime: number | null;
  fileHash: string;
  
  // Validation results
  validationResult: {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  };
  
  // Quality and compliance metrics
  qualityScore: number;
  complianceStatus: string;
  regulatoryApproval: string;
  
  // Verification statistics
  verifications: number;
  authenticityRate: number;
  
  // Additional metadata
  fileName: string;
  records: number;
  size: string;
  temperature: string;
  humidity: string;
}

// Upload Status Types
export type UploadStatus = 'pending' | 'validating' | 'uploading' | 'completed' | 'failed' | 'in-progress';

// Upload History Types
export interface UploadHistory {
  id: string;
  fileName: string;
  drug: string;
  quantity: number;
  status: UploadStatus;
  date: string;
  size: string;
  records: number;
  blockchainTx?: string;
  errorMessage?: string;
  validationErrors?: ValidationError[];
  manufacturer?: string;
  uploadProgress?: number;
  createdAt?: string;
  updatedAt?: string;
}

// Validation Error Types
export interface ValidationError {
  row: number;
  column: string;
  value: string;
  message: string;
  severity: 'error' | 'warning';
}

// CSV Row Types
export interface CSVRow {
  drug_name: string;
  batch_id: string;
  quantity: number;
  manufacturer: string;
  location: string;
  expiry_date: string;
  nafdac_number: string;
  manufacturing_date: string;
  active_ingredient: string;
  dosage_form: string;
  strength: string;
  package_size: string;
  storage_conditions: string;
  description?: string;
}

// Validation Result Types
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  totalRows: number;
  validRows: number;
  invalidRows: number;
  data: CSVRow[];
}

// Upload Progress Types
export interface UploadProgress {
  stage: 'validation' | 'processing' | 'blockchain' | 'qr-generation' | 'completed';
  progress: number;
  message: string;
  details?: string;
}

// Manufacturer User Types
export interface ManufacturerUser {
  id: string;
  email: string;
  companyName: string;
  nafdacLicenseNumber: string;
  address: string;
  phone: string;
  role: 'manufacturer';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Blockchain Transaction Types
export interface BlockchainTransaction {
  hash: string;
  status: 'pending' | 'confirmed' | 'failed';
  gasUsed: number;
  gasPrice: number;
  blockNumber?: number;
  timestamp: string;
  errorMessage?: string;
}

// API Response Types
export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface UploadResponse {
  uploadId: string;
  status: UploadStatus;
  validationResult: ValidationResult;
  blockchainTx?: BlockchainTransaction;
  qrCodesGenerated?: number;
  error?: string;
  // Optional ID used by the in-memory progress tracker
  progressId?: string;
} 

// Unified CSV Export Types
export interface UnifiedCSVExport {
  // Core drug information (from upload)
  serial_number: number;
  drug_name: string;
  batch_id: string;
  quantity: number;
  expiry_date: string;
  manufacturer: string;
  location: string;
  nafdac_number: string;
  manufacturing_date: string;
  active_ingredient: string;
  dosage_form: string;
  strength: string;
  package_size: string;
  storage_conditions: string;
  description?: string;
  
  // Environmental data (from upload details)
  temperature?: string;
  humidity?: string;
  
  // Blockchain and verification data
  qr_code_id: string;
  blockchain_tx: string;
  file_hash: string;
  
  // Timestamps
  created_date: string;
  upload_date?: string;
  
  // Quality and compliance data
  quality_score?: number;
  compliance_status?: string;
  regulatory_approval?: string;
  
  // Verification tracking
  verification_count?: number;
  authenticity_rate?: number;
  last_verified?: string;
} 

// Object Detection Types
export interface ObjectDetection {
  class: string;
  confidence: number;
  bbox: [number, number, number, number]; // [x, y, width, height]
  isPharmaceuticalRelevant: boolean;
}

// Enhanced Analysis Result Types
export interface ImageClassificationResult {
  isPharmaceutical: boolean;
  detectedObjects: string[];
  confidence: number;
  objectDetections?: ObjectDetection[];
  detectionMethod: 'coco-ssd' | 'mobilenet' | 'heuristic';
  boundingBoxCount: number;
}

// Enhanced Drug Analysis Result Types
export interface DrugAnalysisResult {
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
    objectDetections?: ObjectDetection[]; // New field for object detection data
  };
  isDrugImage: boolean;
  imageClassification: ImageClassificationResult;
}