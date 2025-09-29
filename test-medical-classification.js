#!/usr/bin/env node

/**
 * Test script for medical classification functionality
 * This script tests the updated medical classification service
 */

const { pharmaceuticalAI } = require('./src/services/pharmaceuticalAI.ts');

async function testMedicalClassification() {
  console.log('🧪 Testing Medical Classification Service...\n');
  
  try {
    // Initialize the service
    console.log('1. Initializing Pharmaceutical AI Service...');
    await pharmaceuticalAI.initialize();
    
    console.log('\n2. Service initialization completed!');
    console.log('✅ Medical classification should now be working');
    
    // Test with a sample image (1x1 pixel for testing)
    console.log('\n3. Testing with sample image...');
    const testImageBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
    
    const result = await pharmaceuticalAI.analyzePharmaceuticalImage(testImageBuffer);
    
    console.log('\n4. Analysis Results:');
    console.log('Drug Name:', result.drugName);
    console.log('Confidence:', result.confidence);
    console.log('Is Authentic:', result.isAuthentic);
    console.log('Counterfeit Risk:', result.counterfeitRisk);
    console.log('Image Classification:', result.imageClassification);
    
    console.log('\n✅ Medical classification test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testMedicalClassification();
