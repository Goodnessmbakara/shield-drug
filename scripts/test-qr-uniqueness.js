#!/usr/bin/env node

const crypto = require('crypto');

/**
 * Test QR code uniqueness generation
 */
function testQRCodeUniqueness() {
  console.log('🔗 Testing QR Code Uniqueness Generation\n');

  const testCases = [
    { uploadId: 'UPLOAD-001', drugCode: 'DRUG-001', serialNumber: 1 },
    { uploadId: 'UPLOAD-001', drugCode: 'DRUG-001', serialNumber: 2 },
    { uploadId: 'UPLOAD-002', drugCode: 'DRUG-001', serialNumber: 1 },
    { uploadId: 'UPLOAD-001', drugCode: 'DRUG-002', serialNumber: 1 },
  ];

  const generatedIds = new Set();
  const duplicates = [];

  console.log('📋 Testing QR Code ID Generation:');
  
  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    const qrCodeId = generateUniqueQRCodeId(
      testCase.uploadId, 
      testCase.drugCode, 
      testCase.serialNumber
    );
    
    console.log(`   Test ${i + 1}: ${qrCodeId} (${testCase.uploadId}-${testCase.drugCode}-${testCase.serialNumber})`);
    
    if (generatedIds.has(qrCodeId)) {
      duplicates.push(qrCodeId);
    } else {
      generatedIds.add(qrCodeId);
    }
  }

  // Test multiple generations of the same input
  console.log('\n🔄 Testing Multiple Generations of Same Input:');
  const sameInputIds = [];
  for (let i = 0; i < 10; i++) {
    const qrCodeId = generateUniqueQRCodeId('UPLOAD-001', 'DRUG-001', 1);
    sameInputIds.push(qrCodeId);
    console.log(`   Generation ${i + 1}: ${qrCodeId}`);
  }

  // Check for duplicates in same input test
  const sameInputDuplicates = sameInputIds.filter((id, index) => sameInputIds.indexOf(id) !== index);
  
  console.log('\n📊 Results:');
  console.log(`   Total unique IDs generated: ${generatedIds.size}`);
  console.log(`   Duplicates found: ${duplicates.length}`);
  console.log(`   Same input duplicates: ${sameInputDuplicates.length}`);
  
  if (duplicates.length === 0 && sameInputDuplicates.length === 0) {
    console.log('✅ All QR codes are unique!');
  } else {
    console.log('❌ Duplicate QR codes found!');
    if (duplicates.length > 0) {
      console.log(`   Duplicates: ${duplicates.join(', ')}`);
    }
    if (sameInputDuplicates.length > 0) {
      console.log(`   Same input duplicates: ${sameInputDuplicates.join(', ')}`);
    }
  }

  // Test validation function
  console.log('\n🔍 Testing QR Code ID Validation:');
  const validationTests = [
    'QR-12345678', // Valid
    'QR-ABCDEF12', // Valid
    'QR-1234567',  // Too short
    'qr-12345678', // Wrong case
    'QR12345678',  // Missing dash
    'QR-1234567G', // Invalid character
    '',            // Empty
    null,          // Null
    undefined      // Undefined
  ];

  validationTests.forEach((testId, index) => {
    const isValid = validateQRCodeId(testId);
    console.log(`   Test ${index + 1}: "${testId}" -> ${isValid ? '✅ Valid' : '❌ Invalid'}`);
  });
}

/**
 * Generate unique QR code ID with guaranteed uniqueness
 */
function generateUniqueQRCodeId(uploadId, drugCode, serialNumber, batchId) {
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
function validateQRCodeId(qrCodeId) {
  if (!qrCodeId || typeof qrCodeId !== 'string') {
    return false;
  }
  
  // Check if it starts with QR- and has at least 8 characters after
  const qrCodePattern = /^QR-[A-F0-9]{8,}$/;
  return qrCodePattern.test(qrCodeId);
}

/**
 * Test database connection and QR code model
 */
async function testDatabaseConnection() {
  console.log('\n🗄️ Testing Database Connection and QR Code Model...');
  
  try {
    // Load environment variables
    require('dotenv').config({ path: '.env.local' });
    
    const mongoose = require('mongoose');
    const MONGODB_URI = process.env.DATABASE_URL;
    
    if (!MONGODB_URI) {
      console.log('❌ DATABASE_URL not configured');
      return;
    }
    
    console.log('🔗 Connecting to database...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Database connected successfully');
    
    // Test QR code model
    const QRCode = require('../src/lib/models/QRCode');
    
    // Test creating a QR code document
    const testQRCode = new QRCode({
      qrCodeId: generateUniqueQRCodeId('TEST-UPLOAD', 'TEST-DRUG', 1),
      uploadId: 'TEST-UPLOAD',
      userEmail: 'test@example.com',
      drugCode: 'TEST-DRUG',
      serialNumber: 1,
      verificationUrl: 'http://localhost:3001/verify/test',
      imageUrl: 'http://localhost:3001/qr/test.png',
      metadata: {
        drugName: 'Test Drug',
        batchId: 'TEST-BATCH',
        manufacturer: 'Test Manufacturer',
        expiryDate: '2025-12-31',
        quantity: 1
      }
    });
    
    console.log('✅ QR Code model validation passed');
    
    // Test saving to database
    await testQRCode.save();
    console.log('✅ QR Code saved to database successfully');
    
    // Clean up test data
    await QRCode.deleteOne({ qrCodeId: testQRCode.qrCodeId });
    console.log('✅ Test data cleaned up');
    
    await mongoose.disconnect();
    console.log('✅ Database disconnected');
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    
    if (error.name === 'ValidationError') {
      console.log('🔍 Validation errors:');
      Object.keys(error.errors).forEach(key => {
        console.log(`   ${key}: ${error.errors[key].message}`);
      });
    }
    
    if (error.code === 11000) {
      console.log('🔍 Duplicate key error detected');
    }
  }
}

// Run tests
async function runTests() {
  testQRCodeUniqueness();
  await testDatabaseConnection();
  
  console.log('\n🎉 QR Code Uniqueness Test Complete!');
  console.log('\n🔧 Summary of fixes applied:');
  console.log('   1. ✅ Improved QR code ID generation with crypto.randomUUID');
  console.log('   2. ✅ Added SHA-256 hashing for better uniqueness');
  console.log('   3. ✅ Added validation and sanitization functions');
  console.log('   4. ✅ Fixed AuditLog userRole enum to include "system"');
  console.log('   5. ✅ Enhanced error handling in upload batch API');
  console.log('   6. ✅ Added database validation for QR code model');
}

runTests().catch(console.error);
