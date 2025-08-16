#!/usr/bin/env node

/**
 * Master Test Runner Script
 * Orchestrates all testing phases for batch details functionality
 */

const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');

// Import test modules
const { createTestBatch, verifyTestData, cleanupTestData, displayTestingUrls } = require('./seed-test-batch');
const { runAPITests } = require('./test-api-endpoints');
const { runFrontendTests } = require('./test-frontend-integration');

// Configuration
const CONFIG = {
  TEST_BATCH_ID: '689caef5c45c802ca13e1768',
  TEST_USER_EMAIL: 'test@manufacturer.com',
  TEST_USER_ROLE: 'manufacturer',
  REPORT_DIR: path.join(__dirname, 'reports'),
  SCREENSHOT_DIR: path.join(__dirname, 'screenshots'),
  LOG_DIR: path.join(__dirname, 'logs')
};

// Test results tracking
const testResults = {
  seed: { passed: false, error: null },
  api: { passed: false, error: null },
  frontend: { passed: false, error: null },
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    successRate: '0%'
  }
};

/**
 * Environment Validation
 */
async function validateEnvironment() {
  console.log('🔧 Validating testing environment...');
  
  try {
    // Check MongoDB connection
    console.log('  Checking MongoDB connection...');
    const { MongoClient } = require('mongodb');
    const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017/shield-drug');
    await client.connect();
    await client.db().admin().ping();
    await client.close();
    console.log('    ✅ MongoDB connection verified');
    
    // Check if Next.js server is running
    console.log('  Checking Next.js server...');
    const axios = require('axios');
    const baseUrl = process.env.API_BASE_URL || 'http://localhost:3000';
    
    try {
      // Try a resilient health check that accepts 200, 401, or 403 as proof of liveness
      const response = await axios.get(`${baseUrl}/api/manufacturer/qr-codes?limit=1`, { 
        timeout: 5000,
        validateStatus: (status) => status === 200 || status === 401 || status === 403
      });
      console.log('    ✅ Next.js server is running');
    } catch (error) {
      throw new Error(`Next.js server health check failed: ${error.message}`);
    }
    
    // Check required dependencies
    console.log('  Checking required dependencies...');
    const requiredDeps = ['mongodb', 'axios', 'puppeteer'];
    for (const dep of requiredDeps) {
      try {
        require(dep);
        console.log(`    ✅ ${dep} dependency available`);
      } catch (error) {
        throw new Error(`Missing dependency: ${dep}`);
      }
    }
    
    // Create directories
    console.log('  Creating report directories...');
    await fs.mkdir(CONFIG.REPORT_DIR, { recursive: true });
    await fs.mkdir(CONFIG.SCREENSHOT_DIR, { recursive: true });
    await fs.mkdir(CONFIG.LOG_DIR, { recursive: true });
    console.log('    ✅ Report directories created');
    
    console.log('✅ Environment validation completed');
    return true;
    
  } catch (error) {
    console.error('❌ Environment validation failed:', error.message);
    return false;
  }
}

/**
 * Test Data Management
 */
async function manageTestData() {
  console.log('\n🌱 Managing test data...');
  
  try {
    // Clean up any existing test data
    console.log('  Cleaning up existing test data...');
    await cleanupTestData();
    
    // Create fresh test data
    console.log('  Creating fresh test data...');
    const createResult = await createTestBatch();
    
    if (createResult.success) {
      console.log('    ✅ Test data creation successful');
      
      // Verify test data
      console.log('  Verifying test data...');
      const verifyResult = await verifyTestData();
      
      if (verifyResult.success) {
        console.log('    ✅ Test data verification successful');
        testResults.seed.passed = true;
        
        // Display testing URLs
        displayTestingUrls();
        
        return true;
      } else {
        throw new Error(`Test data verification failed: ${verifyResult.error}`);
      }
    } else {
      throw new Error(`Test data creation failed: ${createResult.error}`);
    }
    
  } catch (error) {
    console.error('❌ Test data management failed:', error.message);
    testResults.seed.error = error.message;
    return false;
  }
}

/**
 * Run API Tests
 */
async function runAPITestSuite() {
  console.log('\n🔍 Running API Test Suite...');
  
  try {
    // Run API tests
    await runAPITests();
    testResults.api.passed = true;
    console.log('✅ API test suite completed successfully');
    return true;
    
  } catch (error) {
    console.error('❌ API test suite failed:', error.message);
    testResults.api.error = error.message;
    return false;
  }
}

/**
 * Run Frontend Tests
 */
async function runFrontendTestSuite() {
  console.log('\n🌐 Running Frontend Test Suite...');
  
  try {
    // Run frontend tests
    await runFrontendTests();
    testResults.frontend.passed = true;
    console.log('✅ Frontend test suite completed successfully');
    return true;
    
  } catch (error) {
    console.error('❌ Frontend test suite failed:', error.message);
    testResults.frontend.error = error.message;
    return false;
  }
}

/**
 * Parallel Test Execution
 */
async function runParallelTests() {
  console.log('\n⚡ Running tests in parallel...');
  
  try {
    // Run API and frontend tests in parallel
    const [apiResult, frontendResult] = await Promise.allSettled([
      runAPITestSuite(),
      runFrontendTestSuite()
    ]);
    
    // Handle results
    if (apiResult.status === 'fulfilled' && apiResult.value) {
      testResults.api.passed = true;
    } else {
      testResults.api.error = apiResult.reason?.message || 'API tests failed';
    }
    
    if (frontendResult.status === 'fulfilled' && frontendResult.value) {
      testResults.frontend.passed = true;
    } else {
      testResults.frontend.error = frontendResult.reason?.message || 'Frontend tests failed';
    }
    
    console.log('✅ Parallel test execution completed');
    return true;
    
  } catch (error) {
    console.error('❌ Parallel test execution failed:', error.message);
    return false;
  }
}

/**
 * Generate Comprehensive Report
 */
async function generateComprehensiveReport() {
  console.log('\n📊 Generating comprehensive test report...');
  
  try {
    // Calculate summary statistics
    const totalTests = 3; // seed, api, frontend
    const passedTests = [testResults.seed.passed, testResults.api.passed, testResults.frontend.passed].filter(Boolean).length;
    const failedTests = totalTests - passedTests;
    const successRate = ((passedTests / totalTests) * 100).toFixed(2) + '%';
    
    testResults.summary = {
      total: totalTests,
      passed: passedTests,
      failed: failedTests,
      successRate
    };
    
    // Generate HTML report
    const htmlReport = generateHTMLReport();
    const htmlPath = path.join(CONFIG.REPORT_DIR, 'comprehensive-test-report.html');
    await fs.writeFile(htmlPath, htmlReport);
    
    // Generate JSON report
    const jsonReport = {
      timestamp: new Date().toISOString(),
      testBatchId: CONFIG.TEST_BATCH_ID,
      summary: testResults.summary,
      details: testResults,
      configuration: {
        testUserEmail: CONFIG.TEST_USER_EMAIL,
        testUserRole: CONFIG.TEST_USER_ROLE,
        reportDir: CONFIG.REPORT_DIR,
        screenshotDir: CONFIG.SCREENSHOT_DIR
      }
    };
    
    const jsonPath = path.join(CONFIG.REPORT_DIR, 'comprehensive-test-report.json');
    await fs.writeFile(jsonPath, JSON.stringify(jsonReport, null, 2));
    
    // Display summary
    console.log('\n📋 Comprehensive Test Report Summary:');
    console.log(`Total Test Suites: ${testResults.summary.total}`);
    console.log(`Passed: ${testResults.summary.passed}`);
    console.log(`Failed: ${testResults.summary.failed}`);
    console.log(`Success Rate: ${testResults.summary.successRate}`);
    
    console.log('\n📄 Detailed Reports:');
    console.log(`  HTML Report: ${htmlPath}`);
    console.log(`  JSON Report: ${jsonPath}`);
    console.log(`  Screenshots: ${CONFIG.SCREENSHOT_DIR}`);
    
    // Display individual test results
    console.log('\n🔍 Individual Test Results:');
    console.log(`  Seed Data: ${testResults.seed.passed ? '✅ PASSED' : '❌ FAILED'}`);
    if (testResults.seed.error) console.log(`    Error: ${testResults.seed.error}`);
    
    console.log(`  API Tests: ${testResults.api.passed ? '✅ PASSED' : '❌ FAILED'}`);
    if (testResults.api.error) console.log(`    Error: ${testResults.api.error}`);
    
    console.log(`  Frontend Tests: ${testResults.frontend.passed ? '✅ PASSED' : '❌ FAILED'}`);
    if (testResults.frontend.error) console.log(`    Error: ${testResults.frontend.error}`);
    
    return testResults.summary.failed === 0;
    
  } catch (error) {
    console.error('❌ Report generation failed:', error.message);
    return false;
  }
}

/**
 * Generate HTML Report
 */
function generateHTMLReport() {
  const timestamp = new Date().toISOString();
  const successRate = testResults.summary.successRate;
  const totalTests = testResults.summary.total;
  const passedTests = testResults.summary.passed;
  const failedTests = testResults.summary.failed;
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Comprehensive Test Report - Batch Details</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 2.5em;
            font-weight: 300;
        }
        .header .subtitle {
            margin-top: 10px;
            opacity: 0.9;
        }
        .summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            padding: 30px;
            background: #f8f9fa;
        }
        .summary-card {
            background: white;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        .summary-card h3 {
            margin: 0 0 10px 0;
            color: #333;
        }
        .summary-card .value {
            font-size: 2em;
            font-weight: bold;
        }
        .summary-card.passed .value { color: #28a745; }
        .summary-card.failed .value { color: #dc3545; }
        .summary-card.total .value { color: #007bff; }
        .content {
            padding: 30px;
        }
        .test-section {
            margin-bottom: 30px;
            border: 1px solid #e9ecef;
            border-radius: 8px;
            overflow: hidden;
        }
        .test-section h3 {
            margin: 0;
            padding: 15px 20px;
            background: #f8f9fa;
            border-bottom: 1px solid #e9ecef;
            color: #333;
        }
        .test-section .status {
            padding: 15px 20px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .test-section .status.passed {
            background: #d4edda;
            color: #155724;
        }
        .test-section .status.failed {
            background: #f8d7da;
            color: #721c24;
        }
        .test-section .error {
            padding: 15px 20px;
            background: #f8d7da;
            color: #721c24;
            border-top: 1px solid #f5c6cb;
            font-family: monospace;
            white-space: pre-wrap;
        }
        .configuration {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin-top: 30px;
        }
        .configuration h4 {
            margin: 0 0 15px 0;
            color: #333;
        }
        .configuration table {
            width: 100%;
            border-collapse: collapse;
        }
        .configuration td {
            padding: 8px 0;
            border-bottom: 1px solid #e9ecef;
        }
        .configuration td:first-child {
            font-weight: bold;
            width: 200px;
        }
        .footer {
            text-align: center;
            padding: 20px;
            color: #6c757d;
            border-top: 1px solid #e9ecef;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Comprehensive Test Report</h1>
            <div class="subtitle">Batch Details Functionality Testing</div>
        </div>
        
        <div class="summary">
            <div class="summary-card total">
                <h3>Total Tests</h3>
                <div class="value">${totalTests}</div>
            </div>
            <div class="summary-card passed">
                <h3>Passed</h3>
                <div class="value">${passedTests}</div>
            </div>
            <div class="summary-card failed">
                <h3>Failed</h3>
                <div class="value">${failedTests}</div>
            </div>
            <div class="summary-card ${failedTests === 0 ? 'passed' : 'failed'}">
                <h3>Success Rate</h3>
                <div class="value">${successRate}</div>
            </div>
        </div>
        
        <div class="content">
            <div class="test-section">
                <h3>Seed Data Creation</h3>
                <div class="status ${testResults.seed.passed ? 'passed' : 'failed'}">
                    <span>${testResults.seed.passed ? '✅' : '❌'}</span>
                    <span>${testResults.seed.passed ? 'PASSED' : 'FAILED'}</span>
                </div>
                ${testResults.seed.error ? `<div class="error">${testResults.seed.error}</div>` : ''}
            </div>
            
            <div class="test-section">
                <h3>API Endpoint Testing</h3>
                <div class="status ${testResults.api.passed ? 'passed' : 'failed'}">
                    <span>${testResults.api.passed ? '✅' : '❌'}</span>
                    <span>${testResults.api.passed ? 'PASSED' : 'FAILED'}</span>
                </div>
                ${testResults.api.error ? `<div class="error">${testResults.api.error}</div>` : ''}
            </div>
            
            <div class="test-section">
                <h3>Frontend Integration Testing</h3>
                <div class="status ${testResults.frontend.passed ? 'passed' : 'failed'}">
                    <span>${testResults.frontend.passed ? '✅' : '❌'}</span>
                    <span>${testResults.frontend.passed ? 'PASSED' : 'FAILED'}</span>
                </div>
                ${testResults.frontend.error ? `<div class="error">${testResults.frontend.error}</div>` : ''}
            </div>
            
            <div class="configuration">
                <h4>Test Configuration</h4>
                <table>
                    <tr>
                        <td>Test Batch ID:</td>
                        <td>${CONFIG.TEST_BATCH_ID}</td>
                    </tr>
                    <tr>
                        <td>Test User Email:</td>
                        <td>${CONFIG.TEST_USER_EMAIL}</td>
                    </tr>
                    <tr>
                        <td>Test User Role:</td>
                        <td>${CONFIG.TEST_USER_ROLE}</td>
                    </tr>
                    <tr>
                        <td>Report Directory:</td>
                        <td>${CONFIG.REPORT_DIR}</td>
                    </tr>
                    <tr>
                        <td>Screenshot Directory:</td>
                        <td>${CONFIG.SCREENSHOT_DIR}</td>
                    </tr>
                    <tr>
                        <td>Generated At:</td>
                        <td>${timestamp}</td>
                    </tr>
                </table>
            </div>
        </div>
        
        <div class="footer">
            <p>Generated by Shield Drug Comprehensive Test Suite</p>
        </div>
    </div>
</body>
</html>
  `;
}

/**
 * Error Handling and Recovery
 */
async function handleTestFailures() {
  console.log('\n🛠️  Handling test failures...');
  
  try {
    // Continue testing even if individual tests fail
    console.log('  Continuing with remaining tests...');
    
    // Clean up test data if seed failed
    if (!testResults.seed.passed) {
      console.log('  Cleaning up test data due to seed failure...');
      await cleanupTestData();
    }
    
    // Provide suggestions for fixing common failures
    console.log('  Common failure suggestions:');
    if (!testResults.seed.passed) {
      console.log('    - Check MongoDB connection and database permissions');
      console.log('    - Verify test batch ID is not already in use');
    }
    if (!testResults.api.passed) {
      console.log('    - Ensure Next.js development server is running');
      console.log('    - Check API endpoint implementations');
      console.log('    - Verify authentication headers are properly set');
    }
    if (!testResults.frontend.passed) {
      console.log('    - Check if Puppeteer is properly installed');
      console.log('    - Verify frontend page components are rendered');
      console.log('    - Check for JavaScript errors in browser console');
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Error handling failed:', error.message);
    return false;
  }
}

/**
 * Configuration Management
 */
function loadConfiguration() {
  console.log('⚙️  Loading test configuration...');
  
  // Support different environments
  const environment = process.env.NODE_ENV || 'development';
  console.log(`  Environment: ${environment}`);
  
  // Allow configuration of test parameters
  const config = {
    timeout: process.env.TEST_TIMEOUT || 30000,
    retries: process.env.TEST_RETRIES || 1,
    headless: process.env.TEST_HEADLESS !== 'false',
    parallel: process.env.TEST_PARALLEL !== 'false'
  };
  
  console.log(`  Timeout: ${config.timeout}ms`);
  console.log(`  Retries: ${config.retries}`);
  console.log(`  Headless: ${config.headless}`);
  console.log(`  Parallel: ${config.parallel}`);
  
  return config;
}

/**
 * Main test orchestration
 */
async function runComprehensiveTests() {
  console.log('🚀 Starting comprehensive batch details testing...\n');
  
  const startTime = Date.now();
  
  try {
    // Load configuration
    const config = loadConfiguration();
    
    // Validate environment
    const envValid = await validateEnvironment();
    if (!envValid) {
      throw new Error('Environment validation failed');
    }
    
    // Manage test data
    const dataReady = await manageTestData();
    if (!dataReady) {
      throw new Error('Test data management failed');
    }
    
    // Run tests (parallel or sequential based on config)
    let testsCompleted = false;
    if (config.parallel) {
      testsCompleted = await runParallelTests();
    } else {
      // Sequential execution
      const apiResult = await runAPITestSuite();
      const frontendResult = await runFrontendTestSuite();
      testsCompleted = apiResult || frontendResult;
    }
    
    // Handle failures
    await handleTestFailures();
    
    // Generate comprehensive report
    const reportGenerated = await generateComprehensiveReport();
    
    // Cleanup test data (optional)
    if (process.env.KEEP_TEST_DATA !== 'true') {
      console.log('\n🧹 Cleaning up test data...');
      try {
        const cleanupResult = await cleanupTestData();
        if (cleanupResult.success) {
          console.log(`✅ Cleanup completed: ${cleanupResult.deletedBatches} batches, ${cleanupResult.deletedQRCodes} QR codes removed`);
        } else {
          console.log('⚠️  Cleanup failed but continuing');
        }
      } catch (error) {
        console.log('⚠️  Cleanup error but continuing:', error.message);
      }
    } else {
      console.log('\n💾 Keeping test data (KEEP_TEST_DATA=true)');
    }
    
    const totalTime = Date.now() - startTime;
    console.log(`\n⏱️  Total test execution time: ${totalTime}ms`);
    
    // Determine overall success
    const overallSuccess = testResults.summary.failed === 0;
    
    console.log(`\n${overallSuccess ? '✅' : '❌'} Comprehensive testing ${overallSuccess ? 'completed successfully' : 'completed with failures'}`);
    
    process.exit(overallSuccess ? 0 : 1);
    
  } catch (error) {
    console.error('💥 Comprehensive test execution failed:', error.message);
    
    // Generate error report
    testResults.summary = {
      total: 3,
      passed: 0,
      failed: 3,
      successRate: '0%'
    };
    
    await generateComprehensiveReport();
    process.exit(1);
  }
}

/**
 * CLI Interface
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  switch (command) {
    case 'run':
      await runComprehensiveTests();
      break;
      
    case 'seed':
      console.log('🌱 Running seed data creation only...');
      await manageTestData();
      break;
      
    case 'api':
      console.log('🔍 Running API tests only...');
      await runAPITestSuite();
      break;
      
    case 'frontend':
      console.log('🌐 Running frontend tests only...');
      await runFrontendTestSuite();
      break;
      
    case 'cleanup':
      console.log('🧹 Cleaning up test data...');
      await cleanupTestData();
      break;
      
    default:
      console.log('Usage: node run-comprehensive-tests.js <command>');
      console.log('');
      console.log('Commands:');
      console.log('  run       - Run all comprehensive tests');
      console.log('  seed      - Run seed data creation only');
      console.log('  api       - Run API tests only');
      console.log('  frontend  - Run frontend tests only');
      console.log('  cleanup   - Clean up test data');
      console.log('');
      console.log('Examples:');
      console.log('  node run-comprehensive-tests.js run');
      console.log('  node run-comprehensive-tests.js api');
      console.log('  node run-comprehensive-tests.js frontend');
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
  validateEnvironment,
  manageTestData,
  runAPITestSuite,
  runFrontendTestSuite,
  runParallelTests,
  generateComprehensiveReport,
  runComprehensiveTests
};
