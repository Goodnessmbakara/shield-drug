#!/usr/bin/env node

/**
 * Seed Test Batch Data Script
 * Creates comprehensive test data for batch ID 689caef5c45c802ca13e1768
 */

const { MongoClient, ObjectId } = require('mongodb');
const path = require('path');

// Configuration
const CONFIG = {
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/shield-drug',
  TEST_BATCH_ID: '689caef5c45c802ca13e1768',
  TEST_USER_EMAIL: 'test@manufacturer.com',
  TEST_USER_ROLE: 'manufacturer',
  TEST_DRUG_NAME: 'Paracetamol 500mg',
  TEST_MANUFACTURER: 'Test Pharmaceuticals Ltd'
};

/**
 * Create comprehensive test batch data
 */
async function createTestBatch() {
  console.log('🌱 Creating test batch data...');
  
  const client = new MongoClient(CONFIG.MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db();
    
    // Clean up existing test data
    console.log('🧹 Cleaning up existing test data...');
    const batchDeleteResult = await db.collection('uploads').deleteMany({ batchId: CONFIG.TEST_BATCH_ID });
    const qrDeleteResult = await db.collection('qrcodes').deleteMany({ 'metadata.batchId': CONFIG.TEST_BATCH_ID });
    
    if (batchDeleteResult.deletedCount > 0 || qrDeleteResult.deletedCount > 0) {
      console.log(`✅ Cleaned up ${batchDeleteResult.deletedCount} batches and ${qrDeleteResult.deletedCount} QR codes`);
    }
    
    // Create comprehensive batch document
    const batchData = {
      _id: new ObjectId(),
      fileName: 'test-batch-paracetamol-comprehensive.csv',
      drug: CONFIG.TEST_DRUG_NAME,
      drugName: CONFIG.TEST_DRUG_NAME,
      quantity: 1000,
      manufacturer: CONFIG.TEST_MANUFACTURER,
      batchId: CONFIG.TEST_BATCH_ID,
      expiryDate: '2025-12-31',
      nafdacNumber: 'NAFDAC-12345-2024',
      manufacturingDate: '2024-01-15',
      activeIngredient: 'Paracetamol',
      dosageForm: 'Tablet',
      strength: '500mg',
      packageSize: '10 tablets per blister',
      storageConditions: 'Store below 25°C',
      location: 'Lagos, Nigeria',
      description: 'Pain relief medication for comprehensive testing purposes',
      status: 'completed',
      userEmail: CONFIG.TEST_USER_EMAIL,
      userRole: CONFIG.TEST_USER_ROLE,
      blockchainTx: '0x1234567890abcdef1234567890abcdef12345678',
      fileHash: 'sha256:abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
      qrCodesGenerated: 12,
      processingTime: 45.2,
      validationResult: {
        isValid: true,
        errors: [],
        warnings: [],
        totalRows: 1000,
        validRows: 1000,
        invalidRows: 0
      },
      qualityScore: 85,
      complianceStatus: 'Approved',
      regulatoryApproval: 'NAFDAC Approved',
      temperature: '22°C',
      humidity: '45%',
      createdAt: new Date('2024-01-15T10:00:00Z'),
      updatedAt: new Date('2024-01-15T10:30:00Z')
    };
    
    const uploadResult = await db.collection('uploads').insertOne(batchData);
    console.log(`✅ Created test batch with ID: ${uploadResult.insertedId}`);
    
    // Create associated QR codes with realistic data
    const qrCodes = [];
    const verificationStates = [
      { count: 0, isScanned: false },
      { count: 1, isScanned: true },
      { count: 2, isScanned: true },
      { count: 3, isScanned: true },
      { count: 1, isScanned: false },
      { count: 4, isScanned: true },
      { count: 5, isScanned: true },
      { count: 2, isScanned: true },
      { count: 0, isScanned: false },
      { count: 3, isScanned: true },
      { count: 1, isScanned: true },
      { count: 2, isScanned: false }
    ];
    
    for (let i = 1; i <= 12; i++) {
      const verificationState = verificationStates[i - 1];
      const qrCode = {
        qrCodeId: `QR-${CONFIG.TEST_BATCH_ID.slice(-8)}-${i.toString().padStart(3, '0')}`,
        uploadId: uploadResult.insertedId.toString(),
        userEmail: CONFIG.TEST_USER_EMAIL,
        drugCode: CONFIG.TEST_DRUG_NAME.replace(/\s+/g, '-').toUpperCase(),
        serialNumber: i,
        status: 'generated',
        metadata: {
          drugName: CONFIG.TEST_DRUG_NAME,
          batchId: CONFIG.TEST_BATCH_ID,
          manufacturer: CONFIG.TEST_MANUFACTURER,
          expiryDate: '2025-12-31',
          quantity: 1000,
          nafdacNumber: 'NAFDAC-12345-2024',
          activeIngredient: 'Paracetamol',
          dosageForm: 'Tablet',
          strength: '500mg',
          packageSize: '10 tablets per blister',
          storageConditions: 'Store below 25°C'
        },
        verificationCount: verificationState.count,
        downloadCount: Math.floor(Math.random() * 3), // 0-2 downloads
        isScanned: verificationState.isScanned,
        imageUrl: `https://example.com/qr/${CONFIG.TEST_BATCH_ID}-${i}.png`,
        verificationUrl: `${process.env.API_BASE_URL || 'http://localhost:3000'}/verify/${CONFIG.TEST_BATCH_ID}-${i}`,
        createdAt: new Date('2024-01-15T10:15:00Z'),
        updatedAt: new Date('2024-01-15T10:15:00Z')
      };
      qrCodes.push(qrCode);
    }
    
    const qrResult = await db.collection('qrcodes').insertMany(qrCodes);
    console.log(`✅ Created ${qrResult.insertedIds.length} QR codes`);
    
    // Verify data integrity
    const batchCount = await db.collection('uploads').countDocuments({ batchId: CONFIG.TEST_BATCH_ID });
    const qrCount = await db.collection('qrcodes').countDocuments({ 'metadata.batchId': CONFIG.TEST_BATCH_ID });
    
    if (batchCount === 1 && qrCount === 12) {
      console.log('✅ Test data integrity verified');
      return { success: true, batchId: uploadResult.insertedId, qrCount: 12 };
    } else {
      throw new Error(`Data integrity check failed: ${batchCount} batches, ${qrCount} QR codes`);
    }
    
  } catch (error) {
    console.error('❌ Failed to create test batch:', error.message);
    return { success: false, error: error.message };
  } finally {
    await client.close();
  }
}

/**
 * Verify created test data
 */
async function verifyTestData() {
  console.log('🔍 Verifying test data...');
  
  const client = new MongoClient(CONFIG.MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db();
    
    // Query the created batch
    const batch = await db.collection('uploads').findOne({ batchId: CONFIG.TEST_BATCH_ID });
    
    if (!batch) {
      throw new Error('Test batch not found');
    }
    
    console.log('✅ Test batch found with the following details:');
    console.log(`   Drug Name: ${batch.drugName}`);
    console.log(`   Manufacturer: ${batch.manufacturer}`);
    console.log(`   Quantity: ${batch.quantity}`);
    console.log(`   Status: ${batch.status}`);
    console.log(`   Blockchain TX: ${batch.blockchainTx}`);
    console.log(`   Quality Score: ${batch.qualityScore}`);
    console.log(`   Compliance Status: ${batch.complianceStatus}`);
    
    // Count associated QR codes
    const qrCodes = await db.collection('qrcodes').find({ 'metadata.batchId': CONFIG.TEST_BATCH_ID }).toArray();
    
    console.log(`✅ Found ${qrCodes.length} associated QR codes`);
    
    // Calculate verification statistics
    const totalVerifications = qrCodes.reduce((sum, qr) => sum + qr.verificationCount, 0);
    const scannedCount = qrCodes.filter(qr => qr.isScanned).length;
    const totalDownloads = qrCodes.reduce((sum, qr) => sum + qr.downloadCount, 0);
    
    console.log('📊 QR Code Statistics:');
    console.log(`   Total Verifications: ${totalVerifications}`);
    console.log(`   Scanned QR Codes: ${scannedCount}/${qrCodes.length}`);
    console.log(`   Total Downloads: ${totalDownloads}`);
    
    // Verify QR code metadata
    const firstQR = qrCodes[0];
    if (firstQR && firstQR.metadata.drugName === CONFIG.TEST_DRUG_NAME) {
      console.log('✅ QR code metadata verified');
    } else {
      throw new Error('QR code metadata verification failed');
    }
    
    return {
      success: true,
      batch,
      qrCodes,
      statistics: {
        totalVerifications,
        scannedCount,
        totalDownloads
      }
    };
    
  } catch (error) {
    console.error('❌ Test data verification failed:', error.message);
    return { success: false, error: error.message };
  } finally {
    await client.close();
  }
}

/**
 * Display testing URLs
 */
function displayTestingUrls() {
  const baseUrl = process.env.API_BASE_URL || 'http://localhost:3000';
  
  console.log('\n🌐 Testing URLs:');
  console.log(`   API Endpoint: ${baseUrl}/api/manufacturer/batch-details?batchId=${CONFIG.TEST_BATCH_ID}`);
  console.log(`   Frontend Page: ${baseUrl}/manufacturer/batches/${CONFIG.TEST_BATCH_ID}`);
  console.log(`   QR Codes API: ${baseUrl}/api/manufacturer/qr-codes?batchId=${CONFIG.TEST_BATCH_ID}`);
  
  console.log('\n🔧 Test Configuration:');
  console.log(`   Batch ID: ${CONFIG.TEST_BATCH_ID}`);
  console.log(`   User Email: ${CONFIG.TEST_USER_EMAIL}`);
  console.log(`   User Role: ${CONFIG.TEST_USER_ROLE}`);
  console.log(`   Drug Name: ${CONFIG.TEST_DRUG_NAME}`);
  console.log(`   Manufacturer: ${CONFIG.TEST_MANUFACTURER}`);
  
  console.log('\n📋 Required Headers for API Testing:');
  console.log(`   x-user-email: ${CONFIG.TEST_USER_EMAIL}`);
  console.log(`   x-user-role: ${CONFIG.TEST_USER_ROLE}`);
  console.log(`   Content-Type: application/json`);
}

/**
 * Cleanup test data
 */
async function cleanupTestData() {
  console.log('🧹 Cleaning up test data...');
  
  const client = new MongoClient(CONFIG.MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db();
    
    const batchResult = await db.collection('uploads').deleteMany({ batchId: CONFIG.TEST_BATCH_ID });
    const qrResult = await db.collection('qrcodes').deleteMany({ 'metadata.batchId': CONFIG.TEST_BATCH_ID });
    
    console.log(`✅ Cleaned up ${batchResult.deletedCount} batches and ${qrResult.deletedCount} QR codes`);
    return { success: true, deletedBatches: batchResult.deletedCount, deletedQRCodes: qrResult.deletedCount };
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
    return { success: false, error: error.message };
  } finally {
    await client.close();
  }
}

/**
 * Main execution function
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  console.log('🚀 Test Batch Data Seeding Script\n');
  
  switch (command) {
    case 'create':
      const createResult = await createTestBatch();
      if (createResult.success) {
        await verifyTestData();
        displayTestingUrls();
        console.log('\n✅ Test data creation completed successfully!');
      } else {
        console.error('\n❌ Test data creation failed:', createResult.error);
        process.exit(1);
      }
      break;
      
    case 'verify':
      const verifyResult = await verifyTestData();
      if (verifyResult.success) {
        displayTestingUrls();
        console.log('\n✅ Test data verification completed successfully!');
      } else {
        console.error('\n❌ Test data verification failed:', verifyResult.error);
        process.exit(1);
      }
      break;
      
    case 'cleanup':
      const cleanupResult = await cleanupTestData();
      if (cleanupResult.success) {
        console.log('\n✅ Test data cleanup completed successfully!');
      } else {
        console.error('\n❌ Test data cleanup failed:', cleanupResult.error);
        process.exit(1);
      }
      break;
      
    case 'reset':
      console.log('🔄 Resetting test data...');
      await cleanupTestData();
      const resetResult = await createTestBatch();
      if (resetResult.success) {
        await verifyTestData();
        displayTestingUrls();
        console.log('\n✅ Test data reset completed successfully!');
      } else {
        console.error('\n❌ Test data reset failed:', resetResult.error);
        process.exit(1);
      }
      break;
      
    default:
      console.log('Usage: node seed-test-batch.js <command>');
      console.log('');
      console.log('Commands:');
      console.log('  create   - Create test batch data');
      console.log('  verify   - Verify existing test data');
      console.log('  cleanup  - Remove test data');
      console.log('  reset    - Clean up and recreate test data');
      console.log('');
      console.log('Examples:');
      console.log('  node seed-test-batch.js create');
      console.log('  node seed-test-batch.js verify');
      console.log('  node seed-test-batch.js cleanup');
      console.log('  node seed-test-batch.js reset');
      break;
  }
}

// Run if this script is executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Script execution failed:', error.message);
    process.exit(1);
  });
}

module.exports = {
  createTestBatch,
  verifyTestData,
  cleanupTestData,
  displayTestingUrls,
  CONFIG
};
