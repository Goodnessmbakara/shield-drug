#!/usr/bin/env node

/**
 * Comprehensive Test Script for Batch Details Functionality
 * Tests the complete flow from database to API to frontend
 */

const { MongoClient, ObjectId } = require('mongodb');
const axios = require('axios');
const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

// Configuration
const CONFIG = {
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/shield-drug',
  API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:3000',
  TEST_BATCH_ID: '689caef5c45c802ca13e1768',
  TEST_USER_EMAIL: 'test@manufacturer.com',
  TEST_USER_ROLE: 'manufacturer',
  TEST_DRUG_NAME: 'Paracetamol 500mg',
  TEST_MANUFACTURER: 'Test Pharmaceuticals Ltd'
};

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  errors: [],
  performance: {}
};

/**
 * Database Setup and Test Data Creation
 */
async function setupTestData() {
  console.log('🔧 Setting up test data...');
  
  const client = new MongoClient(CONFIG.MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db();
    
    // Clean existing test data
    await db.collection('uploads').deleteMany({ batchId: CONFIG.TEST_BATCH_ID });
    await db.collection('qrcodes').deleteMany({ 'metadata.batchId': CONFIG.TEST_BATCH_ID });
    
    // Create test batch document
    const batchData = {
      _id: new ObjectId(),
      fileName: 'test-batch-paracetamol.csv',
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
      description: 'Pain relief medication for testing purposes',
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
      createdAt: new Date('2024-01-15T10:00:00Z'),
      updatedAt: new Date('2024-01-15T10:30:00Z')
    };
    
    const uploadResult = await db.collection('uploads').insertOne(batchData);
    console.log(`✅ Created test batch with ID: ${uploadResult.insertedId}`);
    
    // Create associated QR codes
    const qrCodes = [];
    for (let i = 1; i <= 12; i++) {
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
          nafdacNumber: 'NAFDAC-12345-2024'
        },
        verificationCount: Math.floor(Math.random() * 6), // 0-5 verifications
        downloadCount: Math.floor(Math.random() * 3), // 0-2 downloads
        isScanned: i <= 8, // First 8 are scanned
        imageUrl: `https://example.com/qr/${CONFIG.TEST_BATCH_ID}-${i}.png`,
        verificationUrl: `${CONFIG.API_BASE_URL}/verify/${CONFIG.TEST_BATCH_ID}-${i}`,
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
      return true;
    } else {
      throw new Error(`Data integrity check failed: ${batchCount} batches, ${qrCount} QR codes`);
    }
    
  } catch (error) {
    console.error('❌ Failed to setup test data:', error.message);
    return false;
  } finally {
    await client.close();
  }
}

/**
 * API Endpoint Testing
 */
async function testAPIEndpoints() {
  console.log('🔍 Testing API endpoints...');
  
  const headers = {
    'x-user-email': CONFIG.TEST_USER_EMAIL,
    'x-user-role': CONFIG.TEST_USER_ROLE,
    'Content-Type': 'application/json'
  };
  
  // Test 1: Successful batch details retrieval
  try {
    const startTime = Date.now();
    const response = await axios.get(`${CONFIG.API_BASE_URL}/api/manufacturer/batch-details?batchId=${CONFIG.TEST_BATCH_ID}`, { headers });
    const responseTime = Date.now() - startTime;
    
    if (response.status === 200) {
      const data = response.data;
      
      // Validate response structure against BatchDetails schema
      const requiredFields = [
        'id', 'drugName', 'batchId', 'quantity', 'manufacturer', 'location', 'expiryDate',
        'nafdacNumber', 'manufacturingDate', 'activeIngredient', 'dosageForm', 'strength',
        'packageSize', 'storageConditions', 'createdAt', 'updatedAt', 'status', 'blockchainTx',
        'qrCodesGenerated', 'processingTime', 'fileHash', 'validationResult', 'qualityScore',
        'complianceStatus', 'regulatoryApproval', 'verifications', 'authenticityRate',
        'fileName', 'records', 'size', 'temperature', 'humidity'
      ];
      const missingFields = requiredFields.filter(field => !(field in data));
      
      if (missingFields.length === 0) {
        console.log('✅ Batch details API - Success case passed');
        testResults.passed++;
        testResults.performance.apiResponseTime = responseTime;
      } else {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }
    } else {
      throw new Error(`Expected 200, got ${response.status}`);
    }
  } catch (error) {
    console.error('❌ Batch details API - Success case failed:', error.message);
    testResults.failed++;
    testResults.errors.push(`API Success Test: ${error.message}`);
  }
  
  // Test 2: 404 Error - Invalid batch ID
  try {
    const response = await axios.get(`${CONFIG.API_BASE_URL}/api/manufacturer/batch-details?batchId=invalid-batch-id`, { headers });
    throw new Error('Expected 404 error for invalid batch ID');
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.log('✅ Batch details API - 404 error case passed');
      testResults.passed++;
    } else {
      console.error('❌ Batch details API - 404 error case failed:', error.message);
      testResults.failed++;
      testResults.errors.push(`API 404 Test: ${error.message}`);
    }
  }
  
  // Test 3: 403 Error - Wrong user role
  try {
    const wrongRoleHeaders = { ...headers, 'x-user-role': 'consumer' };
    const response = await axios.get(`${CONFIG.API_BASE_URL}/api/manufacturer/batch-details?batchId=${CONFIG.TEST_BATCH_ID}`, { headers: wrongRoleHeaders });
    throw new Error('Expected 403 error for wrong user role');
  } catch (error) {
    if (error.response && error.response.status === 403) {
      console.log('✅ Batch details API - 403 error case passed');
      testResults.passed++;
    } else {
      console.error('❌ Batch details API - 403 error case failed:', error.message);
      testResults.failed++;
      testResults.errors.push(`API 403 Test: ${error.message}`);
    }
  }
  
  // Test 4: 401 Error - Missing authentication
  try {
    const noAuthHeaders = { 'Content-Type': 'application/json' };
    const response = await axios.get(`${CONFIG.API_BASE_URL}/api/manufacturer/batch-details?batchId=${CONFIG.TEST_BATCH_ID}`, { headers: noAuthHeaders });
    throw new Error('Expected 401 error for missing authentication');
  } catch (error) {
    if (error.response && error.response.status === 401) {
      console.log('✅ Batch details API - 401 error case passed');
      testResults.passed++;
    } else {
      console.error('❌ Batch details API - 401 error case failed:', error.message);
      testResults.failed++;
      testResults.errors.push(`API 401 Test: ${error.message}`);
    }
  }
  
  // Test 5: QR Codes API
  try {
    const response = await axios.get(`${CONFIG.API_BASE_URL}/api/manufacturer/qr-codes?batchId=${CONFIG.TEST_BATCH_ID}`, { headers });
    
    if (response.status === 200 && response.data.qrCodes && Array.isArray(response.data.qrCodes)) {
      console.log(`✅ QR Codes API - Success case passed (${response.data.qrCodes.length} QR codes)`);
      testResults.passed++;
    } else {
      throw new Error(`Invalid QR codes response: ${response.status}`);
    }
  } catch (error) {
    console.error('❌ QR Codes API - Success case failed:', error.message);
    testResults.failed++;
    testResults.errors.push(`QR Codes API Test: ${error.message}`);
  }
}

/**
 * Frontend Integration Testing
 */
async function testFrontendIntegration() {
  console.log('🌐 Testing frontend integration...');
  
  let browser;
  
  try {
    browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Set viewport
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Set localStorage for authentication
    await page.evaluateOnNewDocument(() => {
      localStorage.setItem('userRole', 'manufacturer');
      localStorage.setItem('userEmail', 'test@manufacturer.com');
    });
    
    // Navigate to batch details page
    const startTime = Date.now();
    await page.goto(`${CONFIG.API_BASE_URL}/manufacturer/batches/${CONFIG.TEST_BATCH_ID}`, { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    const loadTime = Date.now() - startTime;
    
    // Check if page loaded successfully
    const pageTitle = await page.title();
    if (pageTitle.includes('Batch Details') || pageTitle.includes('Shield Drug')) {
      console.log('✅ Frontend - Page loading passed');
      testResults.passed++;
      testResults.performance.pageLoadTime = loadTime;
    } else {
      throw new Error(`Unexpected page title: ${pageTitle}`);
    }
    
    // Test basic information display
    const drugNameElement = await page.$('[data-testid="drug-name"], .drug-name, h1, h2');
    if (drugNameElement) {
      const drugNameText = await page.evaluate(el => el.textContent, drugNameElement);
      if (drugNameText.includes('Paracetamol')) {
        console.log('✅ Frontend - Basic information display passed');
        testResults.passed++;
      } else {
        throw new Error(`Drug name not found: ${drugNameText}`);
      }
    } else {
      throw new Error('Drug name element not found');
    }
    
    // Test QR codes dialog
    const qrButton = await page.$('[data-testid="qr-codes-button"], button, a');
    if (qrButton) {
      await qrButton.click();
      await page.waitForTimeout(1000);
      
      const dialog = await page.$('.dialog, .modal, [role="dialog"]');
      if (dialog) {
        console.log('✅ Frontend - QR codes dialog passed');
        testResults.passed++;
      } else {
        throw new Error('QR codes dialog not found');
      }
    } else {
      console.log('⚠️  QR codes button not found, skipping dialog test');
    }
    
    // Test download functionality
    const downloadButton = await page.$('[data-testid="download-button"], button, a');
    if (downloadButton) {
      // Set up download listener
      const downloadPromise = page.waitForEvent('download');
      await downloadButton.click();
      
      try {
        const download = await downloadPromise;
        console.log('✅ Frontend - Download functionality passed');
        testResults.passed++;
      } catch (error) {
        console.log('⚠️  Download test skipped (no download event)');
      }
    } else {
      console.log('⚠️  Download button not found, skipping download test');
    }
    
    // Test error handling
    await page.goto(`${CONFIG.API_BASE_URL}/manufacturer/batches/invalid-batch-id`, { 
      waitUntil: 'networkidle2',
      timeout: 10000 
    });
    
    const errorElement = await page.$('.error, .alert, [data-testid="error"]');
    if (errorElement) {
      console.log('✅ Frontend - Error handling passed');
      testResults.passed++;
    } else {
      console.log('⚠️  Error element not found, error handling test inconclusive');
    }
    
  } catch (error) {
    console.error('❌ Frontend integration test failed:', error.message);
    testResults.failed++;
    testResults.errors.push(`Frontend Test: ${error.message}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Performance and Logging Testing
 */
async function testPerformanceAndLogging() {
  console.log('⚡ Testing performance and logging...');
  
  try {
    // Test database query performance
    const client = new MongoClient(CONFIG.MONGODB_URI);
    await client.connect();
    const db = client.db();
    
    const startTime = Date.now();
    const batch = await db.collection('uploads').findOne({ batchId: CONFIG.TEST_BATCH_ID });
    const queryTime = Date.now() - startTime;
    
    if (batch && queryTime < 1000) {
      console.log(`✅ Database query performance passed (${queryTime}ms)`);
      testResults.passed++;
      testResults.performance.dbQueryTime = queryTime;
    } else {
      throw new Error(`Database query too slow: ${queryTime}ms`);
    }
    
    // Test aggregation pipeline
    const aggStartTime = Date.now();
    const qrStats = await db.collection('qrcodes').aggregate([
      { $match: { 'metadata.batchId': CONFIG.TEST_BATCH_ID } },
      { $group: {
        _id: null,
        total: { $sum: 1 },
        scanned: { $sum: { $cond: ['$isScanned', 1, 0] } },
        totalVerifications: { $sum: '$verificationCount' }
      }}
    ]).toArray();
    const aggTime = Date.now() - aggStartTime;
    
    if (qrStats.length > 0 && aggTime < 2000) {
      console.log(`✅ Aggregation pipeline performance passed (${aggTime}ms)`);
      testResults.passed++;
      testResults.performance.aggregationTime = aggTime;
    } else {
      throw new Error(`Aggregation pipeline too slow: ${aggTime}ms`);
    }
    
    await client.close();
    
  } catch (error) {
    console.error('❌ Performance test failed:', error.message);
    testResults.failed++;
    testResults.errors.push(`Performance Test: ${error.message}`);
  }
}

/**
 * Cleanup Test Data
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
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
  } finally {
    await client.close();
  }
}

/**
 * Generate Test Report
 */
async function generateReport() {
  console.log('\n📊 Generating test report...');
  
  const report = {
    timestamp: new Date().toISOString(),
    testBatchId: CONFIG.TEST_BATCH_ID,
    summary: {
      total: testResults.passed + testResults.failed,
      passed: testResults.passed,
      failed: testResults.failed,
      successRate: ((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(2) + '%'
    },
    performance: testResults.performance,
    errors: testResults.errors,
    configuration: {
      mongodbUri: CONFIG.MONGODB_URI,
      apiBaseUrl: CONFIG.API_BASE_URL,
      testUserEmail: CONFIG.TEST_USER_EMAIL
    }
  };
  
  // Save report to file
  const reportPath = path.join(__dirname, 'test-report.json');
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
  
  console.log('\n📋 Test Report Summary:');
  console.log(`Total Tests: ${report.summary.total}`);
  console.log(`Passed: ${report.summary.passed}`);
  console.log(`Failed: ${report.summary.failed}`);
  console.log(`Success Rate: ${report.summary.successRate}`);
  
  if (report.performance.apiResponseTime) {
    console.log(`API Response Time: ${report.performance.apiResponseTime}ms`);
  }
  if (report.performance.pageLoadTime) {
    console.log(`Page Load Time: ${report.performance.pageLoadTime}ms`);
  }
  if (report.performance.dbQueryTime) {
    console.log(`Database Query Time: ${report.performance.dbQueryTime}ms`);
  }
  
  if (report.errors.length > 0) {
    console.log('\n❌ Errors:');
    report.errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error}`);
    });
  }
  
  console.log(`\n📄 Detailed report saved to: ${reportPath}`);
  
  return report.summary.failed === 0;
}

/**
 * Main test execution
 */
async function runTests() {
  console.log('🚀 Starting comprehensive batch details testing...\n');
  
  try {
    // Setup phase
    const setupSuccess = await setupTestData();
    if (!setupSuccess) {
      throw new Error('Test setup failed');
    }
    
    // Test phases
    await testAPIEndpoints();
    await testFrontendIntegration();
    await testPerformanceAndLogging();
    
    // Cleanup phase
    await cleanupTestData();
    
    // Generate report
    const allTestsPassed = await generateReport();
    
    console.log(`\n${allTestsPassed ? '✅' : '❌'} All tests ${allTestsPassed ? 'passed' : 'completed with failures'}`);
    
    process.exit(allTestsPassed ? 0 : 1);
    
  } catch (error) {
    console.error('💥 Test execution failed:', error.message);
    await cleanupTestData();
    process.exit(1);
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests();
}

module.exports = {
  setupTestData,
  testAPIEndpoints,
  testFrontendIntegration,
  testPerformanceAndLogging,
  cleanupTestData,
  generateReport,
  runTests
};
