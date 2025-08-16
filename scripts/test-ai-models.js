#!/usr/bin/env node

/**
 * Comprehensive AI Model Testing Script
 * Tests TensorFlow.js models and provides diagnostics for the Shield Drug AI service
 */

// Register TypeScript support for imports
require('ts-node/register/transpile-only');
require('tsconfig-paths/register');

const fs = require('fs');
const path = require('path');

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logHeader(message) {
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(`  ${message}`, 'bright');
  log(`${'='.repeat(60)}`, 'cyan');
}

function logSection(message) {
  log(`\n${'-'.repeat(40)}`, 'blue');
  log(`  ${message}`, 'blue');
  log(`${'-'.repeat(40)}`, 'blue');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'cyan');
}

async function testTensorFlowNativeAddon() {
  logSection('Testing TensorFlow.js Native Addon');
  
  try {
    logInfo('Attempting to import @tensorflow/tfjs-node...');
    const tfnode = require('@tensorflow/tfjs-node');
    
    // Test basic functionality
    const tensor = tfnode.tensor2d([[1, 2], [3, 4]]);
    const result = tensor.square().dataSync();
    tensor.dispose();
    
    if (result[0] === 1 && result[3] === 16) {
      logSuccess('TensorFlow.js native addon loaded successfully');
      logInfo('Basic tensor operations working correctly');
      return { success: true, error: null };
    } else {
      throw new Error('Tensor operations returned unexpected results');
    }
  } catch (error) {
    logError('TensorFlow.js native addon failed to load');
    logInfo(`Error: ${error.message}`);
    
    // Provide troubleshooting suggestions
    logWarning('Troubleshooting suggestions:');
    logInfo('1. Run: npm rebuild @tensorflow/tfjs-node --build-addon-from-source');
    logInfo('2. Ensure you have build tools installed:');
    logInfo('   - Windows: Python 3.x, Visual Studio Build Tools, Windows SDK');
    logInfo('   - macOS: Xcode Command Line Tools');
    logInfo('   - Linux: build-essential, python3-dev');
    logInfo('3. Check Node.js version compatibility (recommended: 16.x or 18.x)');
    
    return { success: false, error: error.message };
  }
}

async function testModelLoading() {
  logSection('Testing AI Model Loading');
  
  try {
    logInfo('Importing AIDrugAnalysisService...');
    
    // Add the src directory to the module path
    const srcPath = path.join(__dirname, '..', 'src');
    require('module').globalPaths.push(srcPath);
    
    // Import the service
    const { aiDrugAnalysis } = require('../src/services/aiDrugAnalysis');
    
    logInfo('Initializing AI Drug Analysis Service...');
    const startTime = Date.now();
    
    await aiDrugAnalysis.initialize();
    
    const loadTime = Date.now() - startTime;
    logSuccess(`AI service initialized in ${loadTime}ms`);
    
    return { success: true, loadTime, error: null };
  } catch (error) {
    logError('AI model loading failed');
    logInfo(`Error: ${error.message}`);
    
    // Provide specific error diagnostics
    if (error.message.includes('tfjs-node')) {
      logWarning('Native addon issue detected. Run the native addon test first.');
    } else if (error.message.includes('network')) {
      logWarning('Network connectivity issue. Check your internet connection.');
    } else if (error.message.includes('memory')) {
      logWarning('Memory issue detected. Try with a smaller model or more RAM.');
    }
    
    return { success: false, error: error.message };
  }
}

async function testModelInference() {
  logSection('Testing Model Inference');
  
  try {
    logInfo('Creating test image tensor...');
    
    // Create a dummy image tensor (224x224x3)
    const tf = require('@tensorflow/tfjs-node');
    const testTensor = tf.zeros([224, 224, 3]).toFloat();
    
    logInfo('Testing COCO-SSD model inference...');
    const cocoSsd = require('@tensorflow-models/coco-ssd');
    const cocoSsdModel = await cocoSsd.load({ base: 'lite_mobilenet_v2' });
    
    const cocoStartTime = Date.now();
    const cocoDetections = await cocoSsdModel.detect(testTensor);
    const cocoTime = Date.now() - cocoStartTime;
    
    logSuccess(`COCO-SSD inference completed in ${cocoTime}ms`);
    logInfo(`Detections: ${cocoDetections.length}`);
    
    // Test MobileNet classification
    logInfo('Testing MobileNet classification...');
    const mobileNetModel = await tf.loadGraphModel(
      'https://tfhub.dev/google/imagenet/mobilenet_v2_100_224/classification/2',
      { fromTFHub: true }
    );
    
    const mobileStartTime = Date.now();
    const batchedTensor = testTensor.expandDims(0);
    const predictions = mobileNetModel.predict(batchedTensor);
    const probs = tf.softmax(predictions);
    const topK = tf.topk(probs, 5);
    const topKData = await topK.values.data();
    const topKIndices = await topK.indices.data();
    const mobileTime = Date.now() - mobileStartTime;
    
    logSuccess(`MobileNet inference completed in ${mobileTime}ms`);
    logInfo(`Top prediction index: ${topKIndices[0]}, confidence: ${topKData[0].toFixed(4)}`);
    
    // Clean up tensors
    testTensor.dispose();
    batchedTensor.dispose();
    predictions.dispose();
    probs.dispose();
    topK.values.dispose();
    topK.indices.dispose();
    
    return { 
      success: true, 
      cocoTime, 
      mobileTime, 
      cocoDetections: cocoDetections.length,
      error: null 
    };
  } catch (error) {
    logError('Model inference failed');
    logInfo(`Error: ${error.message}`);
    
    return { success: false, error: error.message };
  }
}

async function benchmarkPerformance() {
  logSection('Performance Benchmarking');
  
  try {
    const tf = require('@tensorflow/tfjs-node');
    
    // Test tensor operations performance
    logInfo('Benchmarking tensor operations...');
    const tensorSizes = [100, 500, 1000];
    
    for (const size of tensorSizes) {
      const startTime = Date.now();
      const tensor = tf.randomNormal([size, size]);
      const result = tensor.matMul(tensor);
      await result.data();
      const time = Date.now() - startTime;
      
      logInfo(`${size}x${size} matrix multiplication: ${time}ms`);
      tensor.dispose();
      result.dispose();
    }
    
    return { success: true };
  } catch (error) {
    logError('Performance benchmarking failed');
    logInfo(`Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

function generateReport(results) {
  logHeader('AI Model Test Report');
  
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      nativeAddon: results.nativeAddon.success ? 'PASS' : 'FAIL',
      modelLoading: results.modelLoading.success ? 'PASS' : 'FAIL',
      inference: results.inference.success ? 'PASS' : 'FAIL',
      performance: results.performance.success ? 'PASS' : 'FAIL'
    },
    details: results,
    recommendations: []
  };
  
  // Generate recommendations based on results
  if (!results.nativeAddon.success) {
    report.recommendations.push('Fix TensorFlow.js native addon installation');
  }
  
  if (!results.modelLoading.success) {
    report.recommendations.push('Check model URLs and network connectivity');
  }
  
  if (!results.inference.success) {
    report.recommendations.push('Verify model compatibility and tensor operations');
  }
  
  if (results.modelLoading.loadTime > 30000) {
    report.recommendations.push('Model loading is slow - consider caching or optimization');
  }
  
  // Display summary
  logSection('Test Summary');
  Object.entries(report.summary).forEach(([test, result]) => {
    const status = result === 'PASS' ? logSuccess : logError;
    status(`${test}: ${result}`);
  });
  
  // Display details
  if (results.modelLoading.loadTime) {
    logInfo(`Model loading time: ${results.modelLoading.loadTime}ms`);
  }
  
  if (results.inference.cocoTime) {
    logInfo(`COCO-SSD inference time: ${results.inference.cocoTime}ms`);
  }
  
  if (results.inference.mobileTime) {
    logInfo(`MobileNet inference time: ${results.inference.mobileTime}ms`);
  }
  
  // Display recommendations
  if (report.recommendations.length > 0) {
    logSection('Recommendations');
    report.recommendations.forEach(rec => logWarning(rec));
  }
  
  // Save report to file
  const reportPath = path.join(__dirname, 'ai-model-test-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  logInfo(`Detailed report saved to: ${reportPath}`);
  
  return report;
}

async function main() {
  logHeader('Shield Drug AI Model Testing Suite');
  logInfo('Starting comprehensive AI model tests...');
  
  const results = {};
  
  // Test 1: TensorFlow.js Native Addon
  results.nativeAddon = await testTensorFlowNativeAddon();
  
  // Test 2: Model Loading
  results.modelLoading = await testModelLoading();
  
  // Test 3: Model Inference
  results.inference = await testModelInference();
  
  // Test 4: Performance Benchmarking
  results.performance = await benchmarkPerformance();
  
  // Generate and display report
  const report = generateReport(results);
  
  // Exit with appropriate code
  const allPassed = Object.values(report.summary).every(result => result === 'PASS');
  
  if (allPassed) {
    logSuccess('\n🎉 All tests passed! AI models are ready for use.');
    process.exit(0);
  } else {
    logError('\n⚠️  Some tests failed. Please review the recommendations above.');
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logError('Unhandled Rejection at:');
  logError(`Promise: ${promise}`);
  logError(`Reason: ${reason}`);
  process.exit(1);
});

// Run the tests
if (require.main === module) {
  main().catch(error => {
    logError('Test suite failed with error:');
    logError(error.message);
    process.exit(1);
  });
}

module.exports = {
  testTensorFlowNativeAddon,
  testModelLoading,
  testModelInference,
  benchmarkPerformance,
  generateReport
};
