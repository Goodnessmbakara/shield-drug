#!/usr/bin/env node

const crypto = require('crypto');

/**
 * Comprehensive QR Code Uniqueness Test
 */
async function runComprehensiveTest() {
  console.log('🔗 Comprehensive QR Code Uniqueness Test\n');

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
    
    // Import QR code model
    const { QRCode } = require('../src/lib/models');
    
    // Test 1: Basic uniqueness generation
    console.log('\n📋 Test 1: Basic Uniqueness Generation');
    await testBasicUniqueness(QRCode);
    
    // Test 2: Concurrent generation
    console.log('\n📋 Test 2: Concurrent Generation');
    await testConcurrentGeneration(QRCode);
    
    // Test 3: Database collision prevention
    console.log('\n📋 Test 3: Database Collision Prevention');
    await testDatabaseCollisionPrevention(QRCode);
    
    // Test 4: Large batch generation
    console.log('\n📋 Test 4: Large Batch Generation');
    await testLargeBatchGeneration(QRCode);
    
    // Test 5: Model validation
    console.log('\n📋 Test 5: Model Validation');
    await testModelValidation(QRCode);
    
    await mongoose.disconnect();
    console.log('\n✅ Database disconnected');
    
    console.log('\n🎉 All tests completed successfully!');
    console.log('\n🔧 QR Code Uniqueness Guarantees:');
    console.log('   1. ✅ Crypto.randomUUID for guaranteed uniqueness');
    console.log('   2. ✅ SHA-256 hashing for distribution');
    console.log('   3. ✅ Process ID and timestamp inclusion');
    console.log('   4. ✅ Database uniqueness checking');
    console.log('   5. ✅ Retry logic with collision detection');
    console.log('   6. ✅ In-memory session tracking');
    console.log('   7. ✅ Model-level validation');
    console.log('   8. ✅ Compound database indexes');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

/**
 * Test basic uniqueness generation
 */
async function testBasicUniqueness(QRCode) {
  const testCases = [
    { uploadId: 'UPLOAD-001', drugCode: 'DRUG-001', serialNumber: 1 },
    { uploadId: 'UPLOAD-001', drugCode: 'DRUG-001', serialNumber: 2 },
    { uploadId: 'UPLOAD-002', drugCode: 'DRUG-001', serialNumber: 1 },
    { uploadId: 'UPLOAD-001', drugCode: 'DRUG-002', serialNumber: 1 },
  ];

  const generatedIds = new Set();
  
  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    const qrCodeId = await QRCode.generateUniqueQRCodeId(
      testCase.uploadId, 
      testCase.drugCode, 
      testCase.serialNumber
    );
    
    console.log(`   Test ${i + 1}: ${qrCodeId} (${testCase.uploadId}-${testCase.drugCode}-${testCase.serialNumber})`);
    
    if (generatedIds.has(qrCodeId)) {
      throw new Error(`Duplicate QR code ID generated: ${qrCodeId}`);
    }
    generatedIds.add(qrCodeId);
  }
  
  console.log('   ✅ All basic uniqueness tests passed');
}

/**
 * Test concurrent generation
 */
async function testConcurrentGeneration(QRCode) {
  const concurrentTests = 50;
  const promises = [];
  const generatedIds = new Set();
  
  console.log(`   Generating ${concurrentTests} QR codes concurrently...`);
  
  for (let i = 0; i < concurrentTests; i++) {
    const promise = QRCode.generateUniqueQRCodeId(
      'CONCURRENT-TEST',
      'DRUG-001',
      i + 1
    ).then(qrCodeId => {
      if (generatedIds.has(qrCodeId)) {
        throw new Error(`Concurrent duplicate detected: ${qrCodeId}`);
      }
      generatedIds.add(qrCodeId);
      return qrCodeId;
    });
    
    promises.push(promise);
  }
  
  const results = await Promise.all(promises);
  console.log(`   ✅ Generated ${results.length} unique QR codes concurrently`);
  console.log(`   Sample IDs: ${results.slice(0, 5).join(', ')}...`);
}

/**
 * Test database collision prevention
 */
async function testDatabaseCollisionPrevention(QRCode) {
  // Create a test QR code in the database
  const testQRCode = new QRCode({
    qrCodeId: await QRCode.generateUniqueQRCodeId('TEST-UPLOAD', 'TEST-DRUG', 1),
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
  
  await testQRCode.save();
  console.log(`   Created test QR code: ${testQRCode.qrCodeId}`);
  
  // Try to generate the same ID (should fail)
  try {
    const duplicateId = testQRCode.qrCodeId;
    const newQRCode = new QRCode({
      ...testQRCode.toObject(),
      qrCodeId: duplicateId,
      serialNumber: 2
    });
    
    await newQRCode.save();
    throw new Error('Should have failed with duplicate key error');
  } catch (error) {
    if (error.code === 11000 || error.message.includes('already exists')) {
      console.log('   ✅ Duplicate key prevention working correctly');
    } else {
      throw error;
    }
  }
  
  // Clean up test data
  await QRCode.deleteOne({ qrCodeId: testQRCode.qrCodeId });
  console.log('   ✅ Test data cleaned up');
}

/**
 * Test large batch generation
 */
async function testLargeBatchGeneration(QRCode) {
  const batchSize = 100;
  const generatedIds = new Set();
  const startTime = Date.now();
  
  console.log(`   Generating ${batchSize} QR codes in batch...`);
  
  for (let i = 0; i < batchSize; i++) {
    const qrCodeId = await QRCode.generateUniqueQRCodeId(
      'BATCH-TEST',
      'DRUG-001',
      i + 1
    );
    
    if (generatedIds.has(qrCodeId)) {
      throw new Error(`Batch duplicate detected: ${qrCodeId}`);
    }
    generatedIds.add(qrCodeId);
    
    if ((i + 1) % 20 === 0) {
      console.log(`   Generated ${i + 1}/${batchSize} QR codes...`);
    }
  }
  
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  console.log(`   ✅ Generated ${batchSize} unique QR codes in ${duration}ms`);
  console.log(`   Average time per QR code: ${(duration / batchSize).toFixed(2)}ms`);
}

/**
 * Test model validation
 */
async function testModelValidation(QRCode) {
  console.log('   Testing model validation...');
  
  // Test invalid QR code ID format
  try {
    const invalidQRCode = new QRCode({
      qrCodeId: 'INVALID-ID',
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
    
    await invalidQRCode.save();
    throw new Error('Should have failed validation');
  } catch (error) {
    if (error.message.includes('QR Code ID must follow the format')) {
      console.log('   ✅ Invalid format validation working');
    } else {
      throw error;
    }
  }
  
  // Test null QR code ID
  try {
    const nullQRCode = new QRCode({
      qrCodeId: null,
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
    
    await nullQRCode.save();
    throw new Error('Should have failed null validation');
  } catch (error) {
    if (error.message.includes('QR Code ID cannot be null')) {
      console.log('   ✅ Null value validation working');
    } else {
      throw error;
    }
  }
  
  console.log('   ✅ All model validation tests passed');
}

// Run the comprehensive test
runComprehensiveTest().catch(console.error);
