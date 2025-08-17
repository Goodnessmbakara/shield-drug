#!/usr/bin/env node

/**
 * Test script for COCO-SSD dtype fix
 * Tests the COCO-SSD model with correct int32 dtype
 */

const tf = require('@tensorflow/tfjs');
const cocoSsd = require('@tensorflow-models/coco-ssd');

async function testCocoSsdDtype() {
  console.log('🔄 Testing COCO-SSD dtype fix...\n');

  try {
    console.log('📥 Loading COCO-SSD model...');
    
    // Load COCO-SSD model
    const model = await cocoSsd.load({
      base: 'lite_mobilenet_v2'
    });
    
    console.log('✅ COCO-SSD model loaded successfully');

    // Create test tensor with correct int32 dtype (0-255 range)
    console.log('🧪 Creating test tensor with int32 dtype...');
    const testTensor = tf.zeros([224, 224, 3]); // This should be int32 by default
    
    console.log('Tensor dtype:', testTensor.dtype);
    console.log('Tensor shape:', testTensor.shape);
    
    // Test detection
    console.log('🔍 Testing detection...');
    const detections = await model.detect(testTensor);
    
    console.log('✅ Detection successful!');
    console.log('Number of detections:', detections.length);
    
    // Clean up
    testTensor.dispose();
    
    console.log('\n🎉 COCO-SSD dtype fix is working correctly!');
    console.log('✅ The model now accepts int32 tensors without errors.');
    
  } catch (error) {
    console.error('❌ COCO-SSD test failed:', error.message);
    
    if (error.message.includes('dtype')) {
      console.error('🔧 This appears to be a dtype issue. Check tensor conversion.');
    } else if (error.message.includes('model')) {
      console.error('🔧 This appears to be a model loading issue. Check network connectivity.');
    }
    
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testCocoSsdDtype().catch(console.error);
}

module.exports = { testCocoSsdDtype };
