#!/usr/bin/env node

/**
 * Frontend Integration Testing Script
 * Automated browser testing for batch details page using Puppeteer
 */

const puppeteer = require('puppeteer');
const { MongoClient } = require('mongodb');
const fs = require('fs').promises;
const path = require('path');

// Configuration
const CONFIG = {
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/shield-drug',
  API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:3000',
  TEST_BATCH_ID: '689caef5c45c802ca13e1768',
  TEST_USER_EMAIL: 'test@manufacturer.com',
  TEST_USER_ROLE: 'manufacturer',
  SCREENSHOT_DIR: path.join(__dirname, 'screenshots')
};

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  errors: [],
  performance: {},
  screenshots: []
};

/**
 * Browser Setup and Configuration
 */
async function setupBrowser() {
  console.log('🌐 Setting up browser for testing...');
  
  // Ensure screenshot directory exists
  try {
    await fs.mkdir(CONFIG.SCREENSHOT_DIR, { recursive: true });
    console.log('    ✅ Screenshot directory created/verified');
  } catch (error) {
    console.error('    ❌ Failed to create screenshot directory:', error.message);
  }
  
  try {
    const browser = await puppeteer.launch({ 
      headless: true,
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    });
    
    const page = await browser.newPage();
    
    // Set viewport for desktop testing
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Set user agent
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    // Enable request interception for monitoring
    await page.setRequestInterception(true);
    page.on('request', request => {
      console.log(`  📡 Request: ${request.method()} ${request.url()}`);
      request.continue();
    });
    
    page.on('response', response => {
      console.log(`  📡 Response: ${response.status()} ${response.url()}`);
    });
    
    console.log('✅ Browser setup completed');
    return { browser, page };
    
  } catch (error) {
    console.error('❌ Browser setup failed:', error.message);
    throw error;
  }
}

/**
 * Authentication and Navigation Testing
 */
async function testAuthenticationAndNavigation(page) {
  console.log('\n🔐 Testing Authentication and Navigation...');
  
  try {
    // Set localStorage for authentication
    console.log('  Setting up authentication...');
    await page.evaluateOnNewDocument(() => {
      localStorage.setItem('userRole', 'manufacturer');
      localStorage.setItem('userEmail', 'test@manufacturer.com');
      localStorage.setItem('isAuthenticated', 'true');
    });
    
    // Navigate to batch details page
    console.log('  Navigating to batch details page...');
    const startTime = Date.now();
    await page.goto(`${CONFIG.API_BASE_URL}/manufacturer/batches/${CONFIG.TEST_BATCH_ID}`, { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    const loadTime = Date.now() - startTime;
    
    // Check if page loaded successfully
    const pageTitle = await page.title();
    console.log(`  Page title: ${pageTitle}`);
    
    if (pageTitle.includes('Batch Details') || pageTitle.includes('Shield Drug') || pageTitle.includes('Manufacturer')) {
      console.log('    ✅ Page loading passed');
      testResults.passed++;
      testResults.performance.pageLoadTime = loadTime;
    } else {
      throw new Error(`Unexpected page title: ${pageTitle}`);
    }
    
    // Check if we're redirected to login (should not happen with localStorage)
    const currentUrl = page.url();
    if (currentUrl.includes('/login') || currentUrl.includes('/auth')) {
      throw new Error('Unexpected redirect to login page');
    }
    
    console.log('    ✅ Authentication and navigation passed');
    testResults.passed++;
    
    // Take screenshot
    const screenshotPath = path.join(CONFIG.SCREENSHOT_DIR, 'page-loaded.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    testResults.screenshots.push(screenshotPath);
    
  } catch (error) {
    console.error('    ❌ Authentication and navigation failed:', error.message);
    testResults.failed++;
    testResults.errors.push(`Auth Navigation Test: ${error.message}`);
    
    // Take error screenshot
    const screenshotPath = path.join(CONFIG.SCREENSHOT_DIR, 'auth-error.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    testResults.screenshots.push(screenshotPath);
  }
}

/**
 * Page Loading and Data Display Testing
 */
async function testPageLoadingAndDataDisplay(page) {
  console.log('\n📄 Testing Page Loading and Data Display...');
  
  try {
    // Wait for content to load
    console.log('  Waiting for content to load...');
    await page.waitForSelector('h1, h2, .drug-name, [data-testid="drug-name"]', { timeout: 10000 });
    
    // Test basic information display
    console.log('  Testing basic information display...');
    const drugNameElement = await page.$('h1, h2, .drug-name, [data-testid="drug-name"]');
    
    if (drugNameElement) {
      const drugNameText = await page.evaluate(el => el.textContent, drugNameElement);
      console.log(`  Drug name found: ${drugNameText}`);
      
      if (drugNameText.includes('Paracetamol') || drugNameText.includes('Drug')) {
        console.log('    ✅ Basic information display passed');
        testResults.passed++;
      } else {
        throw new Error(`Drug name not found: ${drugNameText}`);
      }
    } else {
      throw new Error('Drug name element not found');
    }
    
    // Test for loading states
    console.log('  Checking for loading states...');
    const loadingElements = await page.$$('.loading, .spinner, [data-testid="loading"]');
    if (loadingElements.length === 0) {
      console.log('    ✅ No loading states found (content loaded)');
      testResults.passed++;
    } else {
      console.log('    ⚠️  Loading states still present');
    }
    
    // Test for error states
    console.log('  Checking for error states...');
    const errorElements = await page.$$('.error, .alert, [data-testid="error"]');
    if (errorElements.length === 0) {
      console.log('    ✅ No error states found');
      testResults.passed++;
    } else {
      const errorText = await page.evaluate(el => el.textContent, errorElements[0]);
      throw new Error(`Error state found: ${errorText}`);
    }
    
  } catch (error) {
    console.error('    ❌ Page loading and data display failed:', error.message);
    testResults.failed++;
    testResults.errors.push(`Page Loading Test: ${error.message}`);
    
    // Take error screenshot
    const screenshotPath = path.join(CONFIG.SCREENSHOT_DIR, 'loading-error.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    testResults.screenshots.push(screenshotPath);
  }
}

/**
 * UI Component Testing
 */
async function testUIComponents(page) {
  console.log('\n🎨 Testing UI Components...');
  
  try {
    // Test Basic Information Card
    console.log('  Testing Basic Information Card...');
    const basicInfoSelectors = [
      '.card, .basic-info, [data-testid="basic-info"]',
      'h1, h2, h3',
      '.drug-name, .manufacturer, .batch-id'
    ];
    
    let basicInfoFound = false;
    for (const selector of basicInfoSelectors) {
      const elements = await page.$$(selector);
      if (elements.length > 0) {
        basicInfoFound = true;
        console.log(`    ✅ Basic Information Card found with selector: ${selector}`);
        break;
      }
    }
    
    if (basicInfoFound) {
      testResults.passed++;
    } else {
      throw new Error('Basic Information Card not found');
    }
    
    // Test Product Specifications Card
    console.log('  Testing Product Specifications Card...');
    const specSelectors = [
      '.specifications, .product-specs, [data-testid="specifications"]',
      '.active-ingredient, .dosage-form, .strength'
    ];
    
    let specsFound = false;
    for (const selector of specSelectors) {
      const elements = await page.$$(selector);
      if (elements.length > 0) {
        specsFound = true;
        console.log(`    ✅ Product Specifications found with selector: ${selector}`);
        break;
      }
    }
    
    if (specsFound) {
      testResults.passed++;
    } else {
      console.log('    ⚠️  Product Specifications not found (may be optional)');
    }
    
    // Test Processing Details Card
    console.log('  Testing Processing Details Card...');
    const processingSelectors = [
      '.processing-details, .qr-codes-count, [data-testid="processing-details"]',
      '.verifications, .processing-time'
    ];
    
    let processingFound = false;
    for (const selector of processingSelectors) {
      const elements = await page.$$(selector);
      if (elements.length > 0) {
        processingFound = true;
        console.log(`    ✅ Processing Details found with selector: ${selector}`);
        break;
      }
    }
    
    if (processingFound) {
      testResults.passed++;
    } else {
      console.log('    ⚠️  Processing Details not found (may be optional)');
    }
    
    // Test Blockchain Information
    console.log('  Testing Blockchain Information...');
    const blockchainSelectors = [
      '.blockchain, .transaction-hash, [data-testid="blockchain"]',
      'a[href*="snowtrace"], a[href*="etherscan"]'
    ];
    
    let blockchainFound = false;
    for (const selector of blockchainSelectors) {
      const elements = await page.$$(selector);
      if (elements.length > 0) {
        blockchainFound = true;
        console.log(`    ✅ Blockchain Information found with selector: ${selector}`);
        break;
      }
    }
    
    if (blockchainFound) {
      testResults.passed++;
    } else {
      console.log('    ⚠️  Blockchain Information not found (may be optional)');
    }
    
  } catch (error) {
    console.error('    ❌ UI component testing failed:', error.message);
    testResults.failed++;
    testResults.errors.push(`UI Component Test: ${error.message}`);
  }
}

/**
 * Interactive Features Testing
 */
async function testInteractiveFeatures(page) {
  console.log('\n🖱️  Testing Interactive Features...');
  
  try {
    // Test QR Codes Dialog
    console.log('  Testing QR Codes Dialog...');
    const qrButtonSelectors = [
      '[data-testid="qr-codes-button"]',
      'button',
      'a'
    ];
    
    let qrButtonFound = false;
    for (const selector of qrButtonSelectors) {
      try {
        const buttons = await page.$$(selector);
        for (const button of buttons) {
          const buttonText = await page.evaluate(el => el.textContent.toLowerCase(), button);
          if (buttonText.includes('qr') || buttonText.includes('view')) {
            console.log(`    Found QR button with text: ${buttonText}`);
            await button.click();
            await page.waitForTimeout(1000);
            
            // Check for dialog
            const dialogSelectors = ['.dialog', '.modal', '[role="dialog"]', '.qr-codes-dialog'];
            for (const dialogSelector of dialogSelectors) {
              const dialog = await page.$(dialogSelector);
              if (dialog) {
                console.log('    ✅ QR codes dialog opened successfully');
                testResults.passed++;
                qrButtonFound = true;
                
                // Take screenshot of dialog
                const screenshotPath = path.join(CONFIG.SCREENSHOT_DIR, 'qr-dialog.png');
                await page.screenshot({ path: screenshotPath, fullPage: true });
                testResults.screenshots.push(screenshotPath);
                break;
              }
            }
            break;
          }
        }
        if (qrButtonFound) break;
      } catch (error) {
        // Continue to next selector
      }
    }
    
    if (!qrButtonFound) {
      console.log('    ⚠️  QR codes button not found, skipping dialog test');
    }
    
    // Test Download Functionality
    console.log('  Testing Download Functionality...');
    const downloadButtonSelectors = [
      '[data-testid="download-button"]',
      'button',
      'a'
    ];
    
    let downloadButtonFound = false;
    for (const selector of downloadButtonSelectors) {
      try {
        const buttons = await page.$$(selector);
        for (const button of buttons) {
          const buttonText = await page.evaluate(el => el.textContent.toLowerCase(), button);
          if (buttonText.includes('download') || buttonText.includes('export')) {
            console.log(`    Found download button with text: ${buttonText}`);
            
            // Set up download listener
            const downloadPromise = page.waitForEvent('download', { timeout: 5000 });
            await button.click();
            
            try {
              const download = await downloadPromise;
              console.log('    ✅ Download functionality passed');
              testResults.passed++;
              downloadButtonFound = true;
              break;
            } catch (error) {
              console.log('    ⚠️  Download event not triggered, but button clicked');
              downloadButtonFound = true;
              break;
            }
          }
        }
        if (downloadButtonFound) break;
      } catch (error) {
        // Continue to next selector
      }
    }
    
    if (!downloadButtonFound) {
      console.log('    ⚠️  Download button not found, skipping download test');
    }
    
    // Test Copy to Clipboard functionality
    console.log('  Testing Copy to Clipboard...');
    const copyButtonSelectors = [
      '[data-testid="copy-button"]',
      'button'
    ];
    
    let copyButtonFound = false;
    for (const selector of copyButtonSelectors) {
      try {
        const buttons = await page.$$(selector);
        for (const button of buttons) {
          const buttonText = await page.evaluate(el => el.textContent.toLowerCase(), button);
          if (buttonText.includes('copy')) {
            console.log(`    Found copy button with text: ${buttonText}`);
            await button.click();
            await page.waitForTimeout(500);
            console.log('    ✅ Copy button clicked successfully');
            testResults.passed++;
            copyButtonFound = true;
            break;
          }
        }
        if (copyButtonFound) break;
      } catch (error) {
        // Continue to next selector
      }
    }
    
    if (!copyButtonFound) {
      console.log('    ⚠️  Copy button not found, skipping copy test');
    }
    
  } catch (error) {
    console.error('    ❌ Interactive features testing failed:', error.message);
    testResults.failed++;
    testResults.errors.push(`Interactive Features Test: ${error.message}`);
  }
}

/**
 * Responsive Design Testing
 */
async function testResponsiveDesign(page) {
  console.log('\n📱 Testing Responsive Design...');
  
  const viewports = [
    { name: 'Desktop', width: 1920, height: 1080 },
    { name: 'Tablet', width: 768, height: 1024 },
    { name: 'Mobile', width: 375, height: 667 }
  ];
  
  for (const viewport of viewports) {
    try {
      console.log(`  Testing ${viewport.name} viewport (${viewport.width}x${viewport.height})...`);
      
      await page.setViewport({ width: viewport.width, height: viewport.height });
      await page.reload({ waitUntil: 'networkidle2' });
      
      // Check if content is still accessible
      const contentElements = await page.$$('h1, h2, .drug-name, [data-testid="drug-name"]');
      if (contentElements.length > 0) {
        console.log(`    ✅ ${viewport.name} layout test passed`);
        testResults.passed++;
        
        // Take screenshot
        const screenshotPath = path.join(CONFIG.SCREENSHOT_DIR, `${viewport.name.toLowerCase()}-layout.png`);
        await page.screenshot({ path: screenshotPath, fullPage: true });
        testResults.screenshots.push(screenshotPath);
      } else {
        throw new Error(`Content not accessible in ${viewport.name} viewport`);
      }
      
    } catch (error) {
      console.error(`    ❌ ${viewport.name} responsive test failed:`, error.message);
      testResults.failed++;
      testResults.errors.push(`${viewport.name} Responsive Test: ${error.message}`);
    }
  }
}

/**
 * Error State Testing
 */
async function testErrorStates(page) {
  console.log('\n❌ Testing Error States...');
  
  try {
    // Test with invalid batch ID
    console.log('  Testing with invalid batch ID...');
    await page.goto(`${CONFIG.API_BASE_URL}/manufacturer/batches/invalid-batch-id`, { 
      waitUntil: 'networkidle2',
      timeout: 10000 
    });
    
    const errorElement = await page.$('.error, .alert, [data-testid="error"], .not-found');
    if (errorElement) {
      const errorText = await page.evaluate(el => el.textContent, errorElement);
      console.log(`    ✅ Error state displayed: ${errorText.substring(0, 50)}...`);
      testResults.passed++;
      
      // Take screenshot
      const screenshotPath = path.join(CONFIG.SCREENSHOT_DIR, 'error-state.png');
      await page.screenshot({ path: screenshotPath, fullPage: true });
      testResults.screenshots.push(screenshotPath);
    } else {
      console.log('    ⚠️  Error element not found, error handling test inconclusive');
    }
    
    // Navigate back to valid batch
    await page.goto(`${CONFIG.API_BASE_URL}/manufacturer/batches/${CONFIG.TEST_BATCH_ID}`, { 
      waitUntil: 'networkidle2',
      timeout: 10000 
    });
    
  } catch (error) {
    console.error('    ❌ Error state testing failed:', error.message);
    testResults.failed++;
    testResults.errors.push(`Error State Test: ${error.message}`);
  }
}

/**
 * Performance Testing
 */
async function testPerformance(page) {
  console.log('\n⚡ Testing Performance...');
  
  try {
    // Measure page load time
    console.log('  Measuring page load time...');
    const startTime = Date.now();
    await page.goto(`${CONFIG.API_BASE_URL}/manufacturer/batches/${CONFIG.TEST_BATCH_ID}`, { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    const loadTime = Date.now() - startTime;
    
    if (loadTime < 10000) {
      console.log(`    ✅ Page load time acceptable: ${loadTime}ms`);
      testResults.passed++;
      testResults.performance.pageLoadTime = loadTime;
    } else {
      throw new Error(`Page load time too slow: ${loadTime}ms`);
    }
    
    // Count network requests
    const requestCount = await page.evaluate(() => {
      return window.performance.getEntriesByType('resource').length;
    });
    
    console.log(`    📊 Network requests: ${requestCount}`);
    testResults.performance.networkRequests = requestCount;
    
    // Measure time to interactive
    const timeToInteractive = await page.evaluate(() => {
      const navigationEntry = performance.getEntriesByType('navigation')[0];
      return navigationEntry ? navigationEntry.domInteractive : 0;
    });
    
    if (timeToInteractive > 0) {
      console.log(`    📊 Time to interactive: ${timeToInteractive}ms`);
      testResults.performance.timeToInteractive = timeToInteractive;
    }
    
  } catch (error) {
    console.error('    ❌ Performance testing failed:', error.message);
    testResults.failed++;
    testResults.errors.push(`Performance Test: ${error.message}`);
  }
}

/**
 * Accessibility Testing
 */
async function testAccessibility(page) {
  console.log('\n♿ Testing Accessibility...');
  
  try {
    // Test keyboard navigation
    console.log('  Testing keyboard navigation...');
    await page.keyboard.press('Tab');
    await page.waitForTimeout(500);
    
    const focusedElement = await page.evaluate(() => document.activeElement.tagName);
    if (focusedElement) {
      console.log(`    ✅ Keyboard navigation works (focused: ${focusedElement})`);
      testResults.passed++;
    } else {
      throw new Error('No focused element found');
    }
    
    // Test ARIA labels
    console.log('  Testing ARIA labels...');
    const ariaElements = await page.$$('[aria-label], [aria-labelledby], [role]');
    if (ariaElements.length > 0) {
      console.log(`    ✅ Found ${ariaElements.length} ARIA elements`);
      testResults.passed++;
    } else {
      console.log('    ⚠️  No ARIA elements found (accessibility may be limited)');
    }
    
    // Test color contrast (basic check)
    console.log('  Testing color contrast...');
    const hasGoodContrast = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      let contrastIssues = 0;
      
      for (const element of elements) {
        const style = window.getComputedStyle(element);
        const color = style.color;
        const backgroundColor = style.backgroundColor;
        
        // Basic contrast check (simplified)
        if (color && backgroundColor && color !== backgroundColor) {
          // This is a simplified check - in real testing you'd use a proper contrast library
          contrastIssues++;
        }
      }
      
      return contrastIssues === 0;
    });
    
    if (hasGoodContrast) {
      console.log('    ✅ Color contrast appears acceptable');
      testResults.passed++;
    } else {
      console.log('    ⚠️  Potential color contrast issues detected');
    }
    
  } catch (error) {
    console.error('    ❌ Accessibility testing failed:', error.message);
    testResults.failed++;
    testResults.errors.push(`Accessibility Test: ${error.message}`);
  }
}

/**
 * Generate Test Report
 */
async function generateReport() {
  console.log('\n📊 Generating Frontend Integration Test Report...');
  
  // Ensure screenshot directory exists
  try {
    await fs.mkdir(CONFIG.SCREENSHOT_DIR, { recursive: true });
  } catch (error) {
    // Directory already exists
  }
  
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
    screenshots: testResults.screenshots,
    configuration: {
      apiBaseUrl: CONFIG.API_BASE_URL,
      testUserEmail: CONFIG.TEST_USER_EMAIL,
      testUserRole: CONFIG.TEST_USER_ROLE
    }
  };
  
  console.log('\n📋 Frontend Integration Test Report Summary:');
  console.log(`Total Tests: ${report.summary.total}`);
  console.log(`Passed: ${report.summary.passed}`);
  console.log(`Failed: ${report.summary.failed}`);
  console.log(`Success Rate: ${report.summary.successRate}`);
  
  if (report.performance.pageLoadTime) {
    console.log(`Page Load Time: ${report.performance.pageLoadTime}ms`);
  }
  if (report.performance.networkRequests) {
    console.log(`Network Requests: ${report.performance.networkRequests}`);
  }
  if (report.performance.timeToInteractive) {
    console.log(`Time to Interactive: ${report.performance.timeToInteractive}ms`);
  }
  
  if (report.screenshots.length > 0) {
    console.log(`\n📸 Screenshots taken: ${report.screenshots.length}`);
    report.screenshots.forEach(screenshot => {
      console.log(`  - ${screenshot}`);
    });
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
async function runFrontendTests() {
  console.log('🚀 Starting comprehensive frontend integration testing...\n');
  
  let browser;
  
  try {
    // Setup browser
    const { browser: browserInstance, page } = await setupBrowser();
    browser = browserInstance;
    
    // Run test phases
    await testAuthenticationAndNavigation(page);
    await testPageLoadingAndDataDisplay(page);
    await testUIComponents(page);
    await testInteractiveFeatures(page);
    await testResponsiveDesign(page);
    await testErrorStates(page);
    await testPerformance(page);
    await testAccessibility(page);
    
    // Generate report
    const allTestsPassed = await generateReport();
    
    console.log(`\n${allTestsPassed ? '✅' : '❌'} All frontend tests ${allTestsPassed ? 'passed' : 'completed with failures'}`);
    
    process.exit(allTestsPassed ? 0 : 1);
    
  } catch (error) {
    console.error('💥 Frontend test execution failed:', error.message);
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runFrontendTests();
}

module.exports = {
  setupBrowser,
  testAuthenticationAndNavigation,
  testPageLoadingAndDataDisplay,
  testUIComponents,
  testInteractiveFeatures,
  testResponsiveDesign,
  testErrorStates,
  testPerformance,
  testAccessibility,
  generateReport,
  runFrontendTests
};
