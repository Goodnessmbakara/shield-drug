import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

import { UnifiedCSVExport } from './types';
import crypto from 'crypto';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format date to user-friendly display format (YYYY-MM-DD)
 * Handles both ISO strings and Date objects
 */
export function formatDateForDisplay(date: string | Date | null | undefined): string {
  if (!date) return '';
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return '';
    return dateObj.toISOString().split('T')[0];
  } catch (error) {
    return '';
  }
}

/**
 * Generate unified CSV export data from batch details and QR codes
 * This function creates a standardized export format that includes all necessary fields
 * for tracking, verification, and compliance purposes.
 */
export function generateUnifiedCSVExport(
  batchData: any,
  qrCodes: any[],
  additionalData?: {
    temperature?: string;
    humidity?: string;
    qualityScore?: number;
    complianceStatus?: string;
    regulatoryApproval?: string;
    verificationCount?: number;
    authenticityRate?: number;
    lastVerified?: string;
  }
): UnifiedCSVExport[] {
  return qrCodes.map((qrCode, index) => ({
    // Core drug information
    serial_number: index + 1,
    drug_name: batchData.drugName || batchData.drug,
    batch_id: batchData.batchId,
    quantity: 1, // Each QR code represents 1 unit
    expiry_date: batchData.expiryDate,
    manufacturer: batchData.manufacturer,
    location: batchData.location,
    nafdac_number: batchData.nafdacNumber,
    manufacturing_date: batchData.manufacturingDate,
    active_ingredient: batchData.activeIngredient,
    dosage_form: batchData.dosageForm,
    strength: batchData.strength,
    package_size: batchData.packageSize,
    storage_conditions: batchData.storageConditions,
    description: batchData.description,
    
    // Environmental data
    temperature: additionalData?.temperature || batchData.temperature,
    humidity: additionalData?.humidity || batchData.humidity,
    
    // Blockchain and verification data
    qr_code_id: qrCode.qrCodeId,
    blockchain_tx: qrCode.blockchainTx,
    file_hash: batchData.fileHash,
    
    // Timestamps
    created_date: batchData.createdAt,
    upload_date: batchData.date || batchData.createdAt,
    
    // Quality and compliance data
    quality_score: additionalData?.qualityScore || batchData.qualityScore,
    compliance_status: additionalData?.complianceStatus || batchData.complianceStatus,
    regulatory_approval: additionalData?.regulatoryApproval || batchData.regulatoryApproval,
    
    // Verification tracking
    verification_count: additionalData?.verificationCount || batchData.verifications || 0,
    authenticity_rate: additionalData?.authenticityRate || batchData.authenticityRate,
    last_verified: additionalData?.lastVerified,
  }));
}

/**
 * Convert unified CSV export data to CSV string
 */
export function convertToCSV(data: UnifiedCSVExport[]): string {
  if (data.length === 0) {
    return '';
  }
  
  const headers = Object.keys(data[0]);
  const csvHeaders = headers.join(',');
  const csvRows = data.map(row => 
    headers.map(header => {
      const value = row[header as keyof UnifiedCSVExport];
      // Handle values that might contain commas by wrapping in quotes
      if (typeof value === 'string' && value.includes(',')) {
        return `"${value}"`;
      }
      return value || '';
    }).join(',')
  );
  
  return [csvHeaders, ...csvRows].join('\n');
}

/**
 * Generate a unique QR code ID with guaranteed uniqueness
 */
export function generateUniqueQRCodeId(
  uploadId: string, 
  drugCode: string, 
  serialNumber: number,
  batchId?: string
): string {
  try {
    // Use crypto.randomUUID for guaranteed uniqueness
    const uuid = crypto.randomUUID();
    const timestamp = Date.now();
    const randomPart = Math.random().toString(36).substring(2, 8);
    
    // Create a unique string combining all elements
    const uniqueString = batchId 
      ? `${uploadId}-${batchId}-${timestamp}-${uuid}-${randomPart}`
      : `${uploadId}-${drugCode}-${serialNumber}-${timestamp}-${uuid}-${randomPart}`;
    
    // Use SHA-256 hash for better distribution and uniqueness
    const hash = crypto.createHash('sha256').update(uniqueString).digest('hex');
    
    // Take first 8 characters and convert to uppercase for readability
    const shortHash = hash.substring(0, 8).toUpperCase();
    
    // Add a prefix to make it more identifiable
    return `QR-${shortHash}`;
  } catch (error) {
    // Fallback method if crypto.randomUUID is not available
    console.warn('crypto.randomUUID not available, using fallback method');
    const timestamp = Date.now();
    const randomPart = Math.random().toString(36).substring(2, 10);
    const uniqueString = batchId 
      ? `${uploadId}-${batchId}-${timestamp}-${randomPart}`
      : `${uploadId}-${drugCode}-${serialNumber}-${timestamp}-${randomPart}`;
    
    // Use SHA-256 hash
    const hash = crypto.createHash('sha256').update(uniqueString).digest('hex');
    const shortHash = hash.substring(0, 8).toUpperCase();
    
    return `QR-${shortHash}`;
  }
}

/**
 * Validate QR code ID format
 */
export function validateQRCodeId(qrCodeId: string): boolean {
  if (!qrCodeId || typeof qrCodeId !== 'string') {
    return false;
  }
  
  // Check if it starts with QR- and has at least 8 characters after
  const qrCodePattern = /^QR-[A-F0-9]{8,}$/;
  return qrCodePattern.test(qrCodeId);
}

/**
 * Sanitize and validate QR code data before saving
 */
export function sanitizeQRCodeData(data: any): any {
  const sanitized = { ...data };
  
  // Ensure qrCodeId is not null or empty
  if (!sanitized.qrCodeId || sanitized.qrCodeId.trim() === '') {
    throw new Error('QR Code ID cannot be null or empty');
  }
  
  // Trim all string fields
  if (sanitized.uploadId) sanitized.uploadId = sanitized.uploadId.trim();
  if (sanitized.userEmail) sanitized.userEmail = sanitized.userEmail.trim();
  if (sanitized.drugCode) sanitized.drugCode = sanitized.drugCode.trim();
  if (sanitized.verificationUrl) sanitized.verificationUrl = sanitized.verificationUrl.trim();
  if (sanitized.imageUrl) sanitized.imageUrl = sanitized.imageUrl.trim();
  
  // Validate metadata
  if (sanitized.metadata) {
    if (sanitized.metadata.drugName) sanitized.metadata.drugName = sanitized.metadata.drugName.trim();
    if (sanitized.metadata.batchId) sanitized.metadata.batchId = sanitized.metadata.batchId.trim();
    if (sanitized.metadata.manufacturer) sanitized.metadata.manufacturer = sanitized.metadata.manufacturer.trim();
    if (sanitized.metadata.expiryDate) sanitized.metadata.expiryDate = sanitized.metadata.expiryDate.trim();
  }
  
  return sanitized;
}
