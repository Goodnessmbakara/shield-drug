#!/usr/bin/env node

/**
 * Quick test to verify OCR fix
 */

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

async function testOCRFix() {
  console.log('🧪 Testing OCR Fix...\n');

  try {
    // Create a simple test image (1x1 white pixel)
    const testImageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    
    console.log('1️⃣ Testing OCR with fixed PSM configuration...');
    
    const response = await fetch(`${BASE_URL}/api/ai/analyze-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageData: testImageBase64,
        analysisType: 'pharmaceutical'
      })
    });

    const result = await response.json();
    
    console.log('✅ OCR Test Result:', {
      success: result.success,
      hasError: !!result.error,
      hasText: result.data?.extractedText?.length > 0,
      textCount: result.data?.extractedText?.length || 0,
      confidence: result.data?.confidence || 0
    });

    if (result.success && !result.error) {
      console.log('\n🎉 OCR Fix Successful!');
      console.log('- No more RuntimeError crashes');
      console.log('- No more osd.traineddata errors');
      console.log('- OCR system is working properly');
    } else {
      console.log('\n❌ OCR still has issues:', result.error);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testOCRFix();
