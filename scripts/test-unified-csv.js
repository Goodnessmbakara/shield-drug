#!/usr/bin/env node

/**
 * Test script for unified CSV export functionality
 * This script tests the generateUnifiedCSVExport and convertToCSV functions
 */

// Mock data for testing
const mockBatchData = {
  drugName: 'Coartem',
  batchId: 'CT2024001',
  expiryDate: '2025-12-31',
  manufacturer: 'Novartis',
  location: 'Lagos Nigeria',
  nafdacNumber: 'NAFDAC-123456',
  manufacturingDate: '2024-01-15',
  activeIngredient: 'Artemether/Lumefantrine',
  dosageForm: 'Tablet',
  strength: '20mg/120mg',
  packageSize: '24 tablets per pack',
  storageConditions: 'Store below 30°C',
  description: 'Antimalarial medication',
  createdAt: '2024-01-15T10:30:00Z',
  fileHash: 'sha256_hash_here',
  qualityScore: 95,
  complianceStatus: 'Compliant',
  regulatoryApproval: 'Approved',
  verifications: 0,
  authenticityRate: 100
};

const mockQRCodes = [
  {
    qrCodeId: 'QR_CT2024001_001',
    blockchainTx: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
  },
  {
    qrCodeId: 'QR_CT2024001_002',
    blockchainTx: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
  }
];

const mockAdditionalData = {
  temperature: '25°C',
  humidity: '65%'
};

// Simplified versions of the utility functions for testing
function generateUnifiedCSVExport(batchData, qrCodes, additionalData = {}) {
  return qrCodes.map((qrCode, index) => ({
    // Core drug information
    serial_number: index + 1,
    drug_name: batchData.drugName || batchData.drug,
    batch_id: batchData.batchId,
    quantity: 1,
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
    temperature: additionalData.temperature || batchData.temperature,
    humidity: additionalData.humidity || batchData.humidity,
    
    // Blockchain and verification data
    qr_code_id: qrCode.qrCodeId,
    blockchain_tx: qrCode.blockchainTx,
    file_hash: batchData.fileHash,
    
    // Timestamps
    created_date: batchData.createdAt,
    upload_date: batchData.date || batchData.createdAt,
    
    // Quality and compliance data
    quality_score: additionalData.qualityScore || batchData.qualityScore,
    compliance_status: additionalData.complianceStatus || batchData.complianceStatus,
    regulatory_approval: additionalData.regulatoryApproval || batchData.regulatoryApproval,
    
    // Verification tracking
    verification_count: additionalData.verificationCount || batchData.verifications || 0,
    authenticity_rate: additionalData.authenticityRate || batchData.authenticityRate,
    last_verified: additionalData.lastVerified,
  }));
}

function convertToCSV(data) {
  if (data.length === 0) {
    return '';
  }
  
  const headers = Object.keys(data[0]);
  const csvHeaders = headers.join(',');
  const csvRows = data.map(row => 
    headers.map(header => {
      const value = row[header];
      // Handle values that might contain commas by wrapping in quotes
      if (typeof value === 'string' && value.includes(',')) {
        return `"${value}"`;
      }
      return value || '';
    }).join(',')
  );
  
  return [csvHeaders, ...csvRows].join('\n');
}

// Test the functionality
console.log('🧪 Testing Unified CSV Export Functionality\n');

// Test 1: Generate unified CSV export data
console.log('1. Testing generateUnifiedCSVExport...');
const exportData = generateUnifiedCSVExport(mockBatchData, mockQRCodes, mockAdditionalData);
console.log(`✅ Generated ${exportData.length} records`);
console.log(`   First record keys: ${Object.keys(exportData[0]).length} fields`);
console.log(`   Sample record:`, JSON.stringify(exportData[0], null, 2));

// Test 2: Convert to CSV
console.log('\n2. Testing convertToCSV...');
const csvContent = convertToCSV(exportData);
console.log(`✅ Generated CSV with ${csvContent.split('\n').length} lines`);
console.log('   First line (headers):', csvContent.split('\n')[0]);

// Test 3: Validate required fields
console.log('\n3. Validating required fields...');
const requiredFields = [
  'serial_number', 'drug_name', 'batch_id', 'quantity', 'expiry_date',
  'manufacturer', 'location', 'nafdac_number', 'manufacturing_date',
  'active_ingredient', 'dosage_form', 'strength', 'package_size',
  'storage_conditions', 'qr_code_id', 'blockchain_tx', 'file_hash',
  'created_date'
];

const missingFields = requiredFields.filter(field => !(field in exportData[0]));
if (missingFields.length === 0) {
  console.log('✅ All required fields are present');
} else {
  console.log('❌ Missing required fields:', missingFields);
}

// Test 4: Validate data types
console.log('\n4. Validating data types...');
const typeChecks = [
  { field: 'serial_number', expected: 'number', actual: typeof exportData[0].serial_number },
  { field: 'drug_name', expected: 'string', actual: typeof exportData[0].drug_name },
  { field: 'quantity', expected: 'number', actual: typeof exportData[0].quantity },
  { field: 'quality_score', expected: 'number', actual: typeof exportData[0].quality_score }
];

const typeErrors = typeChecks.filter(check => check.actual !== check.expected);
if (typeErrors.length === 0) {
  console.log('✅ All data types are correct');
} else {
  console.log('❌ Data type errors:', typeErrors);
}

// Test 5: Test CSV parsing
console.log('\n5. Testing CSV parsing...');
const csvLines = csvContent.split('\n');
const headerCount = csvLines[0].split(',').length;
const dataLineCount = csvLines[1].split(',').length;

if (headerCount === dataLineCount) {
  console.log(`✅ CSV structure is valid (${headerCount} columns)`);
} else {
  console.log(`❌ CSV structure error: ${headerCount} headers vs ${dataLineCount} data columns`);
}

console.log('\n🎉 Unified CSV Export Test Complete!');
console.log('\n📊 Summary:');
console.log(`   - Records generated: ${exportData.length}`);
console.log(`   - Fields per record: ${Object.keys(exportData[0]).length}`);
console.log(`   - CSV lines: ${csvLines.length}`);
console.log(`   - CSV columns: ${headerCount}`);

// Save test output to file
const fs = require('fs');
const testOutput = {
  timestamp: new Date().toISOString(),
  testData: exportData,
  csvContent: csvContent,
  summary: {
    recordsGenerated: exportData.length,
    fieldsPerRecord: Object.keys(exportData[0]).length,
    csvLines: csvLines.length,
    csvColumns: headerCount
  }
};

fs.writeFileSync('test-unified-csv-output.json', JSON.stringify(testOutput, null, 2));
console.log('\n💾 Test output saved to test-unified-csv-output.json');
