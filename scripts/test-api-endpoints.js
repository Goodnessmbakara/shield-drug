#!/usr/bin/env node

/**
 * API Endpoints Testing Script
 * Comprehensive testing for batch details and QR codes APIs
 */

const axios = require('axios');
const { MongoClient } = require('mongodb');

// Configuration
const CONFIG = {
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/shield-drug',
  API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:3000',
  TEST_BATCH_ID: '689caef5c45c802ca13e1768',
  TEST_USER_EMAIL: 'test@manufacturer.com',
  TEST_USER_ROLE: 'manufacturer'
};

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  errors: [],
  performance: {}
};

/**
 * Environment Setup and Configuration
 */
async function setupEnvironment() {
  console.log('🔧 Setting up testing environment...');
  
  // Verify database connection
  const client = new MongoClient(CONFIG.MONGODB_URI);
  try {
    await client.connect();
    const db = client.db();
    
    // Check if test batch exists
    const batch = await db.collection('uploads').findOne({ batchId: CONFIG.TEST_BATCH_ID });
    if (!batch) {
      throw new Error(`Test batch ${CONFIG.TEST_BATCH_ID} not found in database. Run seed-test-batch.js first.`);
    }
    
    console.log('✅ Database connection verified');
    console.log('✅ Test batch found in database');
    
    return true;
  } catch (error) {
    console.error('❌ Environment setup failed:', error.message);
    return false;
  } finally {
    await client.close();
  }
}

/**
 * Batch Details API Testing
 */
async function testBatchDetailsAPI() {
  console.log('\n🔍 Testing Batch Details API...');
  
  const headers = {
    'x-user-email': CONFIG.TEST_USER_EMAIL,
    'x-user-role': CONFIG.TEST_USER_ROLE,
    'Content-Type': 'application/json'
  };
  
  // Test 1: Successful batch details retrieval
  try {
    console.log('  Testing successful retrieval...');
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
        console.log('    ✅ Success case passed');
        testResults.passed++;
        testResults.performance.batchDetailsResponseTime = responseTime;
        
        // Validate specific field types
        if (typeof data.drugName === 'string' && data.drugName.includes('Paracetamol')) {
          console.log('    ✅ Drug name validation passed');
        } else {
          throw new Error('Drug name validation failed');
        }
        
        if (typeof data.processingTime === 'number' || data.processingTime === null) {
          console.log('    ✅ Processing time validation passed');
        } else {
          throw new Error('Processing time validation failed');
        }
        
        if (typeof data.qualityScore === 'number' && data.qualityScore >= 0 && data.qualityScore <= 100) {
          console.log('    ✅ Quality score validation passed');
        } else {
          throw new Error('Quality score validation failed');
        }
        
      } else {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }
    } else {
      throw new Error(`Expected 200, got ${response.status}`);
    }
  } catch (error) {
    console.error('    ❌ Success case failed:', error.message);
    testResults.failed++;
    testResults.errors.push(`Batch Details Success Test: ${error.message}`);
  }
  
  // Test 2: 404 Error - Invalid batch ID
  try {
    console.log('  Testing 404 error (invalid batch ID)...');
    const response = await axios.get(`${CONFIG.API_BASE_URL}/api/manufacturer/batch-details?batchId=invalid-batch-id`, { headers });
    throw new Error('Expected 404 error for invalid batch ID');
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.log('    ✅ 404 error case passed');
      testResults.passed++;
    } else {
      console.error('    ❌ 404 error case failed:', error.message);
      testResults.failed++;
      testResults.errors.push(`Batch Details 404 Test: ${error.message}`);
    }
  }
  
  // Test 3: 403 Error - Wrong user role
  try {
    console.log('  Testing 403 error (wrong user role)...');
    const wrongRoleHeaders = { ...headers, 'x-user-role': 'consumer' };
    const response = await axios.get(`${CONFIG.API_BASE_URL}/api/manufacturer/batch-details?batchId=${CONFIG.TEST_BATCH_ID}`, { headers: wrongRoleHeaders });
    throw new Error('Expected 403 error for wrong user role');
  } catch (error) {
    if (error.response && error.response.status === 403) {
      console.log('    ✅ 403 error case passed');
      testResults.passed++;
    } else {
      console.error('    ❌ 403 error case failed:', error.message);
      testResults.failed++;
      testResults.errors.push(`Batch Details 403 Test: ${error.message}`);
    }
  }
  
  // Test 4: 401 Error - Missing authentication
  try {
    console.log('  Testing 401 error (missing authentication)...');
    const noAuthHeaders = { 'Content-Type': 'application/json' };
    const response = await axios.get(`${CONFIG.API_BASE_URL}/api/manufacturer/batch-details?batchId=${CONFIG.TEST_BATCH_ID}`, { headers: noAuthHeaders });
    throw new Error('Expected 401 error for missing authentication');
  } catch (error) {
    if (error.response && error.response.status === 401) {
      console.log('    ✅ 401 error case passed');
      testResults.passed++;
    } else {
      console.error('    ❌ 401 error case failed:', error.message);
      testResults.failed++;
      testResults.errors.push(`Batch Details 401 Test: ${error.message}`);
    }
  }
  
  // Test 5: 400 Error - Missing batchId parameter
  try {
    console.log('  Testing 400 error (missing batchId)...');
    const response = await axios.get(`${CONFIG.API_BASE_URL}/api/manufacturer/batch-details`, { headers });
    throw new Error('Expected 400 error for missing batchId parameter');
  } catch (error) {
    if (error.response && error.response.status === 400) {
      console.log('    ✅ 400 error case passed');
      testResults.passed++;
    } else {
      console.error('    ❌ 400 error case failed:', error.message);
      testResults.failed++;
      testResults.errors.push(`Batch Details 400 Test: ${error.message}`);
    }
  }
  
  // Test 6: 405 Error - Wrong HTTP method
  try {
    console.log('  Testing 405 error (wrong HTTP method)...');
    const response = await axios.post(`${CONFIG.API_BASE_URL}/api/manufacturer/batch-details?batchId=${CONFIG.TEST_BATCH_ID}`, {}, { headers });
    throw new Error('Expected 405 error for POST method');
  } catch (error) {
    if (error.response && error.response.status === 405) {
      console.log('    ✅ 405 error case passed');
      testResults.passed++;
    } else {
      console.error('    ❌ 405 error case failed:', error.message);
      testResults.failed++;
      testResults.errors.push(`Batch Details 405 Test: ${error.message}`);
    }
  }
}

/**
 * QR Codes API Testing
 */
async function testQRCodesAPI() {
  console.log('\n🔍 Testing QR Codes API...');
  
  const headers = {
    'x-user-email': CONFIG.TEST_USER_EMAIL,
    'x-user-role': CONFIG.TEST_USER_ROLE,
    'Content-Type': 'application/json'
  };
  
  // Test 1: Successful QR codes retrieval
  try {
    console.log('  Testing successful QR codes retrieval...');
    const startTime = Date.now();
    const response = await axios.get(`${CONFIG.API_BASE_URL}/api/manufacturer/qr-codes?batchId=${CONFIG.TEST_BATCH_ID}`, { headers });
    const responseTime = Date.now() - startTime;
    
    if (response.status === 200 && response.data.qrCodes && Array.isArray(response.data.qrCodes)) {
      console.log(`    ✅ Success case passed (${response.data.qrCodes.length} QR codes)`);
      testResults.passed++;
      testResults.performance.qrCodesResponseTime = responseTime;
      
      // Validate QR code structure
      if (response.data.qrCodes.length > 0) {
        const firstQR = response.data.qrCodes[0];
        const requiredQRFields = ['id', 'qrCodeId', 'batchId', 'drug', 'quantity', 'status', 'date'];
        const missingQRFields = requiredQRFields.filter(field => !(field in firstQR));
        
        if (missingQRFields.length === 0) {
          console.log('    ✅ QR code structure validation passed');
        } else {
          throw new Error(`Missing QR code fields: ${missingQRFields.join(', ')}`);
        }
        
        // Validate batch ID
        if (firstQR.batchId) {
          console.log('    ✅ QR code batch ID validation passed');
        } else {
          throw new Error('QR code batch ID validation failed');
        }
      }
      
    } else {
      throw new Error(`Invalid QR codes response: ${response.status}`);
    }
  } catch (error) {
    console.error('    ❌ Success case failed:', error.message);
    testResults.failed++;
    testResults.errors.push(`QR Codes Success Test: ${error.message}`);
  }
  
  // Test 2: 404 Error - Invalid batch ID
  try {
    console.log('  Testing 404 error (invalid batch ID)...');
    const response = await axios.get(`${CONFIG.API_BASE_URL}/api/manufacturer/qr-codes?batchId=invalid-batch-id`, { headers });
    throw new Error('Expected 404 error for invalid batch ID');
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.log('    ✅ 404 error case passed');
      testResults.passed++;
    } else {
      console.error('    ❌ 404 error case failed:', error.message);
      testResults.failed++;
      testResults.errors.push(`QR Codes 404 Test: ${error.message}`);
    }
  }
  
  // Test 3: 403 Error - Wrong user role
  try {
    console.log('  Testing 403 error (wrong user role)...');
    const wrongRoleHeaders = { ...headers, 'x-user-role': 'pharmacist' };
    const response = await axios.get(`${CONFIG.API_BASE_URL}/api/manufacturer/qr-codes?batchId=${CONFIG.TEST_BATCH_ID}`, { headers: wrongRoleHeaders });
    throw new Error('Expected 403 error for wrong user role');
  } catch (error) {
    if (error.response && error.response.status === 403) {
      console.log('    ✅ 403 error case passed');
      testResults.passed++;
    } else {
      console.error('    ❌ 403 error case failed:', error.message);
      testResults.failed++;
      testResults.errors.push(`QR Codes 403 Test: ${error.message}`);
    }
  }
  
  // Test 4: Pagination testing
  try {
    console.log('  Testing pagination...');
    const response = await axios.get(`${CONFIG.API_BASE_URL}/api/manufacturer/qr-codes?batchId=${CONFIG.TEST_BATCH_ID}&limit=5`, { headers });
    
    if (response.status === 200 && response.data.qrCodes && Array.isArray(response.data.qrCodes)) {
      if (response.data.qrCodes.length <= 5) {
        console.log('    ✅ Pagination test passed');
        testResults.passed++;
      } else {
        throw new Error('Pagination limit not respected');
      }
      
      // Validate pagination object
      if (response.data.pagination) {
        console.log('    ✅ Pagination object validation passed');
      } else {
        throw new Error('Pagination object missing');
      }
    } else {
      throw new Error('Invalid pagination response');
    }
  } catch (error) {
    console.error('    ❌ Pagination test failed:', error.message);
    testResults.failed++;
    testResults.errors.push(`QR Codes Pagination Test: ${error.message}`);
  }
}

/**
 * Authentication and Authorization Testing
 */
async function testAuthenticationAndAuthorization() {
  console.log('\n🔐 Testing Authentication and Authorization...');
  
  const baseHeaders = {
    'Content-Type': 'application/json'
  };
  
  // Test 1: Missing x-user-email header
  try {
    console.log('  Testing missing x-user-email header...');
    const headers = { ...baseHeaders, 'x-user-role': CONFIG.TEST_USER_ROLE };
    const response = await axios.get(`${CONFIG.API_BASE_URL}/api/manufacturer/batch-details?batchId=${CONFIG.TEST_BATCH_ID}`, { headers });
    throw new Error('Expected 401 error for missing x-user-email');
  } catch (error) {
    if (error.response && error.response.status === 401) {
      console.log('    ✅ Missing x-user-email test passed');
      testResults.passed++;
    } else {
      console.error('    ❌ Missing x-user-email test failed:', error.message);
      testResults.failed++;
      testResults.errors.push(`Auth Missing Email Test: ${error.message}`);
    }
  }
  
  // Test 2: Missing x-user-role header
  try {
    console.log('  Testing missing x-user-role header...');
    const headers = { ...baseHeaders, 'x-user-email': CONFIG.TEST_USER_EMAIL };
    const response = await axios.get(`${CONFIG.API_BASE_URL}/api/manufacturer/batch-details?batchId=${CONFIG.TEST_BATCH_ID}`, { headers });
    throw new Error('Expected 401 error for missing x-user-role');
  } catch (error) {
    if (error.response && error.response.status === 401) {
      console.log('    ✅ Missing x-user-role test passed');
      testResults.passed++;
    } else {
      console.error('    ❌ Missing x-user-role test failed:', error.message);
      testResults.failed++;
      testResults.errors.push(`Auth Missing Role Test: ${error.message}`);
    }
  }
  
  // Test 3: Different user email (should be denied access)
  try {
    console.log('  Testing different user email...');
    const headers = {
      ...baseHeaders,
      'x-user-email': 'different@manufacturer.com',
      'x-user-role': CONFIG.TEST_USER_ROLE
    };
    const response = await axios.get(`${CONFIG.API_BASE_URL}/api/manufacturer/batch-details?batchId=${CONFIG.TEST_BATCH_ID}`, { headers });
    throw new Error('Expected 403 error for different user email');
  } catch (error) {
    if (error.response && error.response.status === 403) {
      console.log('    ✅ Different user email test passed');
      testResults.passed++;
    } else {
      console.error('    ❌ Different user email test failed:', error.message);
      testResults.failed++;
      testResults.errors.push(`Auth Different Email Test: ${error.message}`);
    }
  }
}

/**
 * Database Integration Testing
 */
async function testDatabaseIntegration() {
  console.log('\n🗄️  Testing Database Integration...');
  
  const client = new MongoClient(CONFIG.MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db();
    
    // Test 1: Database connection and query performance
    console.log('  Testing database query performance...');
    const startTime = Date.now();
    const batch = await db.collection('uploads').findOne({ batchId: CONFIG.TEST_BATCH_ID });
    const queryTime = Date.now() - startTime;
    
    if (batch && queryTime < 1000) {
      console.log(`    ✅ Database query performance passed (${queryTime}ms)`);
      testResults.passed++;
      testResults.performance.dbQueryTime = queryTime;
    } else {
      throw new Error(`Database query too slow: ${queryTime}ms`);
    }
    
    // Test 2: Aggregation pipeline for QR code statistics
    console.log('  Testing aggregation pipeline...');
    const aggStartTime = Date.now();
    const qrStats = await db.collection('qrcodes').aggregate([
      { $match: { 'metadata.batchId': CONFIG.TEST_BATCH_ID } },
      { $group: {
        _id: null,
        total: { $sum: 1 },
        scanned: { $sum: { $cond: ['$isScanned', 1, 0] } },
        totalVerifications: { $sum: '$verificationCount' },
        totalDownloads: { $sum: '$downloadCount' }
      }}
    ]).toArray();
    const aggTime = Date.now() - aggStartTime;
    
    if (qrStats.length > 0 && aggTime < 2000) {
      console.log(`    ✅ Aggregation pipeline performance passed (${aggTime}ms)`);
      testResults.passed++;
      testResults.performance.aggregationTime = aggTime;
      
      const stats = qrStats[0];
      console.log(`    📊 QR Code Statistics: Total=${stats.total}, Scanned=${stats.scanned}, Verifications=${stats.totalVerifications}, Downloads=${stats.totalDownloads}`);
    } else {
      throw new Error(`Aggregation pipeline too slow: ${aggTime}ms`);
    }
    
    // Test 3: ObjectId format handling
    console.log('  Testing ObjectId format handling...');
    const objectIdBatch = await db.collection('uploads').findOne({ batchId: CONFIG.TEST_BATCH_ID });
    if (objectIdBatch && objectIdBatch._id) {
      console.log('    ✅ ObjectId format handling passed');
      testResults.passed++;
    } else {
      throw new Error('ObjectId format handling failed');
    }
    
  } catch (error) {
    console.error('    ❌ Database integration test failed:', error.message);
    testResults.failed++;
    testResults.errors.push(`Database Integration Test: ${error.message}`);
  } finally {
    await client.close();
  }
}

/**
 * Response Format and Data Quality Testing
 */
async function testResponseFormatAndDataQuality() {
  console.log('\n📊 Testing Response Format and Data Quality...');
  
  const headers = {
    'x-user-email': CONFIG.TEST_USER_EMAIL,
    'x-user-role': CONFIG.TEST_USER_ROLE,
    'Content-Type': 'application/json'
  };
  
  try {
    // Test batch details response format
    console.log('  Testing batch details response format...');
    const response = await axios.get(`${CONFIG.API_BASE_URL}/api/manufacturer/batch-details?batchId=${CONFIG.TEST_BATCH_ID}`, { headers });
    
    if (response.status === 200) {
      const data = response.data;
      
      // Test date formatting
      if (data.createdAt && typeof data.createdAt === 'string') {
        const date = new Date(data.createdAt);
        if (!isNaN(date.getTime())) {
          console.log('    ✅ Date formatting validation passed');
          testResults.passed++;
        } else {
          throw new Error('Invalid date format');
        }
      }
      
      // Test numeric fields
      if (typeof data.confidence === 'number' && data.confidence >= 0 && data.confidence <= 1) {
        console.log('    ✅ Numeric field validation passed');
        testResults.passed++;
      } else {
        throw new Error('Invalid confidence value');
      }
      
      // Test array fields
      if (Array.isArray(data.issues) && Array.isArray(data.extractedText)) {
        console.log('    ✅ Array field validation passed');
        testResults.passed++;
      } else {
        throw new Error('Invalid array fields');
      }
      
      // Test boolean fields
      if (typeof data.isDrugImage === 'boolean') {
        console.log('    ✅ Boolean field validation passed');
        testResults.passed++;
      } else {
        throw new Error('Invalid boolean field');
      }
      
      // Test null/undefined handling
      const hasNullValues = Object.values(data).some(value => value === null);
      if (!hasNullValues) {
        console.log('    ✅ Null/undefined handling passed');
        testResults.passed++;
      } else {
        throw new Error('Unexpected null values in response');
      }
      
    } else {
      throw new Error(`Invalid response status: ${response.status}`);
    }
    
  } catch (error) {
    console.error('    ❌ Response format test failed:', error.message);
    testResults.failed++;
    testResults.errors.push(`Response Format Test: ${error.message}`);
  }
}

/**
 * Performance and Logging Testing
 */
async function testPerformanceAndLogging() {
  console.log('\n⚡ Testing Performance and Logging...');
  
  const headers = {
    'x-user-email': CONFIG.TEST_USER_EMAIL,
    'x-user-role': CONFIG.TEST_USER_ROLE,
    'Content-Type': 'application/json'
  };
  
  try {
    // Test response time under load
    console.log('  Testing response time under load...');
    const responseTimes = [];
    
    for (let i = 0; i < 5; i++) {
      const startTime = Date.now();
      await axios.get(`${CONFIG.API_BASE_URL}/api/manufacturer/batch-details?batchId=${CONFIG.TEST_BATCH_ID}`, { headers });
      const responseTime = Date.now() - startTime;
      responseTimes.push(responseTime);
    }
    
    const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    const maxResponseTime = Math.max(...responseTimes);
    
    if (avgResponseTime < 2000 && maxResponseTime < 5000) {
      console.log(`    ✅ Response time test passed (avg: ${avgResponseTime.toFixed(2)}ms, max: ${maxResponseTime}ms)`);
      testResults.passed++;
      testResults.performance.avgResponseTime = avgResponseTime;
      testResults.performance.maxResponseTime = maxResponseTime;
    } else {
      throw new Error(`Response time too slow: avg=${avgResponseTime.toFixed(2)}ms, max=${maxResponseTime}ms`);
    }
    
    // Test concurrent requests
    console.log('  Testing concurrent requests...');
    const concurrentPromises = Array(3).fill().map(() => 
      axios.get(`${CONFIG.API_BASE_URL}/api/manufacturer/batch-details?batchId=${CONFIG.TEST_BATCH_ID}`, { headers })
    );
    
    const startTime = Date.now();
    await Promise.all(concurrentPromises);
    const concurrentTime = Date.now() - startTime;
    
    if (concurrentTime < 5000) {
      console.log(`    ✅ Concurrent requests test passed (${concurrentTime}ms)`);
      testResults.passed++;
      testResults.performance.concurrentTime = concurrentTime;
    } else {
      throw new Error(`Concurrent requests too slow: ${concurrentTime}ms`);
    }
    
  } catch (error) {
    console.error('    ❌ Performance test failed:', error.message);
    testResults.failed++;
    testResults.errors.push(`Performance Test: ${error.message}`);
  }
}

/**
 * Generate Test Report
 */
async function generateReport() {
  console.log('\n📊 Generating API test report...');
  
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
  
  console.log('\n📋 API Test Report Summary:');
  console.log(`Total Tests: ${report.summary.total}`);
  console.log(`Passed: ${report.summary.passed}`);
  console.log(`Failed: ${report.summary.failed}`);
  console.log(`Success Rate: ${report.summary.successRate}`);
  
  if (report.performance.batchDetailsResponseTime) {
    console.log(`Batch Details API Response Time: ${report.performance.batchDetailsResponseTime}ms`);
  }
  if (report.performance.qrCodesResponseTime) {
    console.log(`QR Codes API Response Time: ${report.performance.qrCodesResponseTime}ms`);
  }
  if (report.performance.avgResponseTime) {
    console.log(`Average Response Time: ${report.performance.avgResponseTime.toFixed(2)}ms`);
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
  
  return report.summary.failed === 0;
}

/**
 * Main test execution
 */
async function runAPITests() {
  console.log('🚀 Starting comprehensive API endpoint testing...\n');
  
  try {
    // Setup phase
    const setupSuccess = await setupEnvironment();
    if (!setupSuccess) {
      throw new Error('Environment setup failed');
    }
    
    // Test phases
    await testBatchDetailsAPI();
    await testQRCodesAPI();
    await testAuthenticationAndAuthorization();
    await testDatabaseIntegration();
    await testResponseFormatAndDataQuality();
    await testPerformanceAndLogging();
    
    // Generate report
    const allTestsPassed = await generateReport();
    
    console.log(`\n${allTestsPassed ? '✅' : '❌'} All API tests ${allTestsPassed ? 'passed' : 'completed with failures'}`);
    
    process.exit(allTestsPassed ? 0 : 1);
    
  } catch (error) {
    console.error('💥 API test execution failed:', error.message);
    process.exit(1);
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runAPITests();
}

module.exports = {
  setupEnvironment,
  testBatchDetailsAPI,
  testQRCodesAPI,
  testAuthenticationAndAuthorization,
  testDatabaseIntegration,
  testResponseFormatAndDataQuality,
  testPerformanceAndLogging,
  generateReport,
  runAPITests
};
