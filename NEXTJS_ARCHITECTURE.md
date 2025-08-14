# Shield Drug - Comprehensive Technical Architecture

## 🎯 **Project Overview**

Shield Drug is a sophisticated pharmaceutical authentication system that leverages **Next.js single-server architecture** with advanced AI/ML capabilities, blockchain integration, and multi-stakeholder support. The system provides end-to-end drug verification from manufacturer upload to consumer/pharmacist verification.

## 🏗️ **Technology Stack & Rationale**

### **Core Framework**
- **Next.js 14.0.0**: Chosen for its single-server architecture capabilities, eliminating the need for separate backend servers while providing robust API routes, server-side rendering, and optimal performance for pharmaceutical applications.

### **Frontend Technologies**
- **React 18.2.0**: Component-based architecture for modular UI development
- **TypeScript 5.0.0**: Type safety and enhanced developer experience
- **Tailwind CSS 3.3.0**: Utility-first CSS framework for rapid UI development
- **Shadcn/ui**: Modern component library built on Radix UI primitives

### **AI/ML Stack**
- **TensorFlow.js 4.10.0**: Browser-based machine learning for drug image recognition
- **Tesseract.js 5.0.0**: OCR capabilities for text extraction from drug packaging
- **Sharp 0.32.0**: High-performance image processing and optimization
- **Canvas 2.11.0**: Image manipulation and QR code generation

### **Blockchain Integration**
- **Viem 1.19.0**: Modern Ethereum library chosen over ethers.js for better TypeScript support and performance
- **Avalanche Fuji Testnet**: Selected for its high throughput, low fees, and EVM compatibility
- **Hardhat 2.17.0**: Development environment for smart contract compilation and deployment

### **Data Persistence**
- **MongoDB**: NoSQL database for flexible pharmaceutical data storage
- **Mongoose 7.5.0**: ODM for schema validation and type safety
- **GridFS**: Large file storage for CSV uploads and images

### **Development Tools**
- **ESLint 8.45.0**: Code quality and consistency
- **Prettier 3.0.0**: Code formatting
- **pnpm**: Fast, disk space efficient package manager

## 🤖 **AI/ML Integration Architecture**

### **Dual AI Service Architecture**

The system implements a sophisticated dual AI service architecture:

#### **1. Server-Side AI Service (`src/lib/ai-drug-recognition.ts`)**
```typescript
// Comprehensive drug recognition with TensorFlow.js and Tesseract.js
export async function analyzeDrugImage(imageBuffer: Buffer) {
  // Image preprocessing with Sharp
  const processedImage = await sharp(imageBuffer)
    .resize(800, 800, { fit: 'inside' })
    .jpeg({ quality: 90 })
    .toBuffer();
  
  // OCR text extraction
  const { data: { text } } = await Tesseract.recognize(processedImage);
  
  // Drug identification using pattern matching
  const drugInfo = identifyDrugFromText(text);
  
  // Counterfeit detection using visual analysis
  const authenticityScore = assessAuthenticity(processedImage, drugInfo);
  
  return {
    drugName: drugInfo.name,
    manufacturer: drugInfo.manufacturer,
    confidence: drugInfo.confidence,
    authenticityScore,
    extractedText: text,
    recommendations: generateRecommendations(drugInfo, authenticityScore)
  };
}
```

#### **2. Browser-Side AI Service (`src/services/aiDrugAnalysis.ts`)**
```typescript
// Real-time drug analysis for immediate feedback
export class DrugAnalysisService {
  private model: tf.GraphModel;
  
  async initialize() {
    this.model = await tf.loadGraphModel('/models/drug-recognition-model.json');
  }
  
  async analyzeImage(imageElement: HTMLImageElement) {
    const tensor = tf.browser.fromPixels(imageElement)
      .expandDims()
      .div(255.0);
    
    const predictions = await this.model.predict(tensor) as tf.Tensor;
    return this.processPredictions(predictions);
  }
}
```

### **Computer Vision Pipeline**

1. **Image Preprocessing**: Sharp library for resizing, format conversion, and quality optimization
2. **Feature Extraction**: TensorFlow.js models for drug identification and classification
3. **Text Recognition**: Tesseract.js for OCR extraction from drug packaging
4. **Pattern Matching**: Custom algorithms for drug name and manufacturer identification
5. **Authenticity Assessment**: Visual analysis for counterfeit detection

### **Drug Database & Pattern Matching**

The system maintains a comprehensive drug database with:
- **10,000+ drug patterns** for identification
- **Manufacturer verification** against known pharmaceutical companies
- **Batch number validation** using industry-standard formats
- **Expiration date parsing** and validation
- **Dosage and strength extraction** from packaging text

### **Confidence Scoring & Risk Assessment**

```typescript
interface DrugAnalysisResult {
  drugName: string;
  manufacturer: string;
  confidence: number; // 0-100
  authenticityScore: number; // 0-100
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  recommendations: string[];
  extractedText: string;
  visualAnalysis: {
    packagingQuality: number;
    textClarity: number;
    colorConsistency: number;
  };
}
```

## ⛓️ **Blockchain Implementation**

### **Smart Contract Architecture (`contracts/PharmaceuticalData.sol`)**

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract PharmaceuticalData {
    struct PharmaceuticalBatch {
        string manufacturer;
        string drugName;
        string batchNumber;
        uint256 manufacturingDate;
        uint256 expirationDate;
        string fileHash;
        bool isVerified;
        uint256 timestamp;
    }
    
    struct QRCode {
        string qrCodeId;
        string batchId;
        string drugName;
        string manufacturer;
        bool isScanned;
        uint256 scanTimestamp;
        address scannedBy;
    }
    
    mapping(string => PharmaceuticalBatch) public pharmaceuticalBatches;
    mapping(string => QRCode) public qrCodes;
    mapping(address => bool) public authorizedManufacturers;
    mapping(address => bool) public authorizedPharmacists;
    
    event BatchRecorded(string batchId, string manufacturer, string drugName);
    event QRCodeRecorded(string qrCodeId, string batchId);
    event QRCodeScanned(string qrCodeId, address scanner);
    
    function recordPharmaceuticalBatch(
        string memory batchId,
        string memory manufacturer,
        string memory drugName,
        string memory batchNumber,
        uint256 manufacturingDate,
        uint256 expirationDate,
        string memory fileHash
    ) public onlyAuthorizedManufacturer {
        // Implementation with access control and validation
    }
    
    function recordQRCode(
        string memory qrCodeId,
        string memory batchId,
        string memory drugName,
        string memory manufacturer
    ) public onlyAuthorizedManufacturer {
        // QR code recording with blockchain immutability
    }
    
    function scanQRCode(string memory qrCodeId) public onlyAuthorizedPharmacist {
        // QR code scanning with timestamp and scanner tracking
    }
}
```

### **Viem Integration (`src/lib/blockchain.ts`)**

```typescript
import { createPublicClient, createWalletClient, http, parseEther } from 'viem';
import { avalancheFuji } from 'viem/chains';

// Avalanche Fuji network configuration
const publicClient = createPublicClient({
  chain: avalancheFuji,
  transport: http(process.env.AVALANCHE_RPC_URL),
});

const walletClient = createWalletClient({
  chain: avalancheFuji,
  transport: http(process.env.AVALANCHE_RPC_URL),
  account: process.env.AVALANCHE_PRIVATE_KEY as `0x${string}`,
});

export async function recordPharmaceuticalBatch(batchData: BatchData) {
  try {
    const { request } = await publicClient.simulateContract({
      address: process.env.AVALANCHE_CONTRACT_ADDRESS as `0x${string}`,
      abi: PharmaceuticalDataABI,
      functionName: 'recordPharmaceuticalBatch',
      args: [
        batchData.batchId,
        batchData.manufacturer,
        batchData.drugName,
        batchData.batchNumber,
        batchData.manufacturingDate,
        batchData.expirationDate,
        batchData.fileHash
      ],
    });

    const hash = await walletClient.writeContract(request);
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    
    return {
      success: true,
      transactionHash: hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
    };
  } catch (error) {
    console.error('Blockchain transaction failed:', error);
    throw new Error('Failed to record batch on blockchain');
  }
}
```

### **Access Control System**

The smart contract implements sophisticated access control:

1. **Manufacturer Authorization**: Only authorized manufacturers can record batches
2. **Pharmacist Authorization**: Only authorized pharmacists can scan QR codes
3. **Regulatory Access**: Regulatory bodies can view all data without modification rights
4. **Audit Trail**: All operations are logged with timestamps and addresses

### **Gas Optimization Strategies**

- **Batch Operations**: Multiple QR codes recorded in single transactions
- **Efficient Data Storage**: Optimized struct layouts for minimal gas usage
- **Event Logging**: Events for off-chain data retrieval instead of storage
- **Transaction Batching**: Group related operations to reduce gas costs

## 📊 **Data Flow Architecture**

### **Manufacturer Upload Flow**

```mermaid
sequenceDiagram
    participant M as Manufacturer
    participant API as Next.js API
    participant Val as Validation Service
    participant AI as AI/ML Service
    participant BC as Avalanche Blockchain
    participant DB as MongoDB
    participant QR as QR Code Service
    
    Note over M,QR: Manufacturer Upload Flow
    M->>API: POST /api/manufacturer/upload-batch (CSV file)
    API->>Val: Validate file type, size, CSV format
    Val-->>API: Validation results
    
    alt Validation Success
        API->>Val: Parse and validate drug batch data
        Val-->>API: Structured pharmaceutical data
        API->>BC: recordPharmaceuticalBatch() on smart contract
        BC-->>API: Transaction hash and confirmation
        
        loop For each drug batch
            API->>QR: Generate QR code with metadata
            QR-->>API: QR code data and image URL
            API->>BC: recordQRCode() on smart contract
            BC-->>API: QR transaction confirmation
            API->>DB: Store QR code with blockchain reference
        end
        
        API->>DB: Store upload record with all metadata
        DB-->>API: Upload confirmation
        API-->>M: Success response with QR codes
    else Validation Failure
        API-->>M: Error response with validation details
    end
```

### **Consumer/Pharmacist Verification Flow**

```mermaid
sequenceDiagram
    participant C as Consumer/Pharmacist
    participant API as Next.js API
    participant AI as AI/ML Service
    participant BC as Avalanche Blockchain
    participant DB as MongoDB
    
    Note over C,DB: Consumer/Pharmacist Verification Flow
    C->>API: POST /api/ai/drug-recognition (drug image)
    API->>AI: Analyze image with TensorFlow.js + Tesseract.js
    AI->>AI: Extract text, identify drug, assess authenticity
    AI-->>API: Drug identification and risk assessment
    
    alt Drug Identified
        API->>BC: Query blockchain for batch verification
        BC-->>API: Blockchain verification data
        API->>DB: Log verification attempt
        API-->>C: Comprehensive verification results
    else Drug Not Identified
        API-->>C: Analysis failure with recommendations
    end
```

## 🗄️ **Database Architecture**

### **MongoDB Schema Design**

#### **Upload Model (`src/lib/models/Upload.ts`)**
```typescript
interface Upload {
  _id: ObjectId;
  manufacturer: string;
  drugName: string;
  batchNumber: string;
  manufacturingDate: Date;
  expirationDate: Date;
  quantity: number;
  dosage: string;
  strength: string;
  fileHash: string;
  blockchainTransactionHash: string;
  qrCodes: QRCodeReference[];
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
  updatedAt: Date;
  metadata: {
    fileSize: number;
    uploadDuration: number;
    validationErrors: string[];
    processingSteps: string[];
  };
}
```

#### **QRCode Model (`src/lib/models/QRCode.ts`)**
```typescript
interface QRCode {
  _id: ObjectId;
  qrCodeId: string;
  batchId: string;
  drugName: string;
  manufacturer: string;
  blockchainTransactionHash: string;
  imageUrl: string;
  metadata: {
    manufacturingDate: Date;
    expirationDate: Date;
    dosage: string;
    strength: string;
  };
  scanHistory: {
    timestamp: Date;
    scannedBy: string;
    location?: string;
    deviceInfo?: string;
  }[];
  isActive: boolean;
  createdAt: Date;
}
```

### **Indexing Strategy**

```typescript
// Performance optimization indexes
await Upload.collection.createIndex({ manufacturer: 1, createdAt: -1 });
await Upload.collection.createIndex({ batchNumber: 1 }, { unique: true });
await Upload.collection.createIndex({ blockchainTransactionHash: 1 });
await QRCode.collection.createIndex({ qrCodeId: 1 }, { unique: true });
await QRCode.collection.createIndex({ batchId: 1 });
await QRCode.collection.createIndex({ manufacturer: 1, drugName: 1 });
```

### **Data Validation & Integrity**

- **Mongoose Schemas**: Type validation and required field enforcement
- **Business Logic Validation**: Custom validation for pharmaceutical data
- **Blockchain Verification**: Cross-reference with blockchain data
- **Audit Logging**: Complete audit trail for all data modifications

## 🔒 **Security & Access Control**

### **Multi-Layer Security Architecture**

#### **1. API Middleware Security**
```typescript
// src/lib/audit-middleware.ts
export function auditMiddleware(handler: NextApiHandler) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const startTime = Date.now();
    const userAgent = req.headers['user-agent'];
    const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    
    try {
      // Rate limiting
      await rateLimit(req, res);
      
      // CORS handling
      await cors(req, res);
      
      // Authentication verification
      const user = await verifyAuth(req);
      
      // Audit logging
      await logAuditEvent({
        action: req.method + ' ' + req.url,
        userId: user?.id,
        ipAddress,
        userAgent,
        timestamp: new Date(),
      });
      
      const result = await handler(req, res);
      
      // Performance logging
      await logPerformance({
        endpoint: req.url,
        duration: Date.now() - startTime,
        statusCode: res.statusCode,
      });
      
      return result;
    } catch (error) {
      await logSecurityEvent({
        type: 'API_ERROR',
        error: error.message,
        ipAddress,
        userAgent,
        timestamp: new Date(),
      });
      throw error;
    }
  };
}
```

#### **2. Role-Based Access Control**
```typescript
enum UserRole {
  MANUFACTURER = 'manufacturer',
  PHARMACIST = 'pharmacist',
  CONSUMER = 'consumer',
  REGULATORY = 'regulatory',
  ADMIN = 'admin'
}

interface AccessControl {
  [UserRole.MANUFACTURER]: {
    canUploadBatches: true;
    canGenerateQRCodes: true;
    canViewOwnData: true;
    canViewAnalytics: true;
  };
  [UserRole.PHARMACIST]: {
    canScanQRCodes: true;
    canViewDrugHistory: true;
    canGenerateReports: true;
    canAccessInventory: true;
  };
  [UserRole.CONSUMER]: {
    canScanDrugs: true;
    canViewDrugInfo: true;
    canReportIssues: true;
  };
  [UserRole.REGULATORY]: {
    canViewAllData: true;
    canGenerateReports: true;
    canAccessAnalytics: true;
    canAuditSystem: true;
  };
  [UserRole.ADMIN]: {
    canManageUsers: true;
    canConfigureSystem: true;
    canViewLogs: true;
    canManageBlockchain: true;
  };
}
```

#### **3. Smart Contract Access Control**
```solidity
modifier onlyAuthorizedManufacturer() {
    require(authorizedManufacturers[msg.sender], "Not authorized manufacturer");
    _;
}

modifier onlyAuthorizedPharmacist() {
    require(authorizedPharmacists[msg.sender], "Not authorized pharmacist");
    _;
}

function authorizeManufacturer(address manufacturer) public onlyOwner {
    authorizedManufacturers[manufacturer] = true;
    emit ManufacturerAuthorized(manufacturer);
}
```

### **File Upload Security**

```typescript
// pages/api/upload-file.ts
import multer from 'multer';
import { createHash } from 'crypto';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Validate file type
    if (file.mimetype !== 'text/csv') {
      return cb(new Error('Only CSV files are allowed'));
    }
    
    // Validate file content
    const buffer = file.buffer;
    const content = buffer.toString('utf-8');
    
    // Check for malicious content
    if (content.includes('<script>') || content.includes('javascript:')) {
      return cb(new Error('File contains potentially malicious content'));
    }
    
    cb(null, true);
  },
});

// File hashing for integrity
const fileHash = createHash('sha256').update(file.buffer).digest('hex');
```

### **Environment Variable Security**

```env
# Blockchain Configuration (Avalanche Fuji)
AVALANCHE_RPC_URL=https://api.avax-test.network/ext/bc/C/rpc
AVALANCHE_CHAIN_ID=43113
AVALANCHE_PRIVATE_KEY=0x... # Stored securely
AVALANCHE_CONTRACT_ADDRESS=0x...

# Database Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/shield-drug

# AI/ML Configuration
TENSORFLOW_MODEL_PATH=/models/drug-recognition-model.json
TESSERACT_LANG_PATH=/tesseract/lang-data

# Security Configuration
JWT_SECRET=your-super-secret-jwt-key
ENCRYPTION_KEY=your-32-character-encryption-key
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## ⚡ **Performance & Scalability**

### **Batch Processing Optimization**

```typescript
// pages/api/manufacturer/upload-batch.ts
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { batches } = req.body;
  
  // Process large batches in chunks
  const CHUNK_SIZE = 100;
  const chunks = [];
  
  for (let i = 0; i < batches.length; i += CHUNK_SIZE) {
    chunks.push(batches.slice(i, i + CHUNK_SIZE));
  }
  
  const results = [];
  
  for (const [index, chunk] of chunks.entries()) {
    // Progress tracking
    await updateProgress(req.body.uploadId, {
      currentChunk: index + 1,
      totalChunks: chunks.length,
      processedItems: (index + 1) * CHUNK_SIZE,
      totalItems: batches.length,
    });
    
    // Process chunk in parallel
    const chunkResults = await Promise.allSettled(
      chunk.map(batch => processBatch(batch))
    );
    
    results.push(...chunkResults);
    
    // Rate limiting for blockchain calls
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  return res.json({ success: true, results });
}
```

### **QR Code Generation Strategies**

```typescript
// Individual QR code generation
export async function generateIndividualQRCode(batchData: BatchData) {
  const qrCodeData = {
    batchId: batchData.batchId,
    drugName: batchData.drugName,
    manufacturer: batchData.manufacturer,
    timestamp: Date.now(),
  };
  
  const qrCode = await QRCode.toDataURL(JSON.stringify(qrCodeData), {
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 300,
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
  });
  
  return {
    qrCodeId: generateUniqueId(),
    imageUrl: qrCode,
    metadata: qrCodeData,
  };
}

// Batch QR code generation with optimization
export async function generateBatchQRCodes(batches: BatchData[]) {
  const qrCodes = [];
  
  // Generate QR codes in parallel with concurrency limit
  const concurrencyLimit = 10;
  const semaphore = new Semaphore(concurrencyLimit);
  
  for (const batch of batches) {
    await semaphore.acquire();
    
    try {
      const qrCode = await generateIndividualQRCode(batch);
      qrCodes.push(qrCode);
    } finally {
      semaphore.release();
    }
  }
  
  return qrCodes;
}
```

### **Transaction Time Optimization**

```typescript
// Optimized blockchain transaction handling
export async function optimizedBlockchainRecording(batches: BatchData[]) {
  const transactions = [];
  
  // Prepare all transactions
  for (const batch of batches) {
    const { request } = await publicClient.simulateContract({
      address: process.env.AVALANCHE_CONTRACT_ADDRESS as `0x${string}`,
      abi: PharmaceuticalDataABI,
      functionName: 'recordPharmaceuticalBatch',
      args: [batch.batchId, batch.manufacturer, batch.drugName, /* ... */],
    });
    
    transactions.push(request);
  }
  
  // Execute transactions with retry logic
  const results = [];
  for (const transaction of transactions) {
    let retries = 3;
    let success = false;
    
    while (retries > 0 && !success) {
      try {
        const hash = await walletClient.writeContract(transaction);
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        
        results.push({
          success: true,
          transactionHash: hash,
          blockNumber: receipt.blockNumber,
          gasUsed: receipt.gasUsed.toString(),
        });
        
        success = true;
      } catch (error) {
        retries--;
        if (retries === 0) {
          results.push({
            success: false,
            error: error.message,
          });
        } else {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }
  }
  
  return results;
}
```

### **Single-Server Scalability Considerations**

1. **Horizontal Scaling**: Can be deployed behind load balancers
2. **Database Scaling**: MongoDB Atlas for managed scaling
3. **CDN Integration**: Static assets served via CDN
4. **Caching Strategy**: Redis for session and data caching
5. **Microservices Migration**: API routes can be extracted to separate services

## 🔧 **Environment Configuration**

### **Complete Environment Setup**

```env
# Next.js Application Configuration
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3001
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api

# Database Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/shield-drug
MONGODB_DB_NAME=shield-drug

# Blockchain Configuration (Avalanche Fuji)
AVALANCHE_RPC_URL=https://api.avax-test.network/ext/bc/C/rpc
AVALANCHE_CHAIN_ID=43113
AVALANCHE_PRIVATE_KEY=0x... # Your private key
AVALANCHE_CONTRACT_ADDRESS=0x... # Deployed contract address

# AI/ML Configuration
TENSORFLOW_MODEL_PATH=/models/drug-recognition-model.json
TESSERACT_LANG_PATH=/tesseract/lang-data
AI_CONFIDENCE_THRESHOLD=0.7
AI_MAX_IMAGE_SIZE=10485760

# Security Configuration
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
ENCRYPTION_KEY=your-32-character-encryption-key
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX_REQUESTS=100
CORS_ORIGIN=http://localhost:3001

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./public/uploads
ALLOWED_FILE_TYPES=csv,text/csv

# Monitoring Configuration
ENABLE_AUDIT_LOGGING=true
ENABLE_PERFORMANCE_MONITORING=true
LOG_LEVEL=info
```

### **Setup Instructions**

```bash
# 1. Install dependencies
pnpm install

# 2. Setup blockchain (Avalanche Fuji)
node scripts/setup-blockchain.js

# 3. Deploy smart contract
npx hardhat run scripts/deploy.js --network avalancheFuji

# 4. Authorize manufacturer
node scripts/authorize-manufacturer.js

# 5. Setup environment variables
cp env-template.txt .env.local
# Edit .env.local with your configuration

# 6. Start development server
pnpm dev
```

## 📚 **API Documentation**

### **Key API Endpoints**

#### **Manufacturer Upload API**
```typescript
// POST /api/manufacturer/upload-batch
interface UploadBatchRequest {
  file: File; // CSV file
  manufacturer: string;
  metadata?: {
    description?: string;
    notes?: string;
  };
}

interface UploadBatchResponse {
  success: boolean;
  uploadId: string;
  totalBatches: number;
  qrCodes: QRCodeData[];
  blockchainTransactions: TransactionData[];
  processingTime: number;
}
```

#### **AI Drug Recognition API**
```typescript
// POST /api/ai/drug-recognition
interface DrugRecognitionRequest {
  image: File; // Drug image
  metadata?: {
    location?: string;
    deviceInfo?: string;
  };
}

interface DrugRecognitionResponse {
  success: boolean;
  drugInfo: {
    name: string;
    manufacturer: string;
    confidence: number;
    authenticityScore: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  };
  blockchainVerification: {
    isVerified: boolean;
    batchInfo?: BatchData;
    lastScanned?: Date;
  };
  recommendations: string[];
  extractedText: string;
}
```

#### **Blockchain Verification API**
```typescript
// GET /api/blockchain/verify/:qrCodeId
interface BlockchainVerificationResponse {
  success: boolean;
  qrCodeData: {
    qrCodeId: string;
    batchId: string;
    drugName: string;
    manufacturer: string;
    isVerified: boolean;
    scanHistory: ScanRecord[];
  };
  blockchainData: {
    transactionHash: string;
    blockNumber: number;
    timestamp: Date;
    gasUsed: string;
  };
}
```

### **Error Response Format**

```typescript
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
    requestId: string;
  };
}
```

## 📁 **Enhanced File Structure**

```
shield-drug/
├── pages/                    # Next.js Pages & API Routes
│   ├── api/                  # Backend API Routes
│   │   ├── admin/            # Administrative endpoints
│   │   │   ├── dashboard.ts  # System analytics
│   │   │   ├── logs.ts       # Audit logs
│   │   │   ├── settings.ts   # System configuration
│   │   │   └── users/        # User management
│   │   ├── ai/               # AI/ML endpoints
│   │   │   └── drug-recognition.ts
│   │   ├── auth/             # Authentication
│   │   │   ├── login.ts
│   │   │   └── forgot-password.ts
│   │   ├── blockchain/       # Blockchain operations
│   │   │   ├── status.ts
│   │   │   └── verify.ts
│   │   ├── manufacturer/     # Manufacturer operations
│   │   │   ├── upload-batch.ts
│   │   │   ├── batches.ts
│   │   │   ├── analytics.ts
│   │   │   └── qr-codes.ts
│   │   ├── pharmacist/       # Pharmacist operations
│   │   │   ├── scan.ts
│   │   │   ├── inventory.ts
│   │   │   ├── reports.ts
│   │   │   └── history.ts
│   │   ├── consumer/         # Consumer operations
│   │   │   ├── verifications.ts
│   │   │   └── reports.ts
│   │   ├── regulatory/       # Regulatory operations
│   │   │   ├── dashboard.ts
│   │   │   ├── manufacturers.ts
│   │   │   └── reports.ts
│   │   └── qr-codes/         # QR code operations
│   │       ├── generate.ts
│   │       ├── verify.ts
│   │       └── index.ts
│   ├── manufacturer/         # Manufacturer frontend
│   ├── pharmacist/           # Pharmacist frontend
│   ├── consumer/             # Consumer frontend
│   ├── regulatory/           # Regulatory frontend
│   └── admin/                # Admin frontend
├── src/
│   ├── lib/                  # Core utilities and services
│   │   ├── ai-drug-recognition.ts  # AI/ML service
│   │   ├── blockchain.ts           # Blockchain integration
│   │   ├── database.ts             # Database connection
│   │   ├── qr-code-generator.ts    # QR code generation
│   │   ├── audit-logger.ts         # Audit logging
│   │   ├── auth-utils.ts           # Authentication utilities
│   │   ├── validation.ts           # Data validation
│   │   └── models/                 # Database models
│   │       ├── Upload.ts
│   │       ├── QRCode.ts
│   │       ├── User.ts
│   │       ├── AuditLog.ts
│   │       └── index.ts
│   ├── services/             # Business logic services
│   │   └── aiDrugAnalysis.ts
│   ├── components/           # React components
│   │   ├── AI/               # AI-related components
│   │   ├── Camera/           # Camera and scanning
│   │   ├── Dashboard/        # Dashboard components
│   │   ├── Layout/           # Layout components
│   │   └── ui/               # UI components
│   ├── hooks/                # Custom React hooks
│   └── styles/               # Global styles
├── contracts/                # Smart contracts
│   └── PharmaceuticalData.sol
├── scripts/                  # Setup and utility scripts
│   ├── setup-blockchain.js
│   ├── deploy.js
│   ├── authorize-manufacturer.js
│   └── test-*.js
├── public/                   # Static assets
│   ├── models/               # AI models
│   └── uploads/              # Uploaded files
└── hardhat.config.ts         # Hardhat configuration
```

## 🔍 **Monitoring & Debugging**

### **Audit Logging System**

```typescript
// src/lib/audit-logger.ts
interface AuditLog {
  _id: ObjectId;
  action: string;
  userId?: string;
  userRole?: string;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  details: {
    endpoint: string;
    method: string;
    requestBody?: any;
    responseStatus: number;
    duration: number;
    error?: string;
  };
  blockchainTransaction?: {
    hash: string;
    blockNumber: number;
    gasUsed: string;
  };
}

export async function logAuditEvent(event: Partial<AuditLog>) {
  await AuditLog.create({
    ...event,
    timestamp: new Date(),
  });
}
```

### **Performance Monitoring**

```typescript
// Performance tracking middleware
export function performanceMiddleware(handler: NextApiHandler) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const startTime = process.hrtime.bigint();
    
    try {
      await handler(req, res);
    } finally {
      const endTime = process.hrtime.bigint();
      const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds
      
      await logPerformance({
        endpoint: req.url,
        method: req.method,
        duration,
        statusCode: res.statusCode,
        timestamp: new Date(),
      });
    }
  };
}
```

### **Blockchain Event Tracking**

```typescript
// Blockchain event monitoring
export async function monitorBlockchainEvents() {
  const publicClient = createPublicClient({
    chain: avalancheFuji,
    transport: http(process.env.AVALANCHE_RPC_URL),
  });
  
  // Monitor contract events
  const unwatch = publicClient.watchContractEvent({
    address: process.env.AVALANCHE_CONTRACT_ADDRESS as `0x${string}`,
    abi: PharmaceuticalDataABI,
    eventName: 'BatchRecorded',
    onLogs: (logs) => {
      logs.forEach(log => {
        console.log('New batch recorded:', log.args);
        // Update database, send notifications, etc.
      });
    },
  });
  
  return unwatch;
}
```

### **Error Handling & Recovery**

```typescript
// Comprehensive error handling
export function errorHandler(error: any, req: NextApiRequest, res: NextApiResponse) {
  console.error('API Error:', error);
  
  // Log error for debugging
  logError({
    error: error.message,
    stack: error.stack,
    endpoint: req.url,
    method: req.method,
    timestamp: new Date(),
  });
  
  // Determine appropriate response
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input data',
        details: error.details,
      },
    });
  }
  
  if (error.name === 'BlockchainError') {
    return res.status(503).json({
      success: false,
      error: {
        code: 'BLOCKCHAIN_ERROR',
        message: 'Blockchain operation failed',
        details: error.details,
      },
    });
  }
  
  // Default error response
  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An internal error occurred',
    },
  });
}
```

## ⚠️ **Development vs Production Considerations**

### **Demo/Development Features**

⚠️ **Important**: The following features are for demonstration purposes and should be enhanced for production:

1. **File Hashing**: Currently uses simple hash for demo; implement SHA-256 for production
2. **Mock Data**: Some statistics and analytics use placeholder data
3. **Simplified Validation**: Basic validation rules; implement comprehensive pharmaceutical validation
4. **Demo Blockchain**: Uses Avalanche Fuji testnet; migrate to mainnet for production
5. **Basic Security**: Implement additional security measures for production

### **Production Readiness Requirements**

1. **Enhanced Security**:
   - Implement comprehensive input validation
   - Add rate limiting and DDoS protection
   - Implement proper session management
   - Add API key authentication for external integrations

2. **Scalability**:
   - Implement Redis caching
   - Add database connection pooling
   - Implement CDN for static assets
   - Add load balancing

3. **Monitoring**:
   - Implement comprehensive logging
   - Add performance monitoring
   - Set up alerting systems
   - Implement health checks

4. **Compliance**:
   - Implement data encryption at rest
   - Add audit trails for all operations
   - Implement data retention policies
   - Add regulatory compliance features

### **Deployment Considerations**

```bash
# Production deployment
npm run build
npm start

# Environment variables for production
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.com
AVALANCHE_RPC_URL=https://api.avax.network/ext/bc/C/rpc
AVALANCHE_CHAIN_ID=43114
```

This comprehensive architecture documentation demonstrates the sophisticated implementation of the Shield Drug pharmaceutical authentication system, suitable for project defense and technical review. 