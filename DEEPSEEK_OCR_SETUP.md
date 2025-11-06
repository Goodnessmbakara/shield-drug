# DeepSeek-OCR Setup Guide

This guide explains how to set up and use DeepSeek-OCR for pharmaceutical text extraction in the DrugShield platform.

## Overview

DeepSeek-OCR is a state-of-the-art OCR model from Hugging Face that uses a 3B parameter vision-language model. It's integrated into the DrugShield platform as an enhanced OCR option that can extract text from pharmaceutical images with high accuracy.

## Prerequisites

1. **Python 3.8+** installed on your system
2. **Node.js 18+** (already installed for Next.js)
3. **pip** (Python package manager)

## Installation Steps

### 1. Install Python Dependencies

```bash
# Install required Python packages
pip install -r requirements.txt

# Or install individually:
pip install transformers torch pillow accelerate
```

**Note:** The first time you run the service, it will download the DeepSeek-OCR model (~6GB). This may take several minutes depending on your internet connection.

### 2. Verify Installation

```bash
# Test the Python service directly
python3 services/deepseek-ocr-service.py --help

# Or test with a sample image (if you have one)
python3 services/deepseek-ocr-service.py "path/to/image.jpg"
```

### 3. Environment Configuration

The `.env.local` file has been updated with DeepSeek-OCR configuration:

```bash
# DeepSeek-OCR Configuration
DEEPSEEK_OCR_ENABLED=true
DEEPSEEK_OCR_MODEL=deepseek-ai/DeepSeek-OCR
```

## Usage

### In Code

The OCR service automatically tries DeepSeek-OCR first, then falls back to Tesseract if needed:

```typescript
import { recognizePharmaceuticalTextEnhanced } from '@/lib/ocr-service';

// Use enhanced OCR (tries DeepSeek-OCR first)
const textLines = await recognizePharmaceuticalTextEnhanced(imageData, {
  preferDeepSeek: true, // Default: true
});

// Or use DeepSeek-OCR directly
import { extractPharmaceuticalText } from '@/lib/deepseek-ocr-service';

const result = await extractPharmaceuticalText(imageData);
if (result.success) {
  console.log('Extracted text:', result.text_lines);
}
```

### API Endpoint

You can also call the DeepSeek-OCR API directly:

```bash
POST /api/ai/deepseek-ocr
Content-Type: application/json

{
  "imageData": "base64_encoded_image_data",
  "prompt": "Optional custom prompt"
}
```

Response:
```json
{
  "success": true,
  "text": "Full extracted text...",
  "text_lines": ["Line 1", "Line 2", ...],
  "model": "deepseek-ai/DeepSeek-OCR",
  "confidence": 1.0,
  "method": "deepseek-ocr"
}
```

## Architecture

```
┌─────────────────┐
│  Next.js App    │
│  (TypeScript)   │
└────────┬────────┘
         │
         │ HTTP POST
         ▼
┌─────────────────┐
│  API Endpoint   │
│  /api/ai/       │
│  deepseek-ocr   │
└────────┬────────┘
         │
         │ spawn('python3')
         ▼
┌─────────────────┐
│  Python Service │
│  transformers   │
│  pipeline()     │
└────────┬────────┘
         │
         │ model="deepseek-ai/DeepSeek-OCR"
         ▼
┌─────────────────┐
│  Hugging Face   │
│  Model Cache    │
│  (~/.cache)     │
└─────────────────┘
```

## Performance Considerations

1. **First Run**: The model will be downloaded on first use (~6GB). Subsequent runs use cached model.

2. **Memory Usage**: DeepSeek-OCR requires significant RAM (~8-12GB recommended). Ensure your system has enough memory.

3. **Processing Time**: 
   - Model loading: ~5-10 seconds (first time) or ~2-3 seconds (cached)
   - OCR extraction: ~2-5 seconds per image

4. **Fallback**: If DeepSeek-OCR fails or times out, the system automatically falls back to Tesseract.js.

## Troubleshooting

### Issue: "Python process not found"

**Solution**: Ensure Python 3 is installed and in your PATH:
```bash
python3 --version
which python3
```

### Issue: "Missing dependencies"

**Solution**: Install required packages:
```bash
pip install transformers torch pillow accelerate
```

### Issue: "Model download fails"

**Solution**: 
- Check internet connection
- Ensure sufficient disk space (~10GB free)
- Try downloading manually:
```bash
python3 -c "from transformers import pipeline; pipeline('image-text-to-text', model='deepseek-ai/DeepSeek-OCR')"
```

### Issue: "Out of memory"

**Solution**:
- Reduce image size before processing
- Use CPU instead of GPU (if available)
- Disable DeepSeek-OCR and use Tesseract only:
```typescript
await recognizePharmaceuticalTextEnhanced(imageData, {
  preferDeepSeek: false
});
```

### Issue: "Timeout after 30 seconds"

**Solution**:
- The API has a 30-second timeout
- For very large images, pre-process to reduce size
- Consider using Tesseract for faster processing

## Model Information

- **Model**: `deepseek-ai/DeepSeek-OCR`
- **Size**: ~3B parameters
- **Type**: Vision-Language Model (Image-Text-to-Text)
- **License**: MIT
- **Task**: OCR with "Contexts Optical Compression"
- **Performance**: High accuracy, especially for structured text

## Configuration Options

### Disable DeepSeek-OCR

Set in `.env.local`:
```bash
DEEPSEEK_OCR_ENABLED=false
```

Or in code:
```typescript
await recognizePharmaceuticalTextEnhanced(imageData, {
  preferDeepSeek: false
});
```

### Custom Prompts

```typescript
import { extractTextWithDeepSeekOCR } from '@/lib/deepseek-ocr-service';

const result = await extractTextWithDeepSeekOCR(imageData, {
  prompt: "Extract only batch numbers and expiry dates from this pharmaceutical image."
});
```

## Next Steps

1. Test with sample pharmaceutical images
2. Monitor performance and adjust timeout settings if needed
3. Consider caching results for frequently accessed images
4. Set up GPU support for faster processing (optional)

## References

- [DeepSeek-OCR on Hugging Face](https://huggingface.co/deepseek-ai/DeepSeek-OCR)
- [Transformers Documentation](https://huggingface.co/docs/transformers)
- [Model Paper (arXiv)](https://arxiv.org/abs/2510.18234)

