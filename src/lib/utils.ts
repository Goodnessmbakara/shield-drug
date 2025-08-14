import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

import { UnifiedCSVExport } from './types';

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
