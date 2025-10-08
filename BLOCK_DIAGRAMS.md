# Shield Drug - System Block Diagrams

## 1. High-Level System Architecture

```mermaid
graph TB
    subgraph "User Interfaces"
        A1[Manufacturer Dashboard]
        A2[Pharmacist Interface]
        A3[Consumer App]
        A4[Regulatory Portal]
        A5[Admin Panel]
    end
    
    subgraph "Next.js Application Layer"
        B[Frontend - React/TypeScript]
        C[API Routes - Serverless Functions]
    end
    
    subgraph "Business Logic Layer"
        D1[AI/ML Services]
        D2[Blockchain Service]
        D3[QR Code Generator]
        D4[Audit Logger]
        D5[Authentication Service]
    end
    
    subgraph "Data & Integration Layer"
        E1[(MongoDB Database)]
        E2[Avalanche Blockchain]
        E3[TensorFlow.js Models]
        E4[Tesseract OCR]
    end
    
    subgraph "External Services"
        F1[Google Cloud Vision]
        F2[Hugging Face Models]
        F3[OpenFDA API]
    end
    
    A1 --> B
    A2 --> B
    A3 --> B
    A4 --> B
    A5 --> B
    
    B --> C
    
    C --> D1
    C --> D2
    C --> D3
    C --> D4
    C --> D5
    
    D1 --> E1
    D1 --> E3
    D1 --> E4
    D1 --> F1
    D1 --> F2
    D1 --> F3
    
    D2 --> E2
    D3 --> E1
    D4 --> E1
    D5 --> E1
    
    style A1 fill:#e1f5ff
    style A2 fill:#e1f5ff
    style A3 fill:#e1f5ff
    style A4 fill:#e1f5ff
    style A5 fill:#e1f5ff
    style E1 fill:#ffe1e1
    style E2 fill:#ffe1e1
```

## 2. Multi-Stakeholder Architecture

```mermaid
graph LR
    subgraph "Manufacturers"
        M1[Upload CSV Batches]
        M2[Generate QR Codes]
        M3[View Analytics]
        M4[Track Distribution]
    end
    
    subgraph "Pharmacists"
        P1[Scan QR Codes]
        P2[Verify Drugs]
        P3[Manage Inventory]
        P4[Generate Reports]
    end
    
    subgraph "Consumers"
        C1[Scan Drugs]
        C2[Verify Authenticity]
        C3[View History]
        C4[Report Issues]
    end
    
    subgraph "Regulators"
        R1[Monitor Supply Chain]
        R2[View Compliance]
        R3[Audit Trail]
        R4[Analytics Dashboard]
    end
    
    subgraph "Admin"
        A1[User Management]
        A2[System Health]
        A3[Settings]
        A4[Audit Logs]
    end
    
    subgraph "Core Platform"
        CORE[Shield Drug Platform<br/>Next.js + MongoDB + Blockchain]
    end
    
    M1 --> CORE
    M2 --> CORE
    M3 --> CORE
    M4 --> CORE
    
    P1 --> CORE
    P2 --> CORE
    P3 --> CORE
    P4 --> CORE
    
    C1 --> CORE
    C2 --> CORE
    C3 --> CORE
    C4 --> CORE
    
    R1 --> CORE
    R2 --> CORE
    R3 --> CORE
    R4 --> CORE
    
    A1 --> CORE
    A2 --> CORE
    A3 --> CORE
    A4 --> CORE
    
    style CORE fill:#4CAF50,color:#fff
```

## 3. Manufacturer Upload Flow

```mermaid
sequenceDiagram
    participant M as Manufacturer
    participant UI as Frontend UI
    participant API as API Routes
    participant VAL as Validation Service
    participant BC as Blockchain
    participant DB as MongoDB
    participant QR as QR Generator
    
    M->>UI: Upload CSV file
    UI->>API: POST /api/manufacturer/upload-batch
    API->>VAL: Validate file format & content
    
    alt Validation Success
        VAL-->>API: Valid pharmaceutical data
        API->>DB: Create upload record
        
        loop For each batch
            API->>BC: recordPharmaceuticalBatch()
            BC-->>API: Transaction hash
            API->>QR: Generate QR code
            QR-->>API: QR code data
            API->>BC: recordQRCode()
            BC-->>API: QR transaction hash
            API->>DB: Store QR code + blockchain ref
        end
        
        API->>DB: Update upload status = completed
        API-->>UI: Success + QR codes
        UI-->>M: Display results
    else Validation Failed
        VAL-->>API: Validation errors
        API-->>UI: Error response
        UI-->>M: Show error details
    end
```

## 4. Drug Verification Flow

```mermaid
sequenceDiagram
    participant U as User (Consumer/Pharmacist)
    participant UI as Frontend
    participant API as API Routes
    participant AI as AI/ML Service
    participant OCR as Tesseract OCR
    participant CV as Computer Vision
    participant BC as Blockchain
    participant DB as MongoDB
    
    U->>UI: Capture drug image/QR
    UI->>API: POST /api/ai/drug-recognition
    
    par Parallel AI Analysis
        API->>OCR: Extract text from image
        OCR-->>API: Extracted text data
        
        API->>CV: Analyze visual features
        CV-->>API: Visual analysis results
        
        API->>AI: Pattern matching & identification
        AI-->>API: Drug identification + confidence
    end
    
    API->>BC: Verify on blockchain
    BC-->>API: Blockchain verification data
    
    API->>DB: Log verification attempt
    
    API->>API: Calculate authenticity score
    API->>API: Risk assessment
    
    API-->>UI: Verification results
    UI-->>U: Display results + recommendations
```

## 5. Technology Stack Diagram

```mermaid
graph TB
    subgraph "Frontend Layer"
        FE1[Next.js 14]
        FE2[React 18]
        FE3[TypeScript 5]
        FE4[Tailwind CSS]
        FE5[shadcn/ui Components]
    end
    
    subgraph "API Layer"
        API1[Next.js API Routes]
        API2[Serverless Functions]
        API3[JWT Authentication]
        API4[Audit Middleware]
    end
    
    subgraph "AI/ML Stack"
        AI1[TensorFlow.js 4.10]
        AI2[Tesseract.js 5.0]
        AI3[Sharp Image Processing]
        AI4[Google Cloud Vision]
        AI5[Hugging Face Models]
    end
    
    subgraph "Blockchain Stack"
        BC1[Viem 1.19]
        BC2[Avalanche Fuji]
        BC3[Hardhat 2.17]
        BC4[Solidity Smart Contracts]
    end
    
    subgraph "Database Stack"
        DB1[MongoDB]
        DB2[Mongoose ODM]
        DB3[GridFS File Storage]
    end
    
    subgraph "Development Tools"
        DEV1[pnpm Package Manager]
        DEV2[ESLint]
        DEV3[Prettier]
        DEV4[TypeScript Compiler]
    end
    
    FE1 --> API1
    API1 --> AI1
    API1 --> BC1
    API1 --> DB1
    
    AI1 --> AI2
    AI1 --> AI3
    AI1 --> AI4
    AI1 --> AI5
    
    BC1 --> BC2
    BC1 --> BC4
    
    DB1 --> DB2
    DB1 --> DB3
```

## 6. Data Flow Architecture

```mermaid
graph LR
    subgraph "Input Sources"
        I1[CSV Upload]
        I2[QR Scan]
        I3[Drug Image]
        I4[User Action]
    end
    
    subgraph "Processing Pipeline"
        P1[Validation]
        P2[AI Analysis]
        P3[Blockchain Recording]
        P4[QR Generation]
    end
    
    subgraph "Data Storage"
        D1[(MongoDB)]
        D2[Avalanche Chain]
        D3[File Storage]
    end
    
    subgraph "Output Destinations"
        O1[Dashboard Analytics]
        O2[QR Codes]
        O3[Verification Results]
        O4[Reports]
    end
    
    I1 --> P1
    I2 --> P2
    I3 --> P2
    I4 --> P1
    
    P1 --> P3
    P1 --> P4
    P2 --> P3
    
    P3 --> D1
    P3 --> D2
    P4 --> D1
    P4 --> D3
    
    D1 --> O1
    D1 --> O4
    D2 --> O3
    D3 --> O2
    
    style I1 fill:#90CAF9
    style I2 fill:#90CAF9
    style I3 fill:#90CAF9
    style I4 fill:#90CAF9
    style O1 fill:#81C784
    style O2 fill:#81C784
    style O3 fill:#81C784
    style O4 fill:#81C784
```

## 7. Security Architecture

```mermaid
graph TB
    subgraph "Security Layers"
        S1[API Rate Limiting]
        S2[CORS Protection]
        S3[JWT Authentication]
        S4[Role-Based Access]
        S5[Input Validation]
        S6[Audit Logging]
    end
    
    subgraph "User Request Flow"
        U[User Request]
    end
    
    subgraph "Protected Resources"
        R1[API Endpoints]
        R2[Database]
        R3[Blockchain Wallet]
        R4[File Storage]
    end
    
    U --> S1
    S1 --> S2
    S2 --> S3
    S3 --> S4
    S4 --> S5
    S5 --> S6
    
    S6 --> R1
    R1 --> R2
    R1 --> R3
    R1 --> R4
    
    style S1 fill:#FF6B6B
    style S2 fill:#FF6B6B
    style S3 fill:#FF6B6B
    style S4 fill:#FF6B6B
    style S5 fill:#FF6B6B
    style S6 fill:#FF6B6B
```

## 8. Database Schema Relationships

```mermaid
erDiagram
    USER ||--o{ UPLOAD : creates
    USER {
        ObjectId _id
        string email
        string role
        string manufacturerId
        boolean isAuthorized
        date lastLogin
    }
    
    UPLOAD ||--|{ QRCODE : contains
    UPLOAD {
        ObjectId _id
        string manufacturerId
        string fileName
        string fileHash
        string status
        number totalRecords
        string blockchainTxHash
        date createdAt
    }
    
    QRCODE ||--o{ SCAN_HISTORY : has
    QRCODE {
        ObjectId _id
        string qrCodeId
        string batchId
        string drugName
        string manufacturer
        string blockchainTxHash
        number verificationCount
        date expiryDate
    }
    
    SCAN_HISTORY {
        ObjectId _id
        string qrCodeId
        string scannedBy
        string location
        date timestamp
    }
    
    USER ||--o{ AUDIT_LOG : generates
    AUDIT_LOG {
        ObjectId _id
        string userId
        string action
        string resource
        string ipAddress
        date timestamp
    }
    
    UPLOAD ||--o{ DRUG_ANALYSIS : triggers
    DRUG_ANALYSIS {
        ObjectId _id
        string uploadId
        string drugName
        number confidence
        number authenticityScore
        string riskLevel
        date analyzedAt
    }
```

## 9. AI/ML Processing Pipeline

```mermaid
graph TB
    subgraph "Image Input"
        A[Drug Image Upload]
    end
    
    subgraph "Preprocessing"
        B1[Resize & Normalize]
        B2[Quality Enhancement]
        B3[Format Conversion]
    end
    
    subgraph "Parallel AI Analysis"
        C1[TensorFlow.js<br/>Drug Classification]
        C2[Tesseract OCR<br/>Text Extraction]
        C3[Computer Vision<br/>Visual Features]
        C4[Pattern Matching<br/>Database Lookup]
    end
    
    subgraph "External AI Services"
        D1[Google Cloud Vision]
        D2[Hugging Face BiomedCLIP]
        D3[OpenFDA Validation]
    end
    
    subgraph "Analysis & Scoring"
        E1[Combine Results]
        E2[Calculate Confidence]
        E3[Authenticity Assessment]
        E4[Risk Classification]
    end
    
    subgraph "Output"
        F[Verification Results<br/>+ Recommendations]
    end
    
    A --> B1
    B1 --> B2
    B2 --> B3
    
    B3 --> C1
    B3 --> C2
    B3 --> C3
    B3 --> C4
    
    C1 --> D1
    C2 --> D2
    C4 --> D3
    
    C1 --> E1
    C2 --> E1
    C3 --> E1
    C4 --> E1
    D1 --> E1
    D2 --> E1
    D3 --> E1
    
    E1 --> E2
    E2 --> E3
    E3 --> E4
    
    E4 --> F
    
    style C1 fill:#FFE082
    style C2 fill:#FFE082
    style C3 fill:#FFE082
    style C4 fill:#FFE082
    style D1 fill:#CE93D8
    style D2 fill:#CE93D8
    style D3 fill:#CE93D8
```

## 10. Blockchain Integration Architecture

```mermaid
graph TB
    subgraph "Application Layer"
        A1[Next.js API Routes]
    end
    
    subgraph "Blockchain Service Layer"
        B1[Viem Client]
        B2[Transaction Builder]
        B3[Event Monitor]
    end
    
    subgraph "Smart Contract Layer"
        C1[PharmaceuticalData.sol]
        C2[Access Control]
        C3[Data Recording]
        C4[Verification Logic]
    end
    
    subgraph "Avalanche Fuji Network"
        D1[Smart Contract Instance]
        D2[Transaction Pool]
        D3[Blockchain State]
        D4[Event Logs]
    end
    
    subgraph "Data Synchronization"
        E1[(MongoDB)]
        E2[Off-chain Storage]
        E3[Transaction Cache]
    end
    
    A1 --> B1
    B1 --> B2
    B1 --> B3
    
    B2 --> C1
    C1 --> C2
    C1 --> C3
    C1 --> C4
    
    C1 --> D1
    D1 --> D2
    D2 --> D3
    D3 --> D4
    
    D4 --> B3
    B3 --> E1
    B2 --> E2
    D1 --> E3
    
    style D1 fill:#7E57C2,color:#fff
    style D2 fill:#7E57C2,color:#fff
    style D3 fill:#7E57C2,color:#fff
    style D4 fill:#7E57C2,color:#fff
```

## 11. API Architecture

```mermaid
graph LR
    subgraph "Client Applications"
        C1[Web Browser]
        C2[Mobile App]
        C3[Admin Dashboard]
    end
    
    subgraph "API Gateway Layer"
        G1[Rate Limiter]
        G2[Authentication]
        G3[Authorization]
        G4[Request Logger]
    end
    
    subgraph "API Routes"
        A1[/api/manufacturer/*]
        A2[/api/pharmacist/*]
        A3[/api/consumer/*]
        A4[/api/regulatory/*]
        A5[/api/admin/*]
        A6[/api/ai/*]
        A7[/api/blockchain/*]
        A8[/api/qr-codes/*]
    end
    
    subgraph "Services"
        S1[Drug Analysis]
        S2[QR Generation]
        S3[Blockchain Service]
        S4[Report Generator]
    end
    
    C1 --> G1
    C2 --> G1
    C3 --> G1
    
    G1 --> G2
    G2 --> G3
    G3 --> G4
    
    G4 --> A1
    G4 --> A2
    G4 --> A3
    G4 --> A4
    G4 --> A5
    G4 --> A6
    G4 --> A7
    G4 --> A8
    
    A1 --> S2
    A1 --> S3
    A2 --> S1
    A2 --> S3
    A3 --> S1
    A4 --> S4
    A6 --> S1
    A7 --> S3
    A8 --> S2
```

## 12. Deployment Architecture

```mermaid
graph TB
    subgraph "Development Environment"
        DEV1[Local Development]
        DEV2[Testing Environment]
    end
    
    subgraph "CI/CD Pipeline"
        CI1[GitHub Repository]
        CI2[Automated Tests]
        CI3[Build Process]
        CI4[Deployment Scripts]
    end
    
    subgraph "Production Environment"
        PROD1[Vercel/Cloud Platform]
        PROD2[Load Balancer]
        PROD3[Next.js Server]
        PROD4[CDN for Static Assets]
    end
    
    subgraph "External Services"
        EXT1[MongoDB Atlas]
        EXT2[Avalanche Network]
        EXT3[AI/ML APIs]
    end
    
    subgraph "Monitoring & Logging"
        MON1[Performance Monitor]
        MON2[Error Tracking]
        MON3[Audit Logs]
    end
    
    DEV1 --> CI1
    DEV2 --> CI1
    CI1 --> CI2
    CI2 --> CI3
    CI3 --> CI4
    CI4 --> PROD1
    
    PROD1 --> PROD2
    PROD2 --> PROD3
    PROD3 --> PROD4
    
    PROD3 --> EXT1
    PROD3 --> EXT2
    PROD3 --> EXT3
    
    PROD3 --> MON1
    PROD3 --> MON2
    PROD3 --> MON3
    
    style PROD1 fill:#4CAF50,color:#fff
    style PROD2 fill:#4CAF50,color:#fff
    style PROD3 fill:#4CAF50,color:#fff
```

---

## Summary

These block diagrams illustrate the **Shield Drug** pharmaceutical authentication platform's comprehensive architecture, showing:

1. **High-level system architecture** with all major components
2. **Multi-stakeholder support** for manufacturers, pharmacists, consumers, and regulators
3. **Data flow patterns** for upload and verification
4. **Technology stack integration** across frontend, backend, AI/ML, and blockchain
5. **Security layers** protecting the system
6. **Database relationships** and schema design
7. **AI/ML processing pipeline** for drug recognition
8. **Blockchain integration** with Avalanche network
9. **API architecture** with role-based routing
10. **Deployment strategy** for production environments

The system demonstrates sophisticated integration of Next.js, MongoDB, Avalanche blockchain, TensorFlow.js, and multiple AI/ML services to create a comprehensive pharmaceutical authentication solution.
