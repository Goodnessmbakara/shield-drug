#!/usr/bin/env node
/**
 * Test all URLs in the codebase to identify working vs broken ones
 */

const https = require('https');
const http = require('http');

const urlsToTest = [
  // TensorFlow Hub URLs
  {
    name: 'MobileNet v2 (TF Hub)',
    url: 'https://tfhub.dev/google/imagenet/mobilenet_v2_100_224/classification/2',
    type: 'model'
  },
  {
    name: 'EfficientNet-B0 (TF Hub)',
    url: 'https://tfhub.dev/tensorflow/tfjs-model/efficientnet/b0/classification/1/default/1',
    type: 'model'
  },
  {
    name: 'ResNet50 (TF Hub)',
    url: 'https://tfhub.dev/tensorflow/tfjs-model/imagenet/resnet_v2_50/classification/1/default/1',
    type: 'model'
  },
  {
    name: 'EAST Text Detection (TF Hub)',
    url: 'https://tfhub.dev/tensorflow/tfjs-model/east-text-detection/1/default/1',
    type: 'model'
  },
  
  // Google Cloud Storage URLs (known broken)
  {
    name: 'Drug Classifier (GCS)',
    url: 'https://storage.googleapis.com/pharmaceutical-models/efficientnet-b3-drug-classifier/model.json',
    type: 'model'
  },
  {
    name: 'Authenticity Model (GCS)',
    url: 'https://storage.googleapis.com/pharmaceutical-models/resnet50-authenticity/model.json',
    type: 'model'
  },
  {
    name: 'Pill Detector (GCS)',
    url: 'https://storage.googleapis.com/pharmaceutical-models/yolov5-pill-detector/model.json',
    type: 'model'
  },
  {
    name: 'Text Detector (GCS)',
    url: 'https://storage.googleapis.com/pharmaceutical-models/text-detection/model.json',
    type: 'model'
  },
  
  // CDN URLs
  {
    name: 'COCO-SSD (jsDelivr)',
    url: 'https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd@2.2.3/dist/coco-ssd.min.js',
    type: 'cdn'
  },
  {
    name: 'MobileNet (jsDelivr)',
    url: 'https://cdn.jsdelivr.net/npm/@tensorflow-models/mobilenet@2.1.1/dist/mobilenet.min.js',
    type: 'cdn'
  },
  {
    name: 'TensorFlow.js Core (jsDelivr)',
    url: 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@latest/dist/tf.min.js',
    type: 'cdn'
  },
  
  // HuggingFace API
  {
    name: 'HuggingFace API Base',
    url: 'https://api-inference.huggingface.co/models/',
    type: 'api'
  },
  {
    name: 'BiomedCLIP Model',
    url: 'https://api-inference.huggingface.co/models/microsoft/BiomedCLIP-PubMedBERT_256-vit_base_patch16_224',
    type: 'api'
  },
  {
    name: 'ViT Base Model',
    url: 'https://api-inference.huggingface.co/models/google/vit-base-patch16-224',
    type: 'api'
  },
  
  // Other APIs
  {
    name: 'OpenFDA API',
    url: 'https://api.fda.gov',
    type: 'api'
  },
  {
    name: 'SightEngine API',
    url: 'https://api.sightengine.com/1.0',
    type: 'api'
  }
];

function testUrl(urlObj) {
  return new Promise((resolve) => {
    const url = new URL(urlObj.url);
    const client = url.protocol === 'https:' ? https : http;
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'HEAD',
      timeout: 5000,
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    };

    const req = client.request(options, (res) => {
      resolve({
        name: urlObj.name,
        url: urlObj.url,
        type: urlObj.type,
        status: res.statusCode,
        working: res.statusCode >= 200 && res.statusCode < 400,
        redirect: res.statusCode >= 300 && res.statusCode < 400
      });
      res.on('data', () => {});
      res.on('end', () => {});
    });

    req.on('error', (error) => {
      resolve({
        name: urlObj.name,
        url: urlObj.url,
        type: urlObj.type,
        status: 'ERROR',
        working: false,
        error: error.message
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        name: urlObj.name,
        url: urlObj.url,
        type: urlObj.type,
        status: 'TIMEOUT',
        working: false,
        error: 'Request timeout'
      });
    });

    req.end();
  });
}

async function testAllUrls() {
  console.log('Testing all URLs in codebase...\n');
  
  const results = [];
  for (const urlObj of urlsToTest) {
    process.stdout.write(`Testing ${urlObj.name}... `);
    const result = await testUrl(urlObj);
    results.push(result);
    
    if (result.working) {
      console.log(`✓ Working (${result.status})`);
    } else if (result.redirect) {
      console.log(`⚠ Redirect (${result.status})`);
    } else {
      console.log(`✗ Broken (${result.status || result.error})`);
    }
  }
  
  console.log('\n=== SUMMARY ===\n');
  
  const working = results.filter(r => r.working);
  const broken = results.filter(r => !r.working && !r.redirect);
  const redirects = results.filter(r => r.redirect);
  
  console.log(`Working: ${working.length}`);
  working.forEach(r => console.log(`  ✓ ${r.name}`));
  
  console.log(`\nRedirects (may work): ${redirects.length}`);
  redirects.forEach(r => console.log(`  ⚠ ${r.name} (${r.status})`));
  
  console.log(`\nBroken: ${broken.length}`);
  broken.forEach(r => console.log(`  ✗ ${r.name} - ${r.error || r.status}`));
  
  return { working, broken, redirects, all: results };
}

testAllUrls().then(results => {
  console.log('\n=== DETAILED RESULTS ===\n');
  results.all.forEach(r => {
    console.log(`${r.name}:`);
    console.log(`  URL: ${r.url}`);
    console.log(`  Status: ${r.status || r.error}`);
    console.log(`  Working: ${r.working ? 'Yes' : 'No'}`);
    console.log('');
  });
  
  process.exit(0);
}).catch(error => {
  console.error('Error:', error);
  process.exit(1);
});

