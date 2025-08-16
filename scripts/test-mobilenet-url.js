#!/usr/bin/env node

const tf = require('@tensorflow/tfjs-node');

async function testMobileNetURL() {
  console.log('🔄 Testing MobileNet v2 URL...\n');
  
  const url = 'https://tfhub.dev/google/imagenet/mobilenet_v2_100_224/classification/4';
  console.log(`URL: ${url}\n`);
  
  try {
    console.log('📥 Loading MobileNet v2 model...');
    const startTime = Date.now();
    
    const model = await tf.loadGraphModel(url, { fromTFHub: true });
    
    const loadTime = Date.now() - startTime;
    console.log(`✅ Model loaded successfully in ${loadTime}ms`);
    
    // Test inference
    console.log('\n🧪 Testing inference...');
    const testTensor = tf.zeros([1, 224, 224, 3]);
    const predictions = model.predict(testTensor);
    const probs = tf.softmax(predictions);
    const topK = tf.topk(probs, 5);
    
    const topKData = await topK.values.data();
    const topKIndices = await topK.indices.data();
    
    console.log('✅ Inference successful!');
    console.log(`Top prediction index: ${topKIndices[0]}, confidence: ${topKData[0].toFixed(4)}`);
    
    // Clean up
    testTensor.dispose();
    predictions.dispose();
    probs.dispose();
    topK.values.dispose();
    topK.indices.dispose();
    
    console.log('\n🎉 MobileNet v2 URL is working correctly!');
    return true;
    
  } catch (error) {
    console.error('❌ Error loading MobileNet v2 model:');
    console.error(error.message);
    
    if (error.message.includes('Failed to parse model JSON')) {
      console.log('\n💡 This suggests the URL is incorrect or the model is not available.');
    } else if (error.message.includes('network')) {
      console.log('\n💡 This suggests a network connectivity issue.');
    }
    
    return false;
  }
}

async function main() {
  const success = await testMobileNetURL();
  
  if (success) {
    console.log('\n✅ The MobileNet v2 URL fix was successful!');
    console.log('🚀 You can now use the AI drug analysis service.');
  } else {
    console.log('\n❌ The MobileNet v2 URL is still not working.');
    console.log('🔍 Please check the TensorFlow Hub documentation for the correct URL.');
  }
}

if (require.main === module) {
  main().catch(console.error);
}
