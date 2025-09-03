const fs = require('fs');
const path = require('path');

// Simple test to debug OCR issues without complex imports
async function testSimpleOCR() {
  try {
    console.log('🔍 Testing simple OCR functionality...');
    
    // Test 1: Check if Tesseract.js is available
    try {
      const Tesseract = require('tesseract.js');
      console.log('✅ Tesseract.js is available');
      
      // Test 2: Create a simple test image with text
      const canvas = require('canvas');
      const { createCanvas } = canvas;
      
      const testCanvas = createCanvas(200, 100);
      const ctx = testCanvas.getContext('2d');
      
      // Draw white background
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, 200, 100);
      
      // Draw black text
      ctx.fillStyle = 'black';
      ctx.font = '16px Arial';
      ctx.fillText('PARACETAMOL 500mg', 10, 30);
      ctx.fillText('GSK Pharmaceuticals', 10, 60);
      
      // Convert to buffer
      const buffer = testCanvas.toBuffer('image/png');
      console.log('✅ Test image created with text');
      
      // Test 3: Try OCR with Tesseract directly
      console.log('🔍 Attempting OCR with Tesseract...');
      
      const worker = await Tesseract.createWorker();
      await worker.loadLanguage('eng');
      await worker.initialize('eng');
      
      const result = await worker.recognize(buffer);
      console.log('📝 OCR result:', result.data.text);
      
      await worker.terminate();
      
    } catch (tesseractError) {
      console.error('❌ Tesseract.js test failed:', tesseractError.message);
      
      // Test 4: Check if we can at least create a test image
      try {
        const canvas = require('canvas');
        console.log('✅ Canvas is available');
        
        const testCanvas = canvas.createCanvas(200, 100);
        const ctx = testCanvas.getContext('2d');
        
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 200, 100);
        ctx.fillStyle = 'black';
        ctx.font = '16px Arial';
        ctx.fillText('TEST TEXT', 10, 30);
        
        console.log('✅ Test image created successfully');
        
      } catch (canvasError) {
        console.error('❌ Canvas test failed:', canvasError.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testSimpleOCR();

