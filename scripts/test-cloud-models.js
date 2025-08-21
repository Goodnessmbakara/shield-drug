#!/usr/bin/env node

/**
 * Cloud Models Test Script
 * Tests all cloud AI services to ensure they're properly configured
 */

require('dotenv').config({ path: '.env.local' });

const fs = require('fs');
const path = require('path');

// Test image (1x1 pixel PNG)
const testImageData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

console.log('🧪 Testing Cloud AI Models Configuration...\n');

// Check environment variables
const requiredEnvVars = [
  'HUGGINGFACE_API_KEY',
  'OPENAI_API_KEY',
  'GOOGLE_CLOUD_API_KEY',
  'AZURE_VISION_API_KEY',
  'AWS_ACCESS_KEY_ID'
];

const optionalEnvVars = [
  'AZURE_VISION_ENDPOINT',
  'AWS_SECRET_ACCESS_KEY',
  'AWS_REGION'
];

console.log('📋 Environment Variables Check:');
console.log('================================');

let configuredServices = 0;
let totalServices = requiredEnvVars.length;

requiredEnvVars.forEach(envVar => {
  const value = process.env[envVar];
  if (value && value !== 'your_' + envVar.toLowerCase().replace(/_/g, '_') + '_here') {
    console.log(`✅ ${envVar}: Configured`);
    configuredServices++;
  } else {
    console.log(`❌ ${envVar}: Not configured`);
  }
});

optionalEnvVars.forEach(envVar => {
  const value = process.env[envVar];
  if (value && value !== 'your_' + envVar.toLowerCase().replace(/_/g, '_') + '_here') {
    console.log(`✅ ${envVar}: Configured (optional)`);
  } else {
    console.log(`⚠️  ${envVar}: Not configured (optional)`);
  }
});

console.log(`\n📊 Summary: ${configuredServices}/${totalServices} required services configured`);

// Test cloud models service
async function testCloudModels() {
  console.log('\n🔍 Testing Cloud Models Service...');
  console.log('==================================');

  try {
    // Import the cloud models service
    const { cloudPharmaceuticalAnalyzer } = require('../src/services/cloudModels.ts');
    
    // Test available providers
    const availableProviders = cloudPharmaceuticalAnalyzer.getAvailableProviders();
    console.log('Available providers:', availableProviders);

    // Test connectivity for each provider
    for (const providerId of ['huggingface', 'openai-vision', 'google-vision', 'azure-vision', 'aws-rekognition']) {
      try {
        const isAvailable = await cloudPharmaceuticalAnalyzer.testProviderConnectivity(providerId);
        console.log(`${providerId}: ${isAvailable ? '✅ Available' : '❌ Not available'}`);
      } catch (error) {
        console.log(`${providerId}: ❌ Error - ${error.message}`);
      }
    }

    // Test fallback behavior
    console.log('\n🔄 Testing fallback behavior...');
    try {
      const result = await cloudPharmaceuticalAnalyzer.analyzePharmaceutical(testImageData);
      console.log('✅ Fallback analysis successful');
      console.log('Provider used:', result.provider);
      console.log('Top prediction:', result.drugIdentification.topPrediction);
    } catch (error) {
      console.log('❌ Fallback analysis failed:', error.message);
    }

  } catch (error) {
    console.log('❌ Error testing cloud models:', error.message);
  }
}

// Test HuggingFace service
async function testHuggingFace() {
  console.log('\n🤗 Testing HuggingFace Service...');
  console.log('=================================');

  try {
    const { huggingFacePharmaceuticalAnalyzer } = require('../src/services/huggingFaceModels.ts');
    
    // Test with sample image
    const imageBuffer = Buffer.from(testImageData.split(',')[1], 'base64');
    
    try {
      const result = await huggingFacePharmaceuticalAnalyzer.analyzePharmaceuticalImage(imageBuffer);
      console.log('✅ HuggingFace analysis successful');
      console.log('Drug identification:', result.drugIdentification?.topPrediction || 'None');
    } catch (error) {
      console.log('❌ HuggingFace analysis failed:', error.message);
    }

  } catch (error) {
    console.log('❌ Error testing HuggingFace:', error.message);
  }
}

// Test API endpoints
async function testAPIEndpoints() {
  console.log('\n🌐 Testing API Endpoints...');
  console.log('==========================');

  const endpoints = [
    '/api/ai/analyze-image',
    '/api/ai/drug-recognition',
    '/api/ai/professional-analyze'
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`http://localhost:3000${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageData: testImageData
        })
      });

      if (response.ok) {
        console.log(`✅ ${endpoint}: Available`);
      } else {
        console.log(`⚠️  ${endpoint}: Status ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ ${endpoint}: Error - ${error.message}`);
    }
  }
}

// Generate recommendations
function generateRecommendations() {
  console.log('\n💡 Recommendations:');
  console.log('===================');

  if (configuredServices === 0) {
    console.log('🔴 CRITICAL: No cloud services configured');
    console.log('   - Add at least HUGGINGFACE_API_KEY for basic functionality');
    console.log('   - Consider adding OPENAI_API_KEY for enhanced analysis');
    console.log('   - Follow the setup guide in docs/CLOUD_MODELS_SETUP.md');
  } else if (configuredServices < 2) {
    console.log('🟡 WARNING: Limited cloud services configured');
    console.log('   - Add more API keys for better reliability');
    console.log('   - Consider adding OpenAI for enhanced analysis');
  } else {
    console.log('🟢 GOOD: Multiple cloud services configured');
    console.log('   - System has good redundancy');
    console.log('   - Consider monitoring API usage');
  }

  console.log('\n📚 Next Steps:');
  console.log('1. Add missing API keys to .env.local');
  console.log('2. Restart the development server');
  console.log('3. Test with a real drug image');
  console.log('4. Monitor the logs for any errors');
}

// Main test function
async function runTests() {
  try {
    await testCloudModels();
    await testHuggingFace();
    await testAPIEndpoints();
    generateRecommendations();
  } catch (error) {
    console.error('❌ Test suite failed:', error);
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests().then(() => {
    console.log('\n✅ Cloud models test completed');
    process.exit(0);
  }).catch((error) => {
    console.error('\n❌ Cloud models test failed:', error);
    process.exit(1);
  });
}

module.exports = { runTests };
