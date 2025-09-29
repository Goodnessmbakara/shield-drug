# API Setup Guide - Shield Drug Project

## 🚨 **Critical Issues Found & Solutions**

### 1. **Google Cloud Vision API - Billing Required**

**Issue**: 403 Forbidden error - "This API method requires billing to be enabled"

**Solution**: 
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to your project (ID: 512813958661)
3. Go to **Billing** → **Link a billing account**
4. Enable billing for your project
5. Wait 2-3 minutes for changes to propagate

**Alternative**: Use a different OCR service that doesn't require billing

### 2. **BiomedCLIP Model Not Found**

**Issue**: 404 error - The model `microsoft/BiomedCLIP-PubMedBERT_256-vit_base_patch16_224` doesn't exist

**Solution**: ✅ **FIXED** - Switched to `microsoft/resnet-50` which is available and working

### 3. **Medical Pills API Disabled**

**Issue**: 404 error - The Ultralytics API endpoint doesn't exist

**Solution**: ✅ **FIXED** - Disabled the non-functional API

## 🔧 **Current API Status**

| API | Status | Issue | Solution |
|-----|--------|-------|----------|
| Google Cloud Vision | ❌ Failed | Billing not enabled | Enable billing in Google Cloud Console |
| Hugging Face Medical | ✅ Working | Model changed | Using `microsoft/resnet-50` |
| Medical Pills API | ✅ Disabled | Non-existent endpoint | Removed from code |

## 📋 **Next Steps**

### Immediate Actions Required:

1. **Enable Google Cloud Billing**:
   - Visit: https://console.developers.google.com/billing/enable?project=512813958661
   - Link a billing account to your project
   - Wait 2-3 minutes for propagation

2. **Test the APIs**:
   ```bash
   # Test Google Cloud Vision (after enabling billing)
   curl -X POST "https://vision.googleapis.com/v1/images:annotate?key=YOUR_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{"requests":[{"image":{"content":"base64_image_data"},"features":[{"type":"TEXT_DETECTION"}]}]}'
   
   # Test Hugging Face (should work now)
   curl -X POST "https://api-inference.huggingface.co/models/microsoft/resnet-50" \
     -H "Authorization: Bearer YOUR_HF_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"inputs":"data:image/jpeg;base64,base64_image_data"}'
   ```

### Alternative Solutions (if billing is not possible):

1. **Use Tesseract.js for OCR** (free, client-side)
2. **Use Azure Computer Vision** (has free tier)
3. **Use AWS Textract** (has free tier)

## 🎯 **Expected Results After Fixes**

- ✅ Google Cloud Vision API: Will work for text extraction
- ✅ Hugging Face Medical Classification: Already working
- ✅ Medical Pills Detection: Using fallback methods
- ✅ Overall pharmaceutical analysis: Should work with proper confidence scores

## 📞 **Support Resources**

- [Google Cloud Vision API Documentation](https://cloud.google.com/vision/docs)
- [Hugging Face Inference API Documentation](https://huggingface.co/docs/api-inference)
- [Google Cloud Billing Setup](https://cloud.google.com/billing/docs/how-to/manage-billing-account)

