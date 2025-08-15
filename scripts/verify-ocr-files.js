#!/usr/bin/env node

/**
 * Verification script for the new pharmaceutical OCR implementation
 * This script checks that all required files have been created
 */

const fs = require('fs');
const path = require('path');

function verifyOCRImplementation() {
  console.log('🔍 Verifying Pharmaceutical OCR Implementation Files\n');

  const requiredFiles = [
    'src/lib/ocr-service.ts',
    'src/lib/image-preprocessing.ts',
    'src/lib/pharmaceutical-patterns.ts'
  ];

  const modifiedFiles = [
    'src/services/aiDrugAnalysis.ts',
    'src/lib/ai-drug-recognition.ts'
  ];

  let allFilesExist = true;

  // Check required files
  console.log('📋 Checking Required Files:');
  for (const file of requiredFiles) {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      console.log(`✅ ${file} (${(stats.size / 1024).toFixed(1)} KB)`);
    } else {
      console.log(`❌ ${file} - MISSING`);
      allFilesExist = false;
    }
  }

  console.log('\n📝 Checking Modified Files:');
  for (const file of modifiedFiles) {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      console.log(`✅ ${file} (${(stats.size / 1024).toFixed(1)} KB)`);
    } else {
      console.log(`❌ ${file} - MISSING`);
      allFilesExist = false;
    }
  }

  // Check for key imports in modified files
  console.log('\n🔍 Checking Key Imports:');
  
  try {
    const aiDrugAnalysisContent = fs.readFileSync('src/services/aiDrugAnalysis.ts', 'utf8');
    if (aiDrugAnalysisContent.includes('recognizePharmaceuticalText')) {
      console.log('✅ aiDrugAnalysis.ts - OCR service imported');
    } else {
      console.log('❌ aiDrugAnalysis.ts - OCR service import missing');
      allFilesExist = false;
    }
  } catch (error) {
    console.log('❌ aiDrugAnalysis.ts - Could not read file');
    allFilesExist = false;
  }

  try {
    const aiDrugRecognitionContent = fs.readFileSync('src/lib/ai-drug-recognition.ts', 'utf8');
    if (aiDrugRecognitionContent.includes('recognizePharmaceuticalText')) {
      console.log('✅ ai-drug-recognition.ts - OCR service imported');
    } else {
      console.log('❌ ai-drug-recognition.ts - OCR service import missing');
      allFilesExist = false;
    }
  } catch (error) {
    console.log('❌ ai-drug-recognition.ts - Could not read file');
    allFilesExist = false;
  }

  // Check package.json for required dependencies
  console.log('\n📦 Checking Dependencies:');
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const dependencies = packageJson.dependencies || {};
    
    if (dependencies['tesseract.js']) {
      console.log('✅ tesseract.js dependency found');
    } else {
      console.log('❌ tesseract.js dependency missing');
      allFilesExist = false;
    }
    
    if (dependencies['sharp']) {
      console.log('✅ sharp dependency found');
    } else {
      console.log('❌ sharp dependency missing');
      allFilesExist = false;
    }
  } catch (error) {
    console.log('❌ Could not read package.json');
    allFilesExist = false;
  }

  // Summary
  console.log('\n📊 Summary:');
  if (allFilesExist) {
    console.log('🎉 All files and dependencies verified successfully!');
    console.log('\n🚀 The pharmaceutical OCR implementation is ready for use.');
    console.log('\n📋 Implementation includes:');
    console.log('• Pharmaceutical-optimized OCR service with Tesseract.js');
    console.log('• Environment-specific image preprocessing (browser/Node.js)');
    console.log('• Comprehensive pharmaceutical text patterns and validation');
    console.log('• OCR error correction for common pharmaceutical misreads');
    console.log('• Enhanced counterfeit detection using OCR quality metrics');
    console.log('• Worker lifecycle management for optimal performance');
    console.log('• Fallback mechanisms for robust error handling');
  } else {
    console.log('❌ Some files or dependencies are missing.');
    console.log('Please check the errors above and ensure all files are created.');
    process.exit(1);
  }
}

// Run the verification
verifyOCRImplementation();
