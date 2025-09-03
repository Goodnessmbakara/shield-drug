const fs = require('fs');
const path = require('path');

// Simple test to debug OCR issues
async function testOCR() {
  try {
    console.log('🔍 Testing OCR step by step...');
    
    // Test 1: Check if we can read a test image
    const testImagePath = path.join(__dirname, '..', 'public', 'sample-batch.csv');
    console.log('📁 Test image path:', testImagePath);
    console.log('📁 File exists:', fs.existsSync(testImagePath));
    
    // Test 2: Check if we can create a simple base64 image
    const simpleImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    console.log('🖼️ Simple test image created:', simpleImage.substring(0, 50) + '...');
    
    // Test 3: Check if we can import the OCR service directly
    try {
      require('ts-node/register/transpile-only');
      
      // Set up path mapping manually
      const Module = require('module');
      const originalRequire = Module.prototype.require;
      
      Module.prototype.require = function(id) {
        if (id.startsWith('@/lib/')) {
          const relativePath = id.replace('@/lib/', '../src/lib/');
          return originalRequire.call(this, relativePath);
        }
        return originalRequire.call(this, id);
      };
      
      const { recognizePharmaceuticalText } = require('../src/lib/ocr-service.ts');
      console.log('✅ OCR service imported successfully');
      
      // Test 4: Try OCR on simple image
      console.log('🔍 Attempting OCR on simple test image...');
      const result = await recognizePharmaceuticalText(simpleImage);
      console.log('📝 OCR result:', result);
      
    } catch (importError) {
      console.error('❌ Failed to import OCR service:', importError.message);
      console.error('❌ Full error:', importError);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testOCR();
