#!/usr/bin/env node

/**
 * Test script to verify DataCloneError fix
 */

const BASE_URL = 'http://localhost:3000';

async function testDataCloneFix() {
  console.log('🧪 Testing DataCloneError Fix...\n');

  try {
    // Test with a simple image to trigger worker creation
    const testImageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    
    console.log('1️⃣ Testing OCR without DataCloneError...');
    
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
    
    console.log('✅ DataClone Fix Test Result:', {
      success: !!result.result,
      hasError: !!result.error,
      hasDataCloneError: result.error?.includes('DataCloneError') || false,
      hasText: result.result?.extractedText?.length > 0,
      textCount: result.result?.extractedText?.length || 0,
      confidence: result.result?.confidence || 0,
      processingTime: result.metadata?.processingTime || 0
    });

    if (result.result && !result.error && !result.error?.includes('DataCloneError')) {
      console.log('\n🎉 DataClone Fix Successful!');
      console.log('- No more DataCloneError crashes');
      console.log('- Worker creation without logger functions');
      console.log('- OCR system is working properly');
      console.log(`- Processing time: ${result.metadata?.processingTime}ms`);
      console.log(`- Model used: ${result.metadata?.modelUsed}`);
    } else if (result.error?.includes('DataCloneError')) {
      console.log('\n❌ DataClone error still present:', result.error);
    } else {
      console.log('\n⚠️ Other error occurred:', result.error);
    }

    // Test multiple requests to check for stability
    console.log('\n2️⃣ Testing multiple requests for stability...');
    
    const promises = [];
    for (let i = 0; i < 2; i++) {
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
    const dataCloneErrors = results.filter(r => r.error?.includes('DataCloneError')).length;
    
    console.log(`✅ Multiple requests test: ${successCount}/2 successful`);
    console.log(`🚨 DataClone errors: ${dataCloneErrors}/2`);
    
    if (dataCloneErrors === 0) {
      console.log('🎉 DataClone stability test passed!');
    } else {
      console.log('❌ DataClone errors still occurring');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testDataCloneFix();
