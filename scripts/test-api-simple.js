#!/usr/bin/env node
/**
 * Simple test script for DrugShield API endpoint
 * Uses only built-in Node.js modules
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const API_URL = process.env.API_URL || 'https://shield-drug.vercel.app/api/ai/analyze';
const TEST_IMAGE = process.argv[2] || path.join(process.env.HOME, 'Downloads', 'malariatab2.jpeg');

function testAPI() {
  console.log('🧪 Testing DrugShield API...');
  console.log(`📍 Endpoint: ${API_URL}`);
  console.log(`🖼️  Image: ${TEST_IMAGE}`);
  console.log('');

  // Check if image exists
  if (!fs.existsSync(TEST_IMAGE)) {
    console.error(`❌ Image file not found: ${TEST_IMAGE}`);
    console.log('\n💡 Usage: node scripts/test-api-simple.js [path-to-image]');
    console.log('\nAvailable test images in Downloads:');
    const downloadsDir = path.join(process.env.HOME, 'Downloads');
    try {
      const files = fs.readdirSync(downloadsDir).filter(f => 
        /\.(jpg|jpeg|png)$/i.test(f) && 
        /(drug|medicine|tablet|pill|pharma|para|malaria|artemether|lokmal)/i.test(f)
      );
      files.forEach(f => console.log(`  - ${f}`));
    } catch (e) {
      console.log('  Could not list Downloads directory');
    }
    process.exit(1);
  }

  const imageBuffer = fs.readFileSync(TEST_IMAGE);
  const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
  
  const formData = [
    `--${boundary}`,
    `Content-Disposition: form-data; name="drugImage"; filename="${path.basename(TEST_IMAGE)}"`,
    `Content-Type: image/jpeg`,
    '',
    imageBuffer,
    `--${boundary}--`,
    ''
  ].map(part => Buffer.isBuffer(part) ? part : Buffer.from(part + '\r\n')).reduce((acc, part) => {
    return Buffer.concat([acc, part]);
  }, Buffer.alloc(0));

  const url = new URL(API_URL);
  const options = {
    hostname: url.hostname,
    port: url.port || (url.protocol === 'https:' ? 443 : 80),
    path: url.pathname,
    method: 'POST',
    headers: {
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      'Content-Length': formData.length,
    },
  };

  console.log('📤 Uploading image...');
  const startTime = Date.now();
  
  const req = (url.protocol === 'https:' ? https : http).request(options, (res) => {
    const processingTime = Date.now() - startTime;
    let responseData = '';

    console.log(`\n📊 Response Status: ${res.statusCode} ${res.statusMessage}`);
    console.log(`⏱️  Processing Time: ${processingTime}ms`);

    res.on('data', (chunk) => {
      responseData += chunk;
    });

    res.on('end', () => {
      console.log(`📦 Response Size: ${responseData.length} bytes`);
      console.log('');

      if (res.statusCode === 200) {
        try {
          const data = JSON.parse(responseData);
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
            if (analysis.extractedText && analysis.extractedText.length > 0) {
              console.log(`  Extracted Text: ${analysis.extractedText.slice(0, 3).join(', ')}`);
            }
          }
        } catch (e) {
          console.log('📄 Raw Response (first 500 chars):');
          console.log(responseData.substring(0, 500));
        }
      } else {
        console.error('❌ API Error:');
        console.log(responseData);
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ Request Failed:');
    console.error(error.message);
    if (error.code === 'ENOTFOUND') {
      console.error('\n💡 Tip: Check your internet connection');
    }
    process.exit(1);
  });

  req.write(formData);
  req.end();
}

// Run test
testAPI();

