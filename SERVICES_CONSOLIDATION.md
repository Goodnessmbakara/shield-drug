# Services Consolidation Documentation

## Overview

This document describes the consolidation of redundant image analysis services and the removal of broken model URLs. The consolidation was completed to improve maintainability, reduce redundancy, and ensure all services use working, verified URLs.

## Changes Made

### 1. Created Unified Service

**New File**: `src/services/unifiedDrugAnalysis.ts`

This service consolidates all working components from redundant services:
- **OCR-first approach**: DeepSeek-OCR → Tesseract → Heuristics
- **COCO-SSD object detection**: Via npm package (works reliably)
- **Text-based drug identification**: Using enhanced drug database
- **No broken model URLs**: All dependencies use working sources

### 2. Consolidated API Endpoints

**New Endpoint**: `pages/api/ai/analyze.ts`

This unified endpoint replaces:
- `/api/ai/analyze-image.ts` (archived)
- `/api/ai/drug-recognition.ts` (archived)
- `/api/ai/enhanced-drug-detection.ts` (archived)
- `/api/ai/enhanced-analyze.ts` (archived)
- `/api/ai/professional-analyze.ts` (archived)

**Kept Separate**: `/api/ai/deepseek-ocr.ts` (dedicated OCR endpoint)

### 3. Archived Redundant Services

The following services were archived to `archived-services/`:
- `src/services/professionalDrugAnalysis.ts` (used broken GCS URLs)
- `src/services/aiDrugAnalysis.ts` (used broken MobileNet URLs)
- `src/services/enhancedDrugAnalysis.ts` (wrapper with redundant functionality)

**Updated**: `src/services/enhancedDrugDetection.ts` now delegates to unified service for backward compatibility

### 4. Removed Broken URLs

**Broken URLs Removed**:
- `https://tfhub.dev/google/imagenet/mobilenet_v2_100_224/classification/2` (404)
- `https://tfhub.dev/tensorflow/tfjs-model/imagenet/resnet_v2_50/classification/1/default/1` (404)
- `https://tfhub.dev/tensorflow/tfjs-model/east-text-detection/1/default/1` (404)
- All Google Cloud Storage URLs (`pharmaceutical-models` bucket doesn't exist)

**Working URLs Kept**:
- `https://tfhub.dev/tensorflow/tfjs-model/efficientnet/b0/classification/1/default/1` (302 redirect, works)
- COCO-SSD via npm package `@tensorflow-models/coco-ssd` (works)
- DeepSeek-OCR via Python service (works locally)

### 5. Removed Unused Packages

**Removed**:
- `@tensorflow/tfjs-core` (redundant with `@tensorflow/tfjs`)

**Kept** (all in use):
- `@tensorflow/tfjs` (core library)
- `@tensorflow/tfjs-node` (Node.js backend)
- `@tensorflow-models/coco-ssd` (object detection)
- `tesseract.js` (OCR fallback)
- `sharp` (image processing)

### 6. Updated Environment Configuration

**Updated `.env.local`**:
- Removed broken model URLs
- Kept only working configuration
- Added DeepSeek-OCR configuration

## Architecture

### OCR Pipeline (Priority)

1. **Primary**: DeepSeek-OCR (Python service via `/api/ai/deepseek-ocr`)
   - Uses Hugging Face Transformers pipeline
   - Model: `deepseek-ai/DeepSeek-OCR`
   - Best accuracy for pharmaceutical text

2. **Fallback**: Tesseract.js (npm package)
   - Local OCR processing
   - Works when DeepSeek-OCR unavailable
   - Multiple PSM modes for better extraction

3. **Final Fallback**: Text-based heuristics
   - Pattern matching on extracted text
   - Drug database lookup

### Image Classification

1. **Primary**: COCO-SSD (npm package)
   - Object detection for pharmaceutical objects
   - Keywords: bottle, box, package, pill, tablet, medicine

2. **Fallback**: Text-based heuristics
   - Uses extracted OCR text
   - Pattern matching for pharmaceutical indicators

3. **No longer used**: MobileNet v2, ResNet50 (broken URLs)

## API Usage

### Unified Endpoint

**POST** `/api/ai/analyze`

**Request** (multipart/form-data):
```
Content-Type: multipart/form-data
drugImage: <file>
```

**Request** (JSON):
```json
{
  "imageData": "data:image/jpeg;base64,..."
}
```

**Response**:
```json
{
  "success": true,
  "message": "Drug image analyzed successfully",
  "data": {
    "analysis": {
      "drugName": "...",
      "strength": "...",
      "confidence": 0.85,
      "status": "authentic",
      "issues": [],
      "extractedText": [...],
      "visualFeatures": {...},
      "isDrugImage": true,
      "imageClassification": {...},
      "ocrMethod": "deepseek-ocr",
      "classificationMethod": "coco-ssd",
      "processingTime": 1234
    },
    "imageInfo": {...},
    "analysisTimestamp": "...",
    "processingTime": 1234,
    "apiVersion": "3.0-unified"
  }
}
```

### DeepSeek-OCR Endpoint

**POST** `/api/ai/deepseek-ocr`

**Request**:
```json
{
  "imageData": "base64_string",
  "prompt": "Optional custom prompt"
}
```

**Response**:
```json
{
  "success": true,
  "text": "Extracted text...",
  "text_lines": ["Line 1", "Line 2"],
  "model": "deepseek-ai/DeepSeek-OCR",
  "confidence": 1.0,
  "method": "deepseek-ocr"
}
```

## Migration Guide

### For Frontend Components

**Old**:
```typescript
const response = await fetch('/api/ai/enhanced-drug-detection', {
  method: 'POST',
  body: formData,
});
```

**New**:
```typescript
const response = await fetch('/api/ai/analyze', {
  method: 'POST',
  body: formData,
});
```

### For Service Imports

**Old**:
```typescript
import { aiDrugAnalysis } from '@/services/aiDrugAnalysis';
import { professionalDrugAnalysis } from '@/services/professionalDrugAnalysis';
```

**New**:
```typescript
import { unifiedDrugAnalysis } from '@/services/unifiedDrugAnalysis';
```

### Backward Compatibility

The `enhancedDrugDetection` service still exists and works, but now delegates to the unified service internally. This ensures existing code continues to work without changes.

## Testing

### Test OCR Pipeline

1. Ensure Python dependencies are installed:
   ```bash
   pip install -r requirements.txt
   ```

2. Test DeepSeek-OCR:
   ```bash
   python3 services/deepseek-ocr-service.py <image_path>
   ```

3. Test unified endpoint:
   ```bash
   curl -X POST http://localhost:3000/api/ai/analyze \
     -F "drugImage=@test-image.jpg"
   ```

### Test Image Classification

1. COCO-SSD should load automatically on first use
2. Check logs for "COCO-SSD model loaded and warmed up"
3. Test with pharmaceutical images

## Performance

- **OCR Processing**: ~2-5 seconds (DeepSeek-OCR) or ~1-3 seconds (Tesseract)
- **Classification**: ~1-2 seconds (COCO-SSD) or instant (text heuristics)
- **Total Processing**: ~3-7 seconds per image

## Troubleshooting

### DeepSeek-OCR Not Working

1. Check Python 3 is installed: `python3 --version`
2. Install dependencies: `pip install -r requirements.txt`
3. Check service file exists: `services/deepseek-ocr-service.py`
4. Check environment variable: `DEEPSEEK_OCR_ENABLED=true`

### COCO-SSD Not Loading

1. Check npm package: `pnpm list @tensorflow-models/coco-ssd`
2. Check TensorFlow.js backend: Should use `tensorflow` backend
3. Check logs for specific error messages

### OCR Returns Empty Text

1. Check image quality and size
2. Try Tesseract fallback (set `DEEPSEEK_OCR_ENABLED=false`)
3. Check image preprocessing (Sharp should handle this)

## Future Improvements

1. **Model Caching**: Cache COCO-SSD model to reduce load time
2. **Batch Processing**: Support multiple images in one request
3. **GPU Support**: Optional GPU acceleration for COCO-SSD
4. **Custom Models**: Support for custom pharmaceutical models
5. **API Rate Limiting**: Add rate limiting for production use

## Files Changed

### Created
- `src/services/unifiedDrugAnalysis.ts`
- `pages/api/ai/analyze.ts`
- `WORKING_URLS_2025.md`
- `SERVICES_CONSOLIDATION.md` (this file)

### Archived
- `archived-services/professionalDrugAnalysis.ts`
- `archived-services/aiDrugAnalysis.ts`
- `archived-services/enhancedDrugAnalysis.ts`
- `archived-services/analyze-image.ts`
- `archived-services/drug-recognition.ts`
- `archived-services/enhanced-drug-detection.ts`
- `archived-services/enhanced-analyze.ts`
- `archived-services/professional-analyze.ts`

### Modified
- `src/services/enhancedDrugDetection.ts` (delegates to unified service)
- `pages/consumer/drug-detection.tsx` (updated API endpoint)
- `package.json` (removed `@tensorflow/tfjs-core`)
- `.env.local` (removed broken URLs)

### Unchanged
- `pages/api/ai/deepseek-ocr.ts` (kept separate for direct OCR access)
- `src/lib/ocr-service.ts` (still used by unified service)
- `src/lib/deepseek-ocr-service.ts` (wrapper for DeepSeek-OCR API)



