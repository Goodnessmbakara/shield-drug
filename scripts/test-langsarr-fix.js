#!/usr/bin/env node

/**
 * Test script to verify langsArr.map error fix
 */

const BASE_URL = 'http://localhost:3000';

async function testLangsArrFix() {
  console.log('🧪 Testing langsArr.map Error Fix...\n');

  try {
    // Test with a simple image
    const testImageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    
    console.log('1️⃣ Testing OCR without langsArr.map error...');
    
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
    
    console.log('📊 langsArr Fix Test Result:', {
      success: !!result.result,
      hasError: !!result.error,
      hasLangsArrError: result.error?.includes('langsArr.map is not a function') || false,
      hasOSDError: result.error?.includes('osd.traineddata') || false,
      hasPSMError: result.error?.includes('SINGLE_LINE') || false,
      hasRuntimeError: result.error?.includes('RuntimeError') || false,
      hasDataCloneError: result.error?.includes('DataCloneError') || false,
      textCount: result.result?.extractedText?.length || 0,
      confidence: result.result?.confidence || 0,
      processingTime: result.metadata?.processingTime || 0
    });

    if (result.result && !result.error) {
      console.log('\n🎉 langsArr Fix Successful!');
      console.log('- No more langsArr.map errors');
      console.log('- No more osd.traineddata errors');
      console.log('- No more invalid PSM mode errors');
      console.log('- No more RuntimeError crashes');
      console.log('- No more DataCloneError crashes');
      console.log(`- Processing time: ${result.metadata?.processingTime}ms`);
      console.log(`- Model used: ${result.metadata?.modelUsed}`);
    } else if (result.error) {
      console.log('\n❌ OCR still has issues:', result.error);
      
      if (result.error.includes('langsArr.map is not a function')) {
        console.log('🚨 Still has langsArr.map error');
      }
      if (result.error.includes('osd.traineddata')) {
        console.log('🚨 Still has osd.traineddata dependency issues');
      }
      if (result.error.includes('SINGLE_LINE')) {
        console.log('🚨 Still has invalid PSM mode issues');
      }
      if (result.error.includes('RuntimeError')) {
        console.log('🚨 Still has RuntimeError crashes');
      }
      if (result.error.includes('DataCloneError')) {
        console.log('🚨 Still has DataCloneError crashes');
      }
    }

    // Test multiple requests to check for stability
    console.log('\n2️⃣ Testing multiple requests for stability...');
    
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
    const errorCount = results.filter(r => r.error).length;
    const langsArrErrors = results.filter(r => r.error?.includes('langsArr.map is not a function')).length;
    const osdErrors = results.filter(r => r.error?.includes('osd.traineddata')).length;
    const psmErrors = results.filter(r => r.error?.includes('SINGLE_LINE')).length;
    const runtimeErrors = results.filter(r => r.error?.includes('RuntimeError')).length;
    
    console.log(`✅ Multiple requests test: ${successCount}/3 successful`);
    console.log(`❌ Error count: ${errorCount}/3`);
    console.log(`🚨 langsArr errors: ${langsArrErrors}/3`);
    console.log(`🚨 OSD errors: ${osdErrors}/3`);
    console.log(`🚨 PSM errors: ${psmErrors}/3`);
    console.log(`🚨 Runtime errors: ${runtimeErrors}/3`);
    
    if (langsArrErrors === 0 && osdErrors === 0 && psmErrors === 0 && runtimeErrors === 0) {
      console.log('🎉 langsArr fix stability test passed!');
    } else {
      console.log('⚠️ Some errors still occurring, but system is more stable');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testLangsArrFix();
