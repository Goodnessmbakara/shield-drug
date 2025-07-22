import { CSVRow, ValidationError, ValidationResult } from './types';

// Required CSV columns
export const REQUIRED_COLUMNS = [
  'drug_name',
  'batch_id',
  'quantity',
  'manufacturer',
  'location',
  'expiry_date',
  'nafdac_number',
  'manufacturing_date',
  'active_ingredient',
  'dosage_form',
  'strength',
  'package_size',
  'storage_conditions'
];

// Optional columns
export const OPTIONAL_COLUMNS = ['description'];

// Maximum file size (10MB)
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Maximum rows per upload
export const MAX_ROWS = 100000;

// Parse CSV file content
export function parseCSV(csvContent: string): CSVRow[] {
  const lines = csvContent.trim().split('\n');
  if (lines.length < 2) {
    throw new Error('CSV file must have at least a header row and one data row');
  }

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  
  // Validate headers
  const missingHeaders = REQUIRED_COLUMNS.filter(col => !headers.includes(col));
  if (missingHeaders.length > 0) {
    throw new Error(`Missing required columns: ${missingHeaders.join(', ')}`);
  }

  const rows: CSVRow[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue; // Skip empty lines
    
    const values = parseCSVLine(line);
    if (values.length !== headers.length) {
      throw new Error(`Row ${i + 1}: Column count mismatch. Expected ${headers.length}, got ${values.length}`);
    }

    const row: any = {};
    headers.forEach((header, index) => {
      row[header] = values[index]?.trim() || '';
    });

    rows.push(row as CSVRow);
  }

  return rows;
}

// Parse CSV line handling quoted values
function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  values.push(current);
  return values;
}

// Validate drug batch data
export function validateDrugBatchData(rows: CSVRow[]): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];
  let validRows = 0;
  let invalidRows = 0;

  // Check row limit
  if (rows.length > MAX_ROWS) {
    errors.push({
      row: 0,
      column: 'file',
      value: rows.length.toString(),
      message: `File contains too many rows. Maximum allowed: ${MAX_ROWS}`,
      severity: 'error'
    });
  }

  rows.forEach((row, index) => {
    const rowNumber = index + 2; // +2 because index starts at 0 and we skip header
    const rowErrors: ValidationError[] = [];
    const rowWarnings: ValidationError[] = [];

    // Validate drug_name
    if (!row.drug_name || row.drug_name.trim().length === 0) {
      rowErrors.push({
        row: rowNumber,
        column: 'drug_name',
        value: row.drug_name || '',
        message: 'Drug name is required',
        severity: 'error'
      });
    } else if (row.drug_name.length > 100) {
      rowWarnings.push({
        row: rowNumber,
        column: 'drug_name',
        value: row.drug_name,
        message: 'Drug name is very long (max 100 characters recommended)',
        severity: 'warning'
      });
    }

    // Validate batch_id
    if (!row.batch_id || row.batch_id.trim().length === 0) {
      rowErrors.push({
        row: rowNumber,
        column: 'batch_id',
        value: row.batch_id || '',
        message: 'Batch ID is required',
        severity: 'error'
      });
    } else if (!/^[A-Z0-9-_]+$/i.test(row.batch_id)) {
      rowWarnings.push({
        row: rowNumber,
        column: 'batch_id',
        value: row.batch_id,
        message: 'Batch ID should contain only letters, numbers, hyphens, and underscores',
        severity: 'warning'
      });
    }

    // Validate quantity
    const quantity = parseInt(row.quantity.toString());
    if (isNaN(quantity) || quantity <= 0) {
      rowErrors.push({
        row: rowNumber,
        column: 'quantity',
        value: row.quantity.toString(),
        message: 'Quantity must be a positive number',
        severity: 'error'
      });
    } else if (quantity > 1000000) {
      rowWarnings.push({
        row: rowNumber,
        column: 'quantity',
        value: row.quantity.toString(),
        message: 'Quantity is very large (max 1,000,000 recommended)',
        severity: 'warning'
      });
    }

    // Validate manufacturer
    if (!row.manufacturer || row.manufacturer.trim().length === 0) {
      rowErrors.push({
        row: rowNumber,
        column: 'manufacturer',
        value: row.manufacturer || '',
        message: 'Manufacturer is required',
        severity: 'error'
      });
    }

    // Validate location
    if (!row.location || row.location.trim().length === 0) {
      rowErrors.push({
        row: rowNumber,
        column: 'location',
        value: row.location || '',
        message: 'Location is required',
        severity: 'error'
      });
    }

    // Validate expiry_date
    if (!row.expiry_date || row.expiry_date.trim().length === 0) {
      rowErrors.push({
        row: rowNumber,
        column: 'expiry_date',
        value: row.expiry_date || '',
        message: 'Expiry date is required',
        severity: 'error'
      });
    } else if (!isValidDate(row.expiry_date)) {
      rowErrors.push({
        row: rowNumber,
        column: 'expiry_date',
        value: row.expiry_date,
        message: 'Expiry date must be in YYYY-MM-DD format',
        severity: 'error'
      });
    } else {
      const expiryDate = new Date(row.expiry_date);
      const today = new Date();
      if (expiryDate <= today) {
        rowErrors.push({
          row: rowNumber,
          column: 'expiry_date',
          value: row.expiry_date,
          message: 'Expiry date must be in the future',
          severity: 'error'
        });
      }
    }

    // Validate nafdac_number
    if (!row.nafdac_number || row.nafdac_number.trim().length === 0) {
      rowErrors.push({
        row: rowNumber,
        column: 'nafdac_number',
        value: row.nafdac_number || '',
        message: 'NAFDAC number is required',
        severity: 'error'
      });
    } else if (!/^NAFDAC-\d{6}$/i.test(row.nafdac_number)) {
      rowWarnings.push({
        row: rowNumber,
        column: 'nafdac_number',
        value: row.nafdac_number,
        message: 'NAFDAC number should be in format: NAFDAC-123456',
        severity: 'warning'
      });
    }

    // Validate manufacturing_date
    if (!row.manufacturing_date || row.manufacturing_date.trim().length === 0) {
      rowErrors.push({
        row: rowNumber,
        column: 'manufacturing_date',
        value: row.manufacturing_date || '',
        message: 'Manufacturing date is required',
        severity: 'error'
      });
    } else if (!isValidDate(row.manufacturing_date)) {
      rowErrors.push({
        row: rowNumber,
        column: 'manufacturing_date',
        value: row.manufacturing_date,
        message: 'Manufacturing date must be in YYYY-MM-DD format',
        severity: 'error'
      });
    }

    // Validate required string fields
    const requiredStringFields = [
      'active_ingredient',
      'dosage_form',
      'strength',
      'package_size',
      'storage_conditions'
    ];

    requiredStringFields.forEach(field => {
      if (!row[field as keyof CSVRow] || row[field as keyof CSVRow]?.toString().trim().length === 0) {
        rowErrors.push({
          row: rowNumber,
          column: field,
          value: row[field as keyof CSVRow]?.toString() || '',
          message: `${field.replace('_', ' ')} is required`,
          severity: 'error'
        });
      }
    });

    // Add row errors and warnings to main arrays
    errors.push(...rowErrors);
    warnings.push(...rowWarnings);

    // Count valid/invalid rows
    if (rowErrors.length === 0) {
      validRows++;
    } else {
      invalidRows++;
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    totalRows: rows.length,
    validRows,
    invalidRows,
    data: rows
  };
}

// Validate date format (YYYY-MM-DD)
function isValidDate(dateString: string): boolean {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) {
    return false;
  }
  
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}

// Validate file size
export function validateFileSize(file: File): ValidationError[] {
  const errors: ValidationError[] = [];
  
  if (file.size > MAX_FILE_SIZE) {
    errors.push({
      row: 0,
      column: 'file',
      value: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
      message: `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024} MB`,
      severity: 'error'
    });
  }
  
  return errors;
}

// Validate file type
export function validateFileType(file: File): ValidationError[] {
  const errors: ValidationError[] = [];
  
  if (!file.name.toLowerCase().endsWith('.csv')) {
    errors.push({
      row: 0,
      column: 'file',
      value: file.name,
      message: 'File must be a CSV file',
      severity: 'error'
    });
  }
  
  return errors;
}

// Generate CSV template
export function generateCSVTemplate(): string {
  const headers = [...REQUIRED_COLUMNS, ...OPTIONAL_COLUMNS];
  const sampleData = [
    'Coartem',
    'CT2024001',
    '10000',
    'Novartis',
    'Lagos, Nigeria',
    '2025-12-31',
    'NAFDAC-123456',
    '2024-01-15',
    'Artemether/Lumefantrine',
    'Tablet',
    '20mg/120mg',
    '24 tablets per pack',
    'Store below 30°C',
    'Antimalarial medication'
  ];
  
  return [headers.join(','), sampleData.join(',')].join('\n');
}

// Format file size
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Generate unique upload ID
export function generateUploadId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `UP${timestamp}${random}`.toUpperCase();
} 