# Quick Start: DeepSeek-OCR Integration

## ✅ What's Been Set Up

1. **Python Service** (`services/deepseek-ocr-service.py`)
   - Uses Hugging Face Transformers pipeline
   - Direct integration with `deepseek-ai/DeepSeek-OCR`
   - Handles base64 images and file paths

2. **API Endpoint** (`pages/api/ai/deepseek-ocr.ts`)
   - REST API for DeepSeek-OCR
   - Handles large images (10MB limit)
   - 30-second timeout

3. **TypeScript Service** (`src/lib/deepseek-ocr-service.ts`)
   - Client-side wrapper for the API
   - Pharmaceutical-focused text extraction

4. **Enhanced OCR Service** (`src/lib/ocr-service.ts`)
   - New function: `recognizePharmaceuticalTextEnhanced()`
   - Automatically tries DeepSeek-OCR first, falls back to Tesseract

5. **Configuration** (`.env.local`)
   - `DEEPSEEK_OCR_ENABLED=true`
   - `DEEPSEEK_OCR_MODEL=deepseek-ai/DeepSeek-OCR`

## 🚀 Quick Start

### Step 1: Install Python Dependencies

```bash
pip install -r requirements.txt
```

Or install manually:
```bash
pip install transformers torch pillow accelerate
```

### Step 2: Test the Setup

```bash
# Test Python service directly
python3 services/deepseek-ocr-service.py --help

# Test with an image (if you have one)
python3 services/deepseek-ocr-service.py path/to/image.jpg
```

### Step 3: Use in Your Code

```typescript
import { recognizePharmaceuticalTextEnhanced } from '@/lib/ocr-service';

// Automatically uses DeepSeek-OCR first, then Tesseract fallback
const textLines = await recognizePharmaceuticalTextEnhanced(imageData);
```

Or use DeepSeek-OCR directly:

```typescript
import { extractPharmaceuticalText } from '@/lib/deepseek-ocr-service';

const result = await extractPharmaceuticalText(imageData);
if (result.success) {
  console.log(result.text_lines);
}
```

## 📝 Usage Examples

### Example 1: Basic OCR

```typescript
import { recognizePharmaceuticalTextEnhanced } from '@/lib/ocr-service';

const imageData = "data:image/jpeg;base64,..."; // Your image data
const textLines = await recognizePharmaceuticalTextEnhanced(imageData);
console.log('Extracted text:', textLines);
```

### Example 2: Direct API Call

```typescript
const response = await fetch('/api/ai/deepseek-ocr', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    imageData: base64ImageData,
    prompt: "Extract batch numbers and expiry dates"
  })
});

const result = await response.json();
console.log(result.text_lines);
```

### Example 3: Disable DeepSeek-OCR (Use Tesseract Only)

```typescript
const textLines = await recognizePharmaceuticalTextEnhanced(imageData, {
  preferDeepSeek: false
});
```

## 🔍 How It Works

1. **First Attempt**: Tries DeepSeek-OCR via Python service
2. **Fallback**: If DeepSeek-OCR fails, uses Tesseract.js
3. **Automatic**: No code changes needed - just use the enhanced function

## ⚠️ Important Notes

1. **First Run**: The model will download (~6GB) on first use
2. **Memory**: Requires ~8-12GB RAM for optimal performance
3. **Server-Side Only**: DeepSeek-OCR only works server-side (Node.js), not in browser
4. **Timeout**: 30-second timeout per request

## 🐛 Troubleshooting

**"Python not found"**
- Install Python 3.8+: `python3 --version`
- Ensure it's in PATH

**"Missing dependencies"**
- Run: `pip install transformers torch pillow accelerate`

**"Model download fails"**
- Check internet connection
- Ensure ~10GB free disk space
- Model downloads to: `~/.cache/huggingface/`

**"Out of memory"**
- Reduce image size before processing
- Use Tesseract only: `preferDeepSeek: false`

## 📚 Full Documentation

See `DEEPSEEK_OCR_SETUP.md` for complete documentation.

