# Environment Configuration Guide

## Required Environment Variables

Create a `.env.local` file in the project root with the following configuration:

```bash
# =============================================================================
# CORE APPLICATION SETTINGS
# =============================================================================

# Application Environment
NODE_ENV=development

# Database Configuration
DATABASE_URL=mongodb://localhost:27017/shield-drug

# Authentication
JWT_SECRET=your_jwt_secret_here

# =============================================================================
# PHARMACEUTICAL AI SERVICES (NEW - RECOMMENDED)
# =============================================================================

# Google Cloud Vision API (Free tier: 1,000 requests/month)
# Get your API key from: https://console.cloud.google.com/apis/credentials
GOOGLE_CLOUD_API_KEY=your_google_cloud_api_key_here

# BiomedCLIP API (Microsoft's biomedical foundation model)
# Documentation: https://aka.ms/biomedclip
BIOMEDCLIP_API_URL=https://api.biomedclip.com/v1
BIOMEDCLIP_API_KEY=your_biomedclip_api_key_here

# Medical Pills Dataset API (Ultralytics)
# Documentation: https://docs.ultralytics.com/datasets/detect/medical-pills/
MEDICAL_PILLS_API_URL=https://api.ultralytics.com/v1
MEDICAL_PILLS_API_KEY=your_medical_pills_api_key_here

# =============================================================================
# BLOCKCHAIN CONFIGURATION
# =============================================================================

# Avalanche Network Configuration
AVALANCHE_RPC_URL=https://api.avax-test.network/ext/bc/C/rpc
AVALANCHE_PRIVATE_KEY=your_private_key_here
AVALANCHE_CONTRACT_ADDRESS=your_contract_address_here
AVALANCHE_CHAIN_ID=43113

# =============================================================================
# LEGACY AI SERVICES (DEPRECATED - USE PHARMACEUTICAL AI ABOVE)
# =============================================================================

# TensorFlow.js Model Configuration (Legacy)
MOBILENET_MODEL_URL=https://tfhub.dev/google/imagenet/mobilenet_v2_100_224/classification/2
TENSORFLOW_BACKEND=node
AI_MODEL_TIMEOUT=30000
AI_FALLBACK_MODE=auto
AI_API_LEGACY_FORMAT=false

# Legacy AI Services (Optional - for backward compatibility)
HUGGINGFACE_API_KEY=your_huggingface_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
AZURE_VISION_API_KEY=your_azure_vision_api_key_here
AZURE_VISION_ENDPOINT=https://your-resource.cognitiveservices.azure.com/
AWS_ACCESS_KEY_ID=your_aws_access_key_here
AWS_SECRET_ACCESS_KEY=your_aws_secret_key_here
AWS_REGION=us-east-1
```

## Setup Instructions

### 1. Google Cloud Vision API (Required)
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Vision API
4. Create credentials (API Key)
5. Add the API key to your `.env.local` file

### 2. BiomedCLIP API (Optional)
1. Visit [BiomedCLIP Documentation](https://aka.ms/biomedclip)
2. Request API access from Microsoft
3. Add API credentials to your `.env.local` file

### 3. Medical Pills API (Optional)
1. Visit [Ultralytics Documentation](https://docs.ultralytics.com/datasets/detect/medical-pills/)
2. Sign up for API access
3. Add API credentials to your `.env.local` file

## Priority Configuration

**Essential for basic functionality:**
- `GOOGLE_CLOUD_API_KEY` - Required for OCR text extraction

**Recommended for enhanced functionality:**
- `BIOMEDCLIP_API_KEY` - For pharmaceutical image classification
- `MEDICAL_PILLS_API_KEY` - For pill detection

**Optional:**
- Legacy AI services (for backward compatibility)
- Blockchain configuration (for verification features)
