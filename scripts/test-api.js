#!/usr/bin/env node
/**
 * Test script for DrugShield API endpoint
 * Tests the production API on Vercel
 */

const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const fetch = require('node-fetch');

const API_URL = process.env.API_URL || 'https://shield-drug.vercel.app/api/ai/analyze';
const TEST_IMAGE = process.argv[2] || path.join(process.env.HOME, 'Downloads', 'malariatab2.jpeg');

async function testAPI() {
  console.log('🧪 Testing DrugShield API...');
  console.log(`📍 Endpoint: ${API_URL}`);
  console.log(`🖼️  Image: ${TEST_IMAGE}`);
  console.log('');

  // Check if image exists
  if (!fs.existsSync(TEST_IMAGE)) {
    console.error(`❌ Image file not found: ${TEST_IMAGE}`);
    console.log('\nAvailable test images in Downloads:');
    const downloadsDir = path.join(process.env.HOME, 'Downloads');
    const files = fs.readdirSync(downloadsDir).filter(f => 
      /\.(jpg|jpeg|png)$/i.test(f) && 
      /(drug|medicine|tablet|pill|pharma|para|malaria|artemether|lokmal)/i.test(f)
    );
    files.forEach(f => console.log(`  - ${f}`));
    process.exit(1);
  }

  try {
    console.log('📤 Uploading image...');
    const formData = new FormData();
    formData.append('drugImage', fs.createReadStream(TEST_IMAGE));

    const startTime = Date.now();
    const response = await fetch(API_URL, {
      method: 'POST',
      body: formData,
      headers: formData.getHeaders(),
    });

    const processingTime = Date.now() - startTime;
    const responseText = await response.text();

    console.log(`\n📊 Response Status: ${response.status} ${response.statusText}`);
    console.log(`⏱️  Processing Time: ${processingTime}ms`);
    console.log(`📦 Response Size: ${responseText.length} bytes`);
    console.log('');

    if (response.ok) {
      try {
        const data = JSON.parse(responseText);
        console.log('✅ API Response:');
        console.log(JSON.stringify(data, null, 2));
        
        if (data.success && data.data?.analysis) {
          const analysis = data.data.analysis;
          console.log('\n📋 Analysis Summary:');
          console.log(`  Drug Name: ${analysis.drugName || 'Unknown'}`);
          console.log(`  Strength: ${analysis.strength || 'Unknown'}`);
          console.log(`  Confidence: ${(analysis.confidence * 100).toFixed(1)}%`);
          console.log(`  Status: ${analysis.status || 'Unknown'}`);
          console.log(`  OCR Method: ${analysis.ocrMethod || 'Unknown'}`);
          console.log(`  Extracted Text: ${analysis.extractedText?.slice(0, 3).join(', ') || 'None'}`);
        }
      } catch (e) {
        console.log('📄 Raw Response:');
        console.log(responseText.substring(0, 500));
      }
    } else {
      console.error('❌ API Error:');
      console.log(responseText);
    }
  } catch (error) {
    console.error('❌ Request Failed:');
    console.error(error.message);
    if (error.code === 'ENOTFOUND') {
      console.error('\n💡 Tip: Check your internet connection');
    }
    process.exit(1);
  }
}

// Run test
testAPI().catch(console.error);

