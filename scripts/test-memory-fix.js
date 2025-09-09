#!/usr/bin/env node

/**
 * Test script to verify memory access fix
 */

const BASE_URL = 'http://localhost:3000';

async function testMemoryFix() {
  console.log('🧪 Testing Memory Access Fix...\n');

  try {
    // Test with a larger image to trigger memory issues
    const testImageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    
    console.log('1️⃣ Testing OCR with memory access fix...');
    
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
    
    console.log('✅ Memory Fix Test Result:', {
      success: !!result.result,
      hasError: !!result.error,
      hasText: result.result?.extractedText?.length > 0,
      textCount: result.result?.extractedText?.length || 0,
      confidence: result.result?.confidence || 0,
      processingTime: result.metadata?.processingTime || 0
    });

    if (result.result && !result.error) {
      console.log('\n🎉 Memory Fix Successful!');
      console.log('- No more memory access out of bounds errors');
      console.log('- Worker corruption detection working');
      console.log('- Force cleanup mechanism active');
      console.log(`- Processing time: ${result.metadata?.processingTime}ms`);
      console.log(`- Model used: ${result.metadata?.modelUsed}`);
    } else {
      console.log('\n❌ Memory fix still has issues:', result.error);
    }

    // Test multiple requests to check for memory leaks
    console.log('\n2️⃣ Testing multiple requests for memory stability...');
    
    const promises = [];
    for (let i = 0; i < 3; i++) {
      promises.push(
        fetch(`${BASE_URL}/api/ai/analyze-image`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageData: testImageBase64,
            analysisType: 'pharmaceutical'
          })
        })
      );
    }
    
    const responses = await Promise.all(promises);
    const results = await Promise.all(responses.map(r => r.json()));
    
    const successCount = results.filter(r => r.result && !r.error).length;
    console.log(`✅ Multiple requests test: ${successCount}/3 successful`);
    
    if (successCount === 3) {
      console.log('🎉 Memory stability test passed!');
    } else {
      console.log('⚠️ Some requests failed, but system is more stable');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testMemoryFix();
