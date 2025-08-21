# Cloud AI Models Setup Guide

This guide will help you configure all the cloud AI services used in the Shield Drug platform for pharmaceutical analysis.

## 🎯 Overview

The platform uses multiple cloud AI providers to ensure reliable pharmaceutical analysis:

1. **HuggingFace** - Specialized pharmaceutical models
2. **OpenAI GPT-4 Vision** - Advanced image analysis
3. **Google Cloud Vision** - Text extraction and object detection
4. **Microsoft Azure Computer Vision** - Medical image analysis
5. **AWS Rekognition** - Object and text recognition

## 🔑 Required API Keys

### 1. HuggingFace API Key (Recommended)

**Why HuggingFace?**
- Specialized pharmaceutical models
- Free tier available
- Excellent for drug identification

**Setup Steps:**
1. Go to [HuggingFace](https://huggingface.co/)
2. Create a free account
3. Go to Settings → Access Tokens
4. Create a new token with "read" permissions
5. Copy the token

**Environment Variable:**
```env
HUGGINGFACE_API_KEY=hf_your_token_here
```

### 2. OpenAI API Key (Recommended)

**Why OpenAI?**
- GPT-4 Vision provides excellent pharmaceutical analysis
- Understands medical terminology
- Can analyze complex drug packaging

**Setup Steps:**
1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Create an account
3. Go to API Keys section
4. Create a new API key
5. Copy the key

**Environment Variable:**
```env
OPENAI_API_KEY=sk-your_openai_key_here
```

### 3. Google Cloud Vision API (Optional)

**Why Google Cloud Vision?**
- Excellent text extraction from drug packaging
- Good object detection
- Reliable service

**Setup Steps:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable the Cloud Vision API
4. Create credentials (API Key)
5. Copy the API key

**Environment Variable:**
```env
GOOGLE_CLOUD_API_KEY=your_google_api_key_here
```

### 4. Microsoft Azure Computer Vision (Optional)

**Why Azure Computer Vision?**
- Good medical image analysis
- Text extraction capabilities
- Integration with Azure services

**Setup Steps:**
1. Go to [Azure Portal](https://portal.azure.com/)
2. Create a Computer Vision resource
3. Get the endpoint URL and API key
4. Copy both values

**Environment Variables:**
```env
AZURE_VISION_API_KEY=your_azure_api_key_here
AZURE_VISION_ENDPOINT=https://your-resource.cognitiveservices.azure.com/
```

### 5. AWS Rekognition (Optional)

**Why AWS Rekognition?**
- Good object detection
- Text recognition
- Scalable service

**Setup Steps:**
1. Go to [AWS Console](https://aws.amazon.com/)
2. Create an IAM user with Rekognition permissions
3. Generate access keys
4. Copy the keys

**Environment Variables:**
```env
AWS_ACCESS_KEY_ID=your_aws_access_key_here
AWS_SECRET_ACCESS_KEY=your_aws_secret_key_here
AWS_REGION=us-east-1
```

## 🚀 Quick Setup

### Step 1: Copy Environment Template
```bash
cp env-template.txt .env.local
```

### Step 2: Add Your API Keys
Edit `.env.local` and add your API keys:

```env
# Essential (Recommended)
HUGGINGFACE_API_KEY=hf_your_token_here
OPENAI_API_KEY=sk-your_openai_key_here

# Optional (Add as needed)
GOOGLE_CLOUD_API_KEY=your_google_api_key_here
AZURE_VISION_API_KEY=your_azure_api_key_here
AZURE_VISION_ENDPOINT=https://your-resource.cognitiveservices.azure.com/
AWS_ACCESS_KEY_ID=your_aws_access_key_here
AWS_SECRET_ACCESS_KEY=your_aws_secret_key_here
AWS_REGION=us-east-1
```

### Step 3: Test Configuration
```bash
# Test the setup
node scripts/test-cloud-models.js
```

## 🔧 Configuration Options

### Fallback Behavior
The system is designed to work even without all API keys:

1. **No API Keys**: Uses local TensorFlow.js models only
2. **Partial Keys**: Uses available services with fallbacks
3. **All Keys**: Full cloud analysis with redundancy

### Priority Order
When multiple services are available, the system tries them in this order:

1. HuggingFace (pharmaceutical specialized)
2. OpenAI GPT-4 Vision (general analysis)
3. Google Cloud Vision (text extraction)
4. Azure Computer Vision (medical analysis)
5. AWS Rekognition (object detection)

## 🧪 Testing Your Setup

### Test Individual Services
```bash
# Test HuggingFace
curl -X POST http://localhost:3000/api/ai/test-huggingface

# Test OpenAI
curl -X POST http://localhost:3000/api/ai/test-openai

# Test all services
curl -X POST http://localhost:3000/api/ai/test-all-cloud
```

### Test with Sample Image
1. Go to the consumer page
2. Upload a drug image
3. Check the analysis results
4. Verify cloud services are being used

## 💰 Cost Considerations

### Free Tiers Available
- **HuggingFace**: Free tier with generous limits
- **OpenAI**: $5 free credit for new users
- **Google Cloud**: $300 free credit for new users
- **Azure**: $200 free credit for new users
- **AWS**: Free tier available

### Estimated Costs (Production)
- **HuggingFace**: ~$0.01 per image
- **OpenAI**: ~$0.02 per image
- **Google Cloud**: ~$0.001 per image
- **Azure**: ~$0.001 per image
- **AWS**: ~$0.001 per image

## 🛠️ Troubleshooting

### Common Issues

**1. "HUGGINGFACE_API_KEY environment variable not set"**
- Check your `.env.local` file
- Ensure the key is correctly formatted
- Restart your development server

**2. "All cloud providers failed"**
- Check your internet connection
- Verify API keys are valid
- Check service quotas and limits

**3. "Rate limit exceeded"**
- Wait a few minutes
- Check your service usage
- Consider upgrading your plan

### Debug Mode
Enable debug logging by adding to `.env.local`:
```env
DEBUG_CLOUD_MODELS=true
```

### Health Check
```bash
# Check which services are available
curl http://localhost:3000/api/ai/health
```

## 🔒 Security Best Practices

1. **Never commit API keys** to version control
2. **Use environment variables** for all sensitive data
3. **Rotate API keys** regularly
4. **Monitor usage** to prevent unexpected charges
5. **Use least privilege** permissions for API keys

## 📞 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Verify your API keys are correct
3. Test individual services
4. Check service status pages:
   - [HuggingFace Status](https://status.huggingface.co/)
   - [OpenAI Status](https://status.openai.com/)
   - [Google Cloud Status](https://status.cloud.google.com/)
   - [Azure Status](https://status.azure.com/)
   - [AWS Status](https://status.aws.amazon.com/)

## 🎯 Next Steps

After setting up cloud models:

1. **Test the system** with sample drug images
2. **Monitor performance** and accuracy
3. **Adjust confidence thresholds** as needed
4. **Set up monitoring** for API usage
5. **Configure alerts** for service failures
