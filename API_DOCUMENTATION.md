# Shield Drug Platform API Documentation

## Overview

The Shield Drug Platform provides a comprehensive API for pharmaceutical supply chain management, drug verification, and regulatory compliance. This API serves multiple stakeholders including manufacturers, pharmacists, consumers, regulatory bodies, and system administrators.

## Table of Contents

1. [Authentication & Authorization](#authentication--authorization)
2. [Manufacturer API Endpoints](#manufacturer-api-endpoints)
3. [Pharmacist API Endpoints](#pharmacist-api-endpoints)
4. [Consumer API Endpoints](#consumer-api-endpoints)
5. [Regulatory API Endpoints](#regulatory-api-endpoints)
6. [Admin API Endpoints](#admin-api-endpoints)
7. [Blockchain API Endpoints](#blockchain-api-endpoints)
8. [AI/ML API Endpoints](#aiml-api-endpoints)
9. [QR Code API Endpoints](#qr-code-api-endpoints)
10. [Authentication API Endpoints](#authentication-api-endpoints)
11. [Error Handling & Status Codes](#error-handling--status-codes)
12. [Data Models & Schemas](#data-models--schemas)
13. [Integration Guidelines](#integration-guidelines)

## Authentication & Authorization

### Header-Based Authentication

The Shield Drug Platform uses a custom header-based authentication system for API access.

#### Required Headers
- `x-user-role`: User role (manufacturer, pharmacist, consumer, regulatory, admin)
- `x-user-email`: User email address for identification

#### Example Request
```javascript
const response = await fetch('/api/manufacturer/dashboard', {
  headers: {
    'x-user-role': 'manufacturer',
    'x-user-email': 'manufacturer@example.com',
    'Content-Type': 'application/json'
  }
});
```

#### Role-Based Access Control

| Role | Access Level | Description |
|------|-------------|-------------|
| `manufacturer` | Manufacturer endpoints | Upload batches, manage QR codes, view analytics |
| `pharmacist` | Pharmacist endpoints | Scan QR codes, verify drugs, manage inventory |
| `consumer` | Consumer endpoints | Verify drug authenticity, report counterfeits |
| `regulatory` | Regulatory endpoints | Monitor compliance, view audit trails |
| `admin` | Admin endpoints | User management, system administration |

#### Authentication Error Responses

```json
{
  "error": "Authentication required",
  "code": "AUTH_REQUIRED",
  "status": 401
}
```

```json
{
  "error": "Insufficient permissions",
  "code": "INSUFFICIENT_PERMISSIONS",
  "status": 403
}
```

## Manufacturer API Endpoints

### Upload Batch

**Endpoint**: `POST /api/manufacturer/upload-batch`

**Description**: Upload a CSV file containing drug batch information for processing and QR code generation.

**Headers**:
- `x-user-role`: manufacturer
- `x-user-email`: manufacturer email
- `Content-Type`: multipart/form-data

**Request Body**:
- `file`: CSV file (max 10MB)
- `manufacturer`: Manufacturer name
- `batchId`: Batch identifier

**Response**:
```json
{
  "success": true,
  "uploadId": "upload_123456789",
  "progressUrl": "/api/manufacturer/upload-progress/upload_123456789",
  "estimatedTime": "5-10 minutes",
  "message": "Upload started successfully"
}
```

**Error Response**:
```json
{
  "error": "File validation failed",
  "details": [
    {
      "row": 5,
      "column": "nafdac_number",
      "message": "Invalid NAFDAC number format",
      "value": "NAFDAC-12345"
    }
  ],
  "status": 400
}
```

### Upload Progress

**Endpoint**: `GET /api/manufacturer/upload-progress/{uploadId}`

**Description**: Get real-time progress of batch upload processing.

**Response**:
```json
{
  "uploadId": "upload_123456789",
  "status": "processing",
  "progress": 65,
  "stage": "qr_generation",
  "estimatedCompletion": "2024-01-15T11:30:00Z",
  "processedRows": 6500,
  "totalRows": 10000,
  "errors": [],
  "warnings": []
}
```

### Dashboard

**Endpoint**: `GET /api/manufacturer/dashboard`

**Description**: Get manufacturer dashboard data including upload statistics and recent activity.

**Response**:
```json
{
  "totalBatches": 150,
  "totalUnits": 2500000,
  "activeBatches": 45,
  "recentUploads": [
    {
      "batchId": "CT2024001",
      "drugName": "Coartem",
      "quantity": 10000,
      "uploadDate": "2024-01-15T10:30:00Z",
      "status": "completed"
    }
  ],
  "monthlyStats": {
    "uploads": 25,
    "units": 500000,
    "verifications": 15000
  }
}
```

### Batch Details

**Endpoint**: `GET /api/manufacturer/batches/{batchId}`

**Description**: Get detailed information about a specific batch.

**Response**:
```json
{
  "batchId": "CT2024001",
  "drugName": "Coartem",
  "manufacturer": "Novartis",
  "quantity": 10000,
  "uploadDate": "2024-01-15T10:30:00Z",
  "status": "completed",
  "qrCodesGenerated": 10000,
  "blockchainTx": "0x1234567890abcdef...",
  "verificationCount": 1500,
  "authenticityRate": 99.8
}
```

### QR Codes

**Endpoint**: `GET /api/manufacturer/qr-codes?batchId={batchId}`

**Description**: Get QR codes for a specific batch.

**Response**:
```json
{
  "batchId": "CT2024001",
  "qrCodes": [
    {
      "qrCodeId": "QR_CT2024001_001",
      "serialNumber": 1,
      "qrCodeUrl": "https://api.shielddrug.com/qr/QR_CT2024001_001",
      "downloadUrl": "https://api.shielddrug.com/qr/QR_CT2024001_001/download"
    }
  ],
  "totalCodes": 10000
}
```

### Analytics

**Endpoint**: `GET /api/manufacturer/analytics`

**Description**: Get comprehensive analytics data for the manufacturer.

**Query Parameters**:
- `startDate`: Start date (YYYY-MM-DD)
- `endDate`: End date (YYYY-MM-DD)
- `drugName`: Filter by drug name

**Response**:
```json
{
  "uploadTrends": [
    {
      "date": "2024-01-15",
      "batches": 5,
      "units": 100000
    }
  ],
  "verificationStats": {
    "totalVerifications": 50000,
    "authenticRate": 99.5,
    "counterfeitReports": 25
  },
  "topDrugs": [
    {
      "drugName": "Coartem",
      "totalUnits": 500000,
      "verificationCount": 15000
    }
  ]
}
```

## Pharmacist API Endpoints

### Scan QR Code

**Endpoint**: `POST /api/pharmacist/scan`

**Description**: Scan and verify a QR code to authenticate a drug.

**Request Body**:
```json
{
  "qrCodeId": "QR_CT2024001_001",
  "location": "Pharmacy XYZ, Lagos",
  "notes": "Optional verification notes"
}
```

**Response**:
```json
{
  "success": true,
  "authentic": true,
  "drugInfo": {
    "drugName": "Coartem",
    "manufacturer": "Novartis",
    "batchId": "CT2024001",
    "expiryDate": "2025-12-31",
    "manufacturingDate": "2024-01-15",
    "activeIngredient": "Artemether/Lumefantrine",
    "strength": "20mg/120mg"
  },
  "verificationHistory": [
    {
      "date": "2024-01-15T14:30:00Z",
      "location": "Pharmacy XYZ, Lagos",
      "verifiedBy": "pharmacist@example.com"
    }
  ],
  "blockchainVerified": true,
  "verificationCount": 2
}
```

### Dashboard

**Endpoint**: `GET /api/pharmacist/dashboard`

**Description**: Get pharmacist dashboard with recent scans and statistics.

**Response**:
```json
{
  "totalScans": 1500,
  "authenticScans": 1495,
  "counterfeitReports": 5,
  "recentScans": [
    {
      "qrCodeId": "QR_CT2024001_001",
      "drugName": "Coartem",
      "scanDate": "2024-01-15T14:30:00Z",
      "authentic": true
    }
  ],
  "monthlyStats": {
    "scans": 500,
    "authenticRate": 99.7,
    "reports": 2
  }
}
```

### History

**Endpoint**: `GET /api/pharmacist/history`

**Description**: Get scan history with filtering options.

**Query Parameters**:
- `startDate`: Start date (YYYY-MM-DD)
- `endDate`: End date (YYYY-MM-DD)
- `authentic`: Filter by authenticity (true/false)
- `drugName`: Filter by drug name

**Response**:
```json
{
  "scans": [
    {
      "qrCodeId": "QR_CT2024001_001",
      "drugName": "Coartem",
      "scanDate": "2024-01-15T14:30:00Z",
      "authentic": true,
      "location": "Pharmacy XYZ, Lagos",
      "verificationCount": 2
    }
  ],
  "total": 1500,
  "page": 1,
  "limit": 50
}
```

### Reports

**Endpoint**: `GET /api/pharmacist/reports`

**Description**: Get counterfeit reports and investigation data.

**Response**:
```json
{
  "reports": [
    {
      "reportId": "REP_123456",
      "qrCodeId": "QR_CT2024001_001",
      "drugName": "Coartem",
      "reportDate": "2024-01-15T14:30:00Z",
      "status": "investigating",
      "description": "Suspicious packaging and color variation"
    }
  ],
  "totalReports": 5,
  "investigations": 3
}
```

## Consumer API Endpoints

### Verify Drug

**Endpoint**: `POST /api/consumer/verifications`

**Description**: Verify drug authenticity using QR code or manual entry.

**Request Body**:
```json
{
  "qrCodeId": "QR_CT2024001_001",
  "location": "Consumer location",
  "deviceInfo": "Mobile app v1.0"
}
```

**Response**:
```json
{
  "success": true,
  "authentic": true,
  "drugInfo": {
    "drugName": "Coartem",
    "manufacturer": "Novartis",
    "batchId": "CT2024001",
    "expiryDate": "2025-12-31",
    "activeIngredient": "Artemether/Lumefantrine",
    "strength": "20mg/120mg"
  },
  "verificationMessage": "This drug is authentic and verified on the blockchain",
  "verificationCount": 15,
  "lastVerified": "2024-01-15T14:30:00Z"
}
```

### Report Counterfeit

**Endpoint**: `POST /api/consumer/reports`

**Description**: Report suspected counterfeit drugs.

**Request Body**:
```json
{
  "qrCodeId": "QR_CT2024001_001",
  "drugName": "Coartem",
  "manufacturer": "Novartis",
  "description": "Suspicious packaging and color variation",
  "location": "Lagos, Nigeria",
  "contactInfo": "consumer@example.com"
}
```

**Response**:
```json
{
  "success": true,
  "reportId": "REP_123456",
  "status": "submitted",
  "message": "Report submitted successfully. Investigation will begin shortly."
}
```

### AI Drug Recognition

**Endpoint**: `POST /api/ai/drug-recognition`

**Description**: Analyze drug images using AI for identification and authenticity checking.

**Headers**:
- `Content-Type`: multipart/form-data

**Request Body**:
- `image`: Image file (max 10MB, formats: JPG, PNG, WEBP)
- `location`: Optional location information

**Response**:
```json
{
  "success": true,
  "analysis": {
    "drugName": "Coartem",
    "confidence": 95.5,
    "manufacturer": "Novartis",
    "activeIngredient": "Artemether/Lumefantrine",
    "strength": "20mg/120mg",
    "authentic": true,
    "authenticityScore": 92.3
  },
  "ocrText": "Coartem 20mg/120mg Artemether/Lumefantrine",
  "imageQuality": "high",
  "processingTime": "2.3s"
}
```

## Regulatory API Endpoints

### Dashboard

**Endpoint**: `GET /api/regulatory/dashboard`

**Description**: Get comprehensive regulatory oversight dashboard.

**Response**:
```json
{
  "totalManufacturers": 45,
  "totalBatches": 2500,
  "totalUnits": 50000000,
  "totalVerifications": 1500000,
  "counterfeitReports": 125,
  "investigations": 85,
  "complianceRate": 98.5,
  "recentActivity": [
    {
      "type": "batch_upload",
      "manufacturer": "Novartis",
      "batchId": "CT2024001",
      "timestamp": "2024-01-15T10:30:00Z"
    }
  ],
  "monthlyStats": {
    "uploads": 500,
    "verifications": 50000,
    "reports": 15,
    "investigations": 10
  }
}
```

### Manufacturers

**Endpoint**: `GET /api/regulatory/manufacturers`

**Description**: Get list of all registered manufacturers with compliance data.

**Response**:
```json
{
  "manufacturers": [
    {
      "name": "Novartis",
      "registrationDate": "2023-01-15T00:00:00Z",
      "totalBatches": 150,
      "totalUnits": 2500000,
      "complianceScore": 98.5,
      "activeInvestigations": 2,
      "lastActivity": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 45,
  "complianceStats": {
    "excellent": 35,
    "good": 8,
    "needsImprovement": 2
  }
}
```

### Reports

**Endpoint**: `GET /api/regulatory/reports`

**Description**: Get comprehensive regulatory reports and analytics.

**Query Parameters**:
- `startDate`: Start date (YYYY-MM-DD)
- `endDate`: End date (YYYY-MM-DD)
- `reportType`: Type of report (compliance, counterfeit, verification)

**Response**:
```json
{
  "complianceReport": {
    "totalManufacturers": 45,
    "compliantManufacturers": 43,
    "complianceRate": 95.6,
    "topViolations": [
      {
        "violation": "Expired drugs in circulation",
        "count": 15,
        "percentage": 0.03
      }
    ]
  },
  "counterfeitReport": {
    "totalReports": 125,
    "confirmedCounterfeits": 85,
    "investigationRate": 100,
    "resolutionRate": 92,
    "topDrugs": [
      {
        "drugName": "Coartem",
        "reports": 25,
        "confirmed": 18
      }
    ]
  },
  "verificationReport": {
    "totalVerifications": 1500000,
    "authenticRate": 99.5,
    "verificationTrends": [
      {
        "date": "2024-01-15",
        "verifications": 50000,
        "authenticRate": 99.7
      }
    ]
  }
}
```

## Admin API Endpoints

### Users

**Endpoint**: `GET /api/admin/users`

**Description**: Get list of all users with management capabilities.

**Query Parameters**:
- `role`: Filter by user role
- `status`: Filter by user status (active, inactive, suspended)
- `page`: Page number for pagination
- `limit`: Number of users per page

**Response**:
```json
{
  "users": [
    {
      "id": "user_123456",
      "email": "manufacturer@example.com",
      "role": "manufacturer",
      "status": "active",
      "createdDate": "2023-01-15T00:00:00Z",
      "lastLogin": "2024-01-15T10:30:00Z",
      "totalActivity": 150
    }
  ],
  "total": 250,
  "page": 1,
  "limit": 50,
  "stats": {
    "manufacturers": 45,
    "pharmacists": 150,
    "consumers": 50,
    "regulatory": 5
  }
}
```

### Create User

**Endpoint**: `POST /api/admin/users`

**Description**: Create a new user account.

**Request Body**:
```json
{
  "email": "newuser@example.com",
  "role": "manufacturer",
  "name": "New Manufacturer",
  "organization": "Pharma Corp"
}
```

**Response**:
```json
{
  "success": true,
  "userId": "user_123456",
  "message": "User created successfully"
}
```

### Update User

**Endpoint**: `PUT /api/admin/users/{userId}`

**Description**: Update user information and permissions.

**Request Body**:
```json
{
  "role": "pharmacist",
  "status": "active",
  "permissions": ["scan", "report"]
}
```

**Response**:
```json
{
  "success": true,
  "message": "User updated successfully"
}
```

### Dashboard

**Endpoint**: `GET /api/admin/dashboard`

**Description**: Get system administration dashboard.

**Response**:
```json
{
  "systemHealth": {
    "status": "healthy",
    "uptime": "99.9%",
    "lastMaintenance": "2024-01-10T02:00:00Z"
  },
  "userStats": {
    "totalUsers": 250,
    "activeUsers": 245,
    "newUsersThisMonth": 15
  },
  "systemStats": {
    "totalBatches": 2500,
    "totalVerifications": 1500000,
    "storageUsed": "75%",
    "blockchainTransactions": 50000
  },
  "recentActivity": [
    {
      "type": "user_creation",
      "user": "newuser@example.com",
      "timestamp": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### Logs

**Endpoint**: `GET /api/admin/logs`

**Description**: Get system logs and audit trails.

**Query Parameters**:
- `startDate`: Start date (YYYY-MM-DD)
- `endDate`: End date (YYYY-MM-DD)
- `level`: Log level (info, warning, error)
- `user`: Filter by user email

**Response**:
```json
{
  "logs": [
    {
      "timestamp": "2024-01-15T10:30:00Z",
      "level": "info",
      "user": "manufacturer@example.com",
      "action": "batch_upload",
      "details": "Uploaded batch CT2024001 with 10000 units",
      "ipAddress": "192.168.1.100"
    }
  ],
  "total": 15000,
  "page": 1,
  "limit": 100
}
```

## Blockchain API Endpoints

### Verify Transaction

**Endpoint**: `GET /api/blockchain/verify`

**Description**: Verify blockchain transaction and retrieve stored data.

**Query Parameters**:
- `txHash`: Blockchain transaction hash
- `batchId`: Batch identifier

**Response**:
```json
{
  "verified": true,
  "transaction": {
    "txHash": "0x1234567890abcdef...",
    "blockNumber": 12345678,
    "timestamp": "2024-01-15T10:30:00Z",
    "gasUsed": 150000,
    "status": "confirmed"
  },
  "data": {
    "batchId": "CT2024001",
    "drugName": "Coartem",
    "manufacturer": "Novartis",
    "quantity": 10000,
    "fileHash": "sha256_hash_here"
  },
  "blockchainNetwork": "Avalanche Fuji Testnet"
}
```

### Status

**Endpoint**: `GET /api/blockchain/status`

**Description**: Get blockchain network status and connection information.

**Response**:
```json
{
  "network": "Avalanche Fuji Testnet",
  "status": "connected",
  "lastBlock": 12345678,
  "gasPrice": "25000000000",
  "contractAddress": "0xabcdef1234567890...",
  "totalTransactions": 50000,
  "lastTransaction": "2024-01-15T10:30:00Z"
}
```

## AI/ML API Endpoints

### Drug Recognition

**Endpoint**: `POST /api/ai/drug-recognition`

**Description**: Analyze drug images using AI for identification and authenticity checking.

**Headers**:
- `Content-Type`: multipart/form-data

**Request Body**:
- `image`: Image file (max 10MB, formats: JPG, PNG, WEBP)
- `location`: Optional location information
- `deviceInfo`: Optional device information

**Response**:
```json
{
  "success": true,
  "analysis": {
    "drugName": "Coartem",
    "confidence": 95.5,
    "manufacturer": "Novartis",
    "activeIngredient": "Artemether/Lumefantrine",
    "strength": "20mg/120mg",
    "dosageForm": "tablet",
    "authentic": true,
    "authenticityScore": 92.3,
    "packagingScore": 88.7,
    "colorAnalysis": "consistent",
    "textAnalysis": "legible"
  },
  "ocrText": "Coartem 20mg/120mg Artemether/Lumefantrine",
  "imageQuality": "high",
  "processingTime": "2.3s",
  "modelVersion": "v2.1.0"
}
```

**Error Response**:
```json
{
  "error": "Image analysis failed",
  "details": "Unable to identify drug from provided image",
  "confidence": 15.2,
  "suggestions": [
    "Ensure good lighting",
    "Capture full packaging",
    "Avoid blurry images"
  ],
  "status": 400
}
```

## QR Code API Endpoints

### Generate QR Code

**Endpoint**: `POST /api/qr-codes/generate`

**Description**: Generate QR codes for drug batches.

**Request Body**:
```json
{
  "batchId": "CT2024001",
  "quantity": 10000,
  "type": "individual" // or "batch"
}
```

**Response**:
```json
{
  "success": true,
  "batchId": "CT2024001",
  "qrCodes": [
    {
      "qrCodeId": "QR_CT2024001_001",
      "serialNumber": 1,
      "qrCodeUrl": "https://api.shielddrug.com/qr/QR_CT2024001_001",
      "downloadUrl": "https://api.shielddrug.com/qr/QR_CT2024001_001/download",
      "metadata": {
        "drugName": "Coartem",
        "manufacturer": "Novartis",
        "batchId": "CT2024001"
      }
    }
  ],
  "totalGenerated": 10000,
  "processingTime": "45s"
}
```

### Verify QR Code

**Endpoint**: `GET /api/qr-codes/verify/{qrCodeId}`

**Description**: Verify QR code and retrieve associated drug information.

**Response**:
```json
{
  "success": true,
  "qrCodeId": "QR_CT2024001_001",
  "valid": true,
  "drugInfo": {
    "drugName": "Coartem",
    "manufacturer": "Novartis",
    "batchId": "CT2024001",
    "serialNumber": 1,
    "expiryDate": "2025-12-31",
    "activeIngredient": "Artemether/Lumefantrine"
  },
  "blockchainVerified": true,
  "verificationCount": 15,
  "lastVerified": "2024-01-15T14:30:00Z"
}
```

### QR Code Index

**Endpoint**: `GET /api/qr-codes`

**Description**: Get list of QR codes with filtering options.

**Query Parameters**:
- `batchId`: Filter by batch ID
- `manufacturer`: Filter by manufacturer
- `status`: Filter by status (active, inactive, expired)

**Response**:
```json
{
  "qrCodes": [
    {
      "qrCodeId": "QR_CT2024001_001",
      "batchId": "CT2024001",
      "drugName": "Coartem",
      "manufacturer": "Novartis",
      "status": "active",
      "verificationCount": 15,
      "createdDate": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 50000,
  "page": 1,
  "limit": 50
}
```

## Authentication API Endpoints

### Login

**Endpoint**: `POST /api/auth/login`

**Description**: Authenticate user and return role-based access token.

**Request Body**:
```json
{
  "email": "manufacturer@example.com",
  "password": "securepassword",
  "role": "manufacturer"
}
```

**Response**:
```json
{
  "success": true,
  "user": {
    "id": "user_123456",
    "email": "manufacturer@example.com",
    "role": "manufacturer",
    "name": "Novartis Pharma",
    "organization": "Novartis"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600
}
```

**Error Response**:
```json
{
  "error": "Invalid credentials",
  "code": "INVALID_CREDENTIALS",
  "status": 401
}
```

### Forgot Password

**Endpoint**: `POST /api/auth/forgot-password`

**Description**: Initiate password reset process.

**Request Body**:
```json
{
  "email": "manufacturer@example.com"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Password reset email sent successfully"
}
```

## Error Handling & Status Codes

### Standard Error Response Format

All API endpoints return standardized error responses:

```json
{
  "error": "Error message description",
  "code": "ERROR_CODE",
  "details": "Additional error details",
  "status": 400,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### HTTP Status Codes

| Status Code | Description | Usage |
|-------------|-------------|-------|
| 200 | OK | Successful request |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid request data or validation errors |
| 401 | Unauthorized | Authentication required |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource conflict (e.g., duplicate batch ID) |
| 422 | Unprocessable Entity | Validation errors in request data |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |

### Common Error Codes

| Error Code | Description | HTTP Status |
|------------|-------------|-------------|
| `AUTH_REQUIRED` | Authentication required | 401 |
| `INSUFFICIENT_PERMISSIONS` | Insufficient permissions | 403 |
| `INVALID_CREDENTIALS` | Invalid login credentials | 401 |
| `VALIDATION_ERROR` | Request validation failed | 400 |
| `FILE_TOO_LARGE` | File size exceeds limit | 400 |
| `INVALID_FILE_FORMAT` | Invalid file format | 400 |
| `DUPLICATE_BATCH_ID` | Batch ID already exists | 409 |
| `QR_CODE_NOT_FOUND` | QR code not found | 404 |
| `BLOCKCHAIN_ERROR` | Blockchain transaction failed | 500 |
| `RATE_LIMIT_EXCEEDED` | Rate limit exceeded | 429 |

### Validation Error Structure

For validation errors, the response includes detailed field-level errors:

```json
{
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": [
    {
      "field": "nafdac_number",
      "message": "Invalid NAFDAC number format",
      "value": "NAFDAC-12345",
      "row": 5
    },
    {
      "field": "expiry_date",
      "message": "Expiry date must be in the future",
      "value": "2023-12-31",
      "row": 8
    }
  ],
  "status": 400
}
```

## Data Models & Schemas

### Core Data Types

#### User
```typescript
interface User {
  id: string;
  email: string;
  role: 'manufacturer' | 'pharmacist' | 'consumer' | 'regulatory' | 'admin';
  name: string;
  organization?: string;
  status: 'active' | 'inactive' | 'suspended';
  createdDate: string;
  lastLogin: string;
}
```

#### Batch
```typescript
interface Batch {
  batchId: string;
  drugName: string;
  manufacturer: string;
  quantity: number;
  uploadDate: string;
  status: 'processing' | 'completed' | 'failed';
  qrCodesGenerated: number;
  blockchainTx: string;
  verificationCount: number;
  authenticityRate: number;
}
```

#### QR Code
```typescript
interface QRCode {
  qrCodeId: string;
  batchId: string;
  serialNumber: number;
  drugName: string;
  manufacturer: string;
  status: 'active' | 'inactive' | 'expired';
  verificationCount: number;
  createdDate: string;
  lastVerified?: string;
}
```

#### Verification
```typescript
interface Verification {
  qrCodeId: string;
  verifiedBy: string;
  verifiedAt: string;
  location: string;
  authentic: boolean;
  deviceInfo?: string;
  notes?: string;
}
```

#### Report
```typescript
interface Report {
  reportId: string;
  qrCodeId?: string;
  drugName: string;
  manufacturer: string;
  description: string;
  location: string;
  contactInfo: string;
  status: 'submitted' | 'investigating' | 'resolved';
  createdDate: string;
  resolvedDate?: string;
}
```

### Request/Response Schemas

#### Upload Batch Request
```typescript
interface UploadBatchRequest {
  file: File;
  manufacturer: string;
  batchId: string;
}
```

#### Upload Batch Response
```typescript
interface UploadBatchResponse {
  success: boolean;
  uploadId: string;
  progressUrl: string;
  estimatedTime: string;
  message: string;
}
```

#### Scan Request
```typescript
interface ScanRequest {
  qrCodeId: string;
  location: string;
  notes?: string;
}
```

#### Scan Response
```typescript
interface ScanResponse {
  success: boolean;
  authentic: boolean;
  drugInfo: DrugInfo;
  verificationHistory: Verification[];
  blockchainVerified: boolean;
  verificationCount: number;
}
```

## Integration Guidelines

### Getting Started

1. **Register for API Access**
   - Contact the platform administrator for API credentials
   - Receive role-based access permissions
   - Get API documentation and integration guide

2. **Set Up Authentication**
   - Implement header-based authentication
   - Include required headers in all requests
   - Handle authentication errors appropriately

3. **Test Integration**
   - Use provided test endpoints
   - Validate request/response formats
   - Test error handling scenarios

### Best Practices

#### Authentication
- Always include required authentication headers
- Implement proper error handling for authentication failures
- Use secure storage for API credentials
- Implement token refresh mechanisms if applicable

#### File Uploads
- Validate file size before upload (max 10MB)
- Use appropriate content types for file uploads
- Implement progress tracking for large uploads
- Handle upload errors gracefully

#### Error Handling
- Implement comprehensive error handling
- Log errors for debugging purposes
- Provide user-friendly error messages
- Implement retry mechanisms for transient errors

#### Rate Limiting
- Respect rate limits (typically 100 requests per minute)
- Implement exponential backoff for retries
- Monitor rate limit headers in responses
- Cache responses when appropriate

### SDK Usage Examples

#### JavaScript/TypeScript SDK
```javascript
import { ShieldDrugAPI } from '@shielddrug/sdk';

const api = new ShieldDrugAPI({
  baseUrl: 'https://api.shielddrug.com',
  headers: {
    'x-user-role': 'manufacturer',
    'x-user-email': 'manufacturer@example.com'
  }
});

// Upload batch
const uploadResult = await api.manufacturer.uploadBatch({
  file: csvFile,
  manufacturer: 'Novartis',
  batchId: 'CT2024001'
});

// Monitor progress
const progress = await api.manufacturer.getUploadProgress(uploadResult.uploadId);

// Get QR codes
const qrCodes = await api.manufacturer.getQRCodes('CT2024001');
```

#### Python SDK
```python
from shielddrug import ShieldDrugAPI

api = ShieldDrugAPI(
    base_url='https://api.shielddrug.com',
    headers={
        'x-user-role': 'manufacturer',
        'x-user-email': 'manufacturer@example.com'
    }
)

# Upload batch
upload_result = api.manufacturer.upload_batch(
    file=csv_file,
    manufacturer='Novartis',
    batch_id='CT2024001'
)

# Monitor progress
progress = api.manufacturer.get_upload_progress(upload_result.upload_id)

# Get QR codes
qr_codes = api.manufacturer.get_qr_codes('CT2024001')
```

### Testing Strategies

#### Unit Testing
- Mock API responses for testing
- Test error handling scenarios
- Validate request/response schemas
- Test authentication flows

#### Integration Testing
- Use test environment endpoints
- Test with real data formats
- Validate end-to-end workflows
- Test performance under load

#### Production Testing
- Use staging environment for final testing
- Validate with production-like data
- Test error recovery mechanisms
- Monitor API performance metrics

### Security Considerations

#### API Security
- Use HTTPS for all API communications
- Implement proper authentication
- Validate all input data
- Log security events

#### Data Protection
- Encrypt sensitive data in transit
- Implement proper access controls
- Follow data retention policies
- Comply with regulatory requirements

#### Rate Limiting
- Implement client-side rate limiting
- Monitor API usage patterns
- Handle rate limit errors gracefully
- Optimize request patterns

### Production Deployment

#### Environment Setup
- Configure production API endpoints
- Set up monitoring and logging
- Implement backup and recovery procedures
- Configure security policies

#### Performance Optimization
- Implement caching strategies
- Optimize request patterns
- Monitor API performance
- Scale resources as needed

#### Monitoring and Alerting
- Monitor API response times
- Track error rates and types
- Set up alerting for critical issues
- Monitor rate limit usage

#### Maintenance and Updates
- Plan for API version updates
- Test updates in staging environment
- Communicate changes to stakeholders
- Maintain backward compatibility

This comprehensive API documentation provides all the information needed for successful integration with the Shield Drug Platform. For additional support or questions, please contact the platform administrator or refer to the developer portal.
