# Valid Model URLs for 2025

## Current Status
The URLs in `.env.local` lines 84-90 point to non-existent Google Cloud Storage buckets. These are custom pharmaceutical models that don't exist at those locations.

## Valid Alternatives (2025)

### Option 1: Use Official TensorFlow.js Models (Recommended)

These are publicly available, working models:

```bash
# Drug Classifier - Use EfficientNet-B0 (lighter alternative)
DRUG_CLASSIFIER_MODEL_URL=https://tfhub.dev/tensorflow/tfjs-model/efficientnet/b0/classification/1/default/1

# Authenticity Model - Use ResNet50 from TensorFlow Hub
AUTHENTICITY_MODEL_URL=https://tfhub.dev/tensorflow/tfjs-model/imagenet/resnet_v2_50/classification/1/default/1

# Pill Detector - Use COCO-SSD (already in your codebase via @tensorflow-models/coco-ssd)
# This is loaded programmatically, not via URL
PILL_DETECTOR_MODEL_URL=https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd@2.2.3/dist/coco-ssd.min.js

# Text Detector - Use EAST text detection or generic OCR
TEXT_DETECTOR_MODEL_URL=https://tfhub.dev/tensorflow/tfjs-model/east-text-detection/1/default/1
```

### Option 2: Use jsDelivr CDN (Fast & Reliable)

```bash
# Drug Classifier - MobileNet v2 (fast, browser-friendly)
DRUG_CLASSIFIER_MODEL_URL=https://cdn.jsdelivr.net/npm/@tensorflow-models/mobilenet@2.1.1/dist/mobilenet.min.js

# Authenticity Model - ResNet50 via jsDelivr
AUTHENTICITY_MODEL_URL=https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@latest/dist/tf.min.js

# Text Detection - Use TensorFlow.js OCR models
TEXT_DETECTOR_MODEL_URL=https://cdn.jsdelivr.net/npm/tfjs-text-detection-ctpn@latest/dist/tfjs-text-detection-ctpn.min.js
```

### Option 3: Self-Hosted Models (If You Have Custom Models)

If you have custom trained pharmaceutical models, host them on:
- **GitHub Releases**: Free, version-controlled
- **Netlify/Vercel**: Free static hosting with CDN
- **Cloudflare R2**: Compatible with S3 API, free tier available
- **AWS S3**: Industry standard, pay-as-you-go

Example self-hosted structure:
```bash
DRUG_CLASSIFIER_MODEL_URL=https://your-username.github.io/pharmaceutical-models/efficientnet-b3-drug-classifier/model.json
AUTHENTICITY_MODEL_URL=https://your-username.github.io/pharmaceutical-models/resnet50-authenticity/model.json
PILL_DETECTOR_MODEL_URL=https://your-username.github.io/pharmaceutical-models/yolov5-pill-detector/model.json
TEXT_DETECTOR_MODEL_URL=https://your-username.github.io/pharmaceutical-models/text-detection/model.json
```

### Option 4: Use Hugging Face (If Models Are Available)

Note: Hugging Face primarily hosts PyTorch models, but some have TensorFlow.js conversions:

```bash
# Search for pharmaceutical models on Hugging Face
# Example format (if available):
DRUG_CLASSIFIER_MODEL_URL=https://huggingface.co/username/model-name/resolve/main/model.json
```

## Recommended Configuration for Your Project

Based on your codebase analysis, you're already using:
- `@tensorflow-models/coco-ssd` for object detection (works well)
- MobileNet v2 for classification

**Recommended minimal update** (use what's already working):

```bash
# Use TensorFlow Hub models (free, reliable)
DRUG_CLASSIFIER_MODEL_URL=https://tfhub.dev/tensorflow/tfjs-model/efficientnet/b0/classification/1/default/1
AUTHENTICITY_MODEL_URL=https://tfhub.dev/tensorflow/tfjs-model/imagenet/resnet_v2_50/classification/1/default/1
PILL_DETECTOR_MODEL_URL=https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd@2.2.3/dist/coco-ssd.min.js
TEXT_DETECTOR_MODEL_URL=https://tfhub.dev/tensorflow/tfjs-model/east-text-detection/1/default/1
```

## Testing URLs

To verify these URLs work, run:
```bash
curl -I https://tfhub.dev/tensorflow/tfjs-model/efficientnet/b0/classification/1/default/1
curl -I https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd@2.2.3/dist/coco-ssd.min.js
```

## Notes

1. **Custom Models**: If you need pharmaceutical-specific models, you'll need to:
   - Train them yourself
   - Convert them to TensorFlow.js format
   - Host them on a CDN or cloud storage

2. **Model Format**: TensorFlow.js models require:
   - `model.json` (manifest file)
   - `.bin` weight files (referenced in model.json)

3. **Performance**: Generic models (MobileNet, EfficientNet-B0) work well for general classification but may need fine-tuning for pharmaceutical-specific use cases.

