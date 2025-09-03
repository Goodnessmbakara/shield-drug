const fs = require('fs');
const path = require('path');

// Test script for the enhanced API functionality
async function testEnhancedAPI() {
  try {
    console.log('🚀 Testing Enhanced Drug Analysis API...');
    
    // Test 1: Check if development server is running
    console.log('\n📡 Step 1: Checking if development server is running...');
    
    try {
      const healthResponse = await fetch('http://localhost:3001/api/ai/enhanced-analyze', {
        method: 'OPTIONS'
      });
      console.log('✅ Server is running on port 3001');
    } catch (error) {
      try {
        const healthResponse = await fetch('http://localhost:3000/api/ai/enhanced-analyze', {
          method: 'OPTIONS'
        });
        console.log('✅ Server is running on port 3000');
      } catch (error2) {
        console.log('❌ Development server not running. Please run: pnpm dev');
        return;
      }
    }
    
    // Test 2: Create a simple test image (base64 encoded 1x1 pixel)
    console.log('\n🖼️ Step 2: Creating test image...');
    const testImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    console.log('✅ Test image created (1x1 white pixel)');
    
    // Test 3: Test standard API endpoint
    console.log('\n🔍 Step 3: Testing standard AI analysis...');
    
    const port = await detectPort();
    
    try {
      const standardResponse = await fetch(`http://localhost:${port}/api/ai/analyze-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          imageData: testImage
        })
      });
      
      if (standardResponse.ok) {
        const standardResult = await standardResponse.json();
        console.log('✅ Standard analysis completed');
        console.log('📊 Result:', {
          drugName: standardResult.result?.drugName || 'N/A',
          confidence: standardResult.result?.confidence || 0,
          method: standardResult.metadata?.modelUsed || 'unknown'
        });
      } else {
        console.log('⚠️ Standard analysis failed:', standardResponse.status);
      }
    } catch (error) {
      console.log('⚠️ Standard analysis error:', error.message);
    }
    
    // Test 4: Test enhanced API endpoint
    console.log('\n🚀 Step 4: Testing enhanced AI analysis...');
    
    try {
      const enhancedResponse = await fetch(`http://localhost:${port}/api/ai/enhanced-analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          imageData: testImage
        })
      });
      
      if (enhancedResponse.ok) {
        const enhancedResult = await enhancedResponse.json();
        console.log('✅ Enhanced analysis completed');
        console.log('📊 Result:', {
          drugName: enhancedResult.result?.drugName || 'N/A',
          confidence: enhancedResult.result?.confidence || 0,
          combinedConfidence: enhancedResult.result?.enhancedFeatures?.combinedConfidence || 0,
          apisUsed: enhancedResult.metadata?.apisUsed || [],
          dataQuality: enhancedResult.metadata?.dataQuality || 'unknown'
        });
        
        if (enhancedResult.result?.enhancedFeatures?.fdaValidation) {
          console.log('🏛️ FDA Validation:', enhancedResult.result.enhancedFeatures.fdaValidation.isValid ? 'Valid' : 'Not found');
        }
        
        if (enhancedResult.result?.enhancedFeatures?.sightEngineAnalysis) {
          console.log('👁️ SightEngine Analysis:', enhancedResult.result.enhancedFeatures.sightEngineAnalysis.isPharmaceutical ? 'Pharmaceutical' : 'Non-pharmaceutical');
        }
        
      } else {
        console.log('⚠️ Enhanced analysis failed:', enhancedResponse.status);
        const errorText = await enhancedResponse.text();
        console.log('Error details:', errorText);
      }
    } catch (error) {
      console.log('⚠️ Enhanced analysis error:', error.message);
    }
    
    // Test 5: Test standard API with enhanced mode
    console.log('\n🔄 Step 5: Testing standard API with enhanced mode...');
    
    try {
      const hybridResponse = await fetch(`http://localhost:${port}/api/ai/analyze-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          imageData: testImage,
          useEnhanced: true
        })
      });
      
      if (hybridResponse.ok) {
        const hybridResult = await hybridResponse.json();
        console.log('✅ Hybrid analysis completed');
        console.log('📊 Result:', {
          drugName: hybridResult.result?.drugName || 'N/A',
          confidence: hybridResult.result?.confidence || 0,
          method: hybridResult.metadata?.modelUsed || 'unknown',
          hasEnhancedFeatures: !!hybridResult.result?.enhancedFeatures
        });
      } else {
        console.log('⚠️ Hybrid analysis failed:', hybridResponse.status);
      }
    } catch (error) {
      console.log('⚠️ Hybrid analysis error:', error.message);
    }
    
    // Test 6: Show API configuration status
    console.log('\n⚙️ Step 6: API Configuration Status');
    console.log('📋 Available APIs:');
    console.log('  ✅ Local TensorFlow.js Models (Always available)');
    console.log('  ✅ OpenFDA API (Free - no key required)');
    console.log('  ❓ SightEngine API (Requires API credentials)');
    console.log('  ❓ Veryfi OCR API (Future integration)');
    console.log('  ❓ RxNorm API (Future integration)');
    
    console.log('\n🎉 Enhanced API testing completed!');
    console.log('\n📖 Usage Instructions:');
    console.log('1. For better accuracy, use /api/ai/enhanced-analyze');
    console.log('2. Configure external API keys in .env.local for maximum accuracy');
    console.log('3. The system gracefully falls back to local models if external APIs fail');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Helper function to detect which port the server is running on
async function detectPort() {
  const ports = [3001, 3000, 3002];
  
  for (const port of ports) {
    try {
      const response = await fetch(`http://localhost:${port}`, { method: 'HEAD' });
      return port;
    } catch (error) {
      continue;
    }
  }
  
  return 3000; // Default fallback
}

// Run the test
testEnhancedAPI();

