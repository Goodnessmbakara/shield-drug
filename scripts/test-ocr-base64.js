const fs = require('fs');
const path = require('path');

// Test OCR with a simple base64 image
async function testOCRBase64() {
  try {
    console.log('🔍 Testing OCR with base64 image...');
    
    // Test 1: Check if Tesseract.js is available
    try {
      const Tesseract = require('tesseract.js');
      console.log('✅ Tesseract.js is available');
      
      // Test 2: Create a simple base64 image with text
      // This is a simple 1x1 white pixel PNG
      const simpleImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
      console.log('✅ Base64 test image created');
      
      // Test 3: Try OCR with Tesseract directly
      console.log('🔍 Attempting OCR with Tesseract...');
      
      const worker = await Tesseract.createWorker();
      await worker.loadLanguage('eng');
      await worker.initialize('eng');
      
      const result = await worker.recognize(simpleImage);
      console.log('📝 OCR result:', result.data.text);
      
      await worker.terminate();
      
    } catch (tesseractError) {
      console.error('❌ Tesseract.js test failed:', tesseractError.message);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testOCRBase64();

