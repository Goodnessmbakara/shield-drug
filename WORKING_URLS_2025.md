# Working URLs and Alternatives - 2025

## Test Results Summary

### ✅ Working URLs

1. **EfficientNet-B0 (TensorFlow Hub)**
   - URL: `https://tfhub.dev/tensorflow/tfjs-model/efficientnet/b0/classification/1/default/1`
   - Status: 302 (redirect, works)
   - Usage: Image classification

2. **COCO-SSD (jsDelivr CDN)**
   - URL: `https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd@2.2.3/dist/coco-ssd.min.js`
   - Status: 200
   - Usage: Object detection
   - **Better**: Use npm package `@tensorflow-models/coco-ssd` directly

3. **MobileNet (jsDelivr CDN)**
   - URL: `https://cdn.jsdelivr.net/npm/@tensorflow-models/mobilenet@2.1.1/dist/mobilenet.min.js`
   - Status: 200
   - Usage: Image classification
   - **Better**: Use npm package `@tensorflow-models/mobilenet` directly

4. **TensorFlow.js Core (jsDelivr CDN)**
   - URL: `https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@latest/dist/tf.min.js`
   - Status: 200
   - Usage: Core library
   - **Better**: Use npm package `@tensorflow/tfjs` directly

### ❌ Broken URLs (Need Alternatives)

1. **MobileNet v2 (TensorFlow Hub)**
   - Broken URL: `https://tfhub.dev/google/imagenet/mobilenet_v2_100_224/classification/2`
   - **Alternative**: Use npm package `@tensorflow-models/mobilenet` (v1 or v2 via package)

2. **ResNet50 (TensorFlow Hub)**
   - Broken URL: `https://tfhub.dev/tensorflow/tfjs-model/imagenet/resnet_v2_50/classification/1/default/1`
   - **Alternative**: Use EfficientNet-B0 (works) or remove dependency

3. **EAST Text Detection (TensorFlow Hub)**
   - Broken URL: `https://tfhub.dev/tensorflow/tfjs-model/east-text-detection/1/default/1`
   - **Alternative**: Use DeepSeek-OCR (Python service) or Tesseract.js

4. **Google Cloud Storage Models**
   - All GCS URLs broken (404)
   - **Alternative**: Use npm packages or remove dependencies

5. **HuggingFace Inference API**
   - Broken URL: `https://api-inference.huggingface.co/models/` (410 error)
   - **Alternative**: Use new endpoint format or remove if not needed
   - New format: `https://api-inference.huggingface.co/models/{model_id}` (may need API key)

6. **OpenFDA API**
   - Timeout issues
   - **Alternative**: Keep but handle timeouts gracefully, or remove if not critical

7. **SightEngine API**
   - Timeout issues
   - **Alternative**: Keep but handle timeouts gracefully, or remove if not critical

## Recommended Approach

### For OCR (Priority)
1. **Primary**: DeepSeek-OCR (Python service via `/api/ai/deepseek-ocr`)
2. **Fallback**: Tesseract.js (npm package, works locally)
3. **No remote URLs needed** - both work locally

### For Image Classification
1. **Primary**: COCO-SSD (npm package `@tensorflow-models/coco-ssd`)
2. **Secondary**: EfficientNet-B0 (TensorFlow Hub - works)
3. **Fallback**: Text-based heuristics (no model needed)

### For Object Detection
1. **Primary**: COCO-SSD (npm package `@tensorflow-models/coco-ssd`)
2. **No alternatives needed** - works via npm

## Implementation Strategy

1. **Remove all broken TensorFlow Hub URLs**
2. **Use npm packages instead of CDN URLs** where possible
3. **Keep only working models**: COCO-SSD, EfficientNet-B0
4. **Remove dependencies on**: MobileNet v2, ResNet50, EAST, GCS models
5. **Focus on OCR-first approach**: DeepSeek-OCR → Tesseract → Heuristics

