// Test script to test the verification page directly

const puppeteer = require('puppeteer');

async function testVerificationPage() {
  console.log('🧪 Testing Verification Page Directly...\n');

  let browser;
  try {
    // Launch browser
    browser = await puppeteer.launch({ 
      headless: false, // Set to true for headless mode
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Enable console logging
    page.on('console', msg => console.log('Browser Console:', msg.text()));
    page.on('pageerror', error => console.log('Browser Error:', error.message));
    
    console.log('1️⃣ Navigating to verification page...');
    await page.goto('http://localhost:3003/verify/759cf847498e', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    console.log('2️⃣ Waiting for page to load...');
    
    // Wait for either the loading state to disappear or an error to appear
    try {
      await page.waitForFunction(() => {
        const loadingElement = document.querySelector('.animate-spin');
        const errorElement = document.querySelector('.text-red-500');
        const successElement = document.querySelector('.text-success');
        
        return !loadingElement || errorElement || successElement;
      }, { timeout: 10000 });
      
      console.log('3️⃣ Page loaded, checking content...');
      
      // Check what's displayed
      const pageContent = await page.content();
      
      if (pageContent.includes('Verifying QR Code')) {
        console.log('❌ Page is still in loading state');
      } else if (pageContent.includes('Authentic Product')) {
        console.log('✅ Page shows successful verification');
      } else if (pageContent.includes('Verification Failed')) {
        console.log('❌ Page shows verification failed');
      } else if (pageContent.includes('QR Code Not Found')) {
        console.log('❌ Page shows QR code not found');
      } else {
        console.log('❓ Page shows unknown state');
      }
      
      // Get the actual text content
      const textContent = await page.evaluate(() => document.body.innerText);
      console.log('\n📄 Page Content:');
      console.log(textContent.substring(0, 500) + '...');
      
    } catch (timeoutError) {
      console.log('❌ Page did not load within timeout');
      console.log('Timeout error:', timeoutError.message);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
  
  console.log('\n🎉 Verification Page Test Complete!');
}

// Check if puppeteer is available
try {
  require('puppeteer');
  testVerificationPage();
} catch (error) {
  console.log('❌ Puppeteer not available, skipping browser test');
  console.log('💡 Install puppeteer with: npm install puppeteer');
}
