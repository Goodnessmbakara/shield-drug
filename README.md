# DrugShield - Pharmaceutical Authentication Platform

A blockchain-powered pharmaceutical authentication system designed to combat counterfeit drugs in Nigeria's supply chain. DrugShield uses QR codes, AI analysis, and blockchain technology to provide end-to-end drug verification from manufacturer to consumer.

## 🛡️ Overview

DrugShield is a comprehensive solution that addresses the critical issue of counterfeit pharmaceuticals by providing:

- **Blockchain Verification**: Immutable drug authenticity records on Avalanche Fuji testnet
- **QR Code Technology**: Unique QR codes for instant verification
- **AI-Powered Analysis**: Computer vision and OCR for visual anomaly detection
- **Multi-Stakeholder Platform**: Tailored interfaces for manufacturers, pharmacists, consumers, and regulators
- **Smart Contract Integration**: Automated batch recording and verification on blockchain

## 🎯 Key Features

### For Manufacturers
- Batch data upload and validation with CSV support
- QR code generation for drug units
- Distribution tracking and analytics
- Blockchain transaction monitoring
- Compliance reporting and audit trails

### For Pharmacists
- Instant QR code scanning and verification
- Inventory management and tracking
- Counterfeit reporting system
- Patient education tools
- Scan history and analytics

### For Consumers
- Mobile-responsive drug verification interface
- Instant authenticity checks via QR codes
- Drug information and safety alerts
- Verification history tracking
- Offline verification capabilities

### For Regulators
- Real-time supply chain monitoring
- Compliance reporting and analytics
- Counterfeit detection statistics
- Regulatory alert system
- Audit trail management

## 🏗️ Architecture

### Technology Stack
- **Frontend**: Next.js 14 with TypeScript
- **UI Components**: shadcn/ui with Tailwind CSS
- **Blockchain**: Avalanche Fuji testnet with Viem library
- **AI/ML**: TensorFlow.js for computer vision + Tesseract.js for OCR
- **Authentication**: Custom role-based access control
- **Database**: MongoDB with Mongoose ODM
- **Smart Contracts**: Solidity on Hardhat framework

### Key Technologies
- **Blockchain Security**: Immutable drug authenticity records on Avalanche
- **AI Analysis**: Computer vision and OCR for drug recognition
- **QR Code System**: Unique codes for each drug unit with blockchain verification
- **Real-time Verification**: Instant blockchain-based verification
- **Mobile Integration**: Responsive design for cross-platform access

## 📊 Platform Statistics

> **⚠️ Demo/Presentation Numbers**  
> The following statistics are sample figures for demonstration purposes and do not represent actual platform usage.

- **2.8M+ drugs verified** across the platform
- **50,000+ counterfeits detected** and prevented
- **20,000+ pharmacies** supported
- **99.7% detection accuracy** for counterfeit drugs
- **60% reduction** in verification time
- **24/7 system uptime** with 99.9% availability

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and pnpm
- Modern web browser
- Mobile device for testing (optional)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd shield-drug
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp env-template.txt .env.local
   # Edit .env.local with your configuration
   ```

4. **Start the development server**
   ```bash
   pnpm dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Environment Setup

Create a `.env.local` file in the root directory:

```env
# Blockchain Configuration (Avalanche Fuji Testnet)
AVALANCHE_RPC_URL=https://api.avax-test.network/ext/bc/C/rpc
AVALANCHE_PRIVATE_KEY=your_private_key
AVALANCHE_CONTRACT_ADDRESS=your_deployed_contract_address

# AI/ML Services
AI_SERVICE_KEY=your_ai_service_key

# Database Configuration
MONGODB_URI=your_mongodb_connection_string

# Authentication
JWT_SECRET=your_jwt_secret
NEXTAUTH_URL=http://localhost:3000

# Optional: NAFDAC Integration
NAFDAC_API_KEY=your_nafdac_api_key
NAFDAC_API_URL=https://api.nafdac.gov.ng
```

## 📋 CSV Schema

The platform uses a unified CSV schema for data upload and export operations. See [UNIFIED_CSV_SCHEMA.md](./UNIFIED_CSV_SCHEMA.md) for complete documentation.

### Quick Start with CSV
- **Upload Format**: Use `public/sample-batch.csv` as a template for batch uploads
- **Export Format**: Download processed data in unified format from batch/upload details pages
- **Validation**: All uploads are validated against the required schema before processing

## 🎭 User Roles & Access

### Manufacturer Dashboard
- **URL**: `/manufacturer`
- **Features**: Batch upload, QR generation, analytics
- **Access**: Pharmaceutical manufacturers

### Pharmacist Dashboard
- **URL**: `/pharmacist`
- **Features**: Drug scanning, inventory, reports
- **Access**: Licensed pharmacists and pharmacies

### Consumer App
- **URL**: `/consumer`
- **Features**: Drug verification, safety alerts
- **Access**: General public

### Regulatory Dashboard
- **URL**: `/regulatory`
- **Features**: Monitoring, compliance, analytics
- **Access**: NAFDAC and regulatory authorities

## 🔧 Development

### Project Structure
```
shield-drug/
├── pages/                 # Next.js pages and API routes
│   ├── api/              # API endpoints
│   │   ├── manufacturer/ # Manufacturer API routes
│   │   ├── pharmacist/   # Pharmacist API routes
│   │   ├── consumer/     # Consumer API routes
│   │   ├── regulatory/   # Regulatory API routes
│   │   ├── auth/         # Authentication API routes
│   │   ├── ai/           # AI/ML API routes
│   │   ├── blockchain/   # Blockchain API routes
│   │   └── qr-codes/     # QR code API routes
│   ├── manufacturer/     # Manufacturer dashboard pages
│   ├── pharmacist/       # Pharmacist dashboard pages
│   ├── consumer/         # Consumer app pages
│   └── regulatory/       # Regulatory dashboard pages
├── src/
│   ├── components/       # React components
│   │   ├── Auth/        # Authentication components
│   │   ├── Camera/      # QR scanning components
│   │   ├── Dashboard/   # Dashboard components
│   │   ├── AI/          # AI/ML components
│   │   └── ui/          # UI components (shadcn/ui)
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utility functions and services
│   │   ├── models/      # Database models
│   │   ├── blockchain.ts # Blockchain integration
│   │   ├── database.ts  # Database connection
│   │   └── utils.ts     # Utility functions
│   └── services/        # Business logic services
├── contracts/           # Smart contracts
├── public/              # Static assets
└── scripts/             # Build and utility scripts
```

### Available Scripts

```bash
# Development
pnpm dev                 # Start development server
pnpm build               # Build for production
pnpm start               # Start production server
pnpm lint                # Run ESLint

# Blockchain (Hardhat)
npx hardhat compile      # Compile smart contracts
npx hardhat test         # Run contract tests
npx hardhat deploy       # Deploy contracts

# Database
pnpm run db:seed         # Seed database with sample data (if applicable)
```

## 🔒 Security & Compliance

### Data Protection
- **GDPR Compliance**: All personal data handled according to international standards
- **Encryption**: End-to-end encryption for sensitive data
- **Access Control**: Role-based permissions and authentication
- **Audit Trails**: Complete audit logs for all system activities

### Regulatory Compliance
- **NAFDAC MAS**: Compatible with Nigeria's Mobile Authentication Service
- **EU FMD**: Compatible with European Falsified Medicines Directive
- **ISO Standards**: Following pharmaceutical industry standards
- **Blockchain Security**: Immutable records for regulatory compliance

## 🤖 AI/ML Capabilities

### Drug Recognition System
- **Computer Vision**: TensorFlow.js-powered image analysis for drug identification
- **OCR Processing**: Tesseract.js for text extraction from drug packaging
- **Comprehensive Database**: Recognition of common pharmaceutical products including:
  - Paracetamol, Ibuprofen, Amoxicillin
  - Levocetirizine, Ambroxol, Phenylephrine
  - Combination cold medications
- **Visual Analysis**: Color, shape, and marking detection for authenticity verification
- **Counterfeit Detection**: Pattern matching against known authentic drug characteristics

### AI Features
- **Image Classification**: Distinguishes pharmaceutical products from other objects
- **Text Extraction**: OCR-based reading of drug labels and packaging
- **Confidence Scoring**: Probability-based authenticity assessment
- **Multi-language Support**: Text recognition in multiple languages

## 🌐 API Documentation

### Authentication Endpoints
```http
POST /api/auth/login
POST /api/auth/forgot-password
GET /api/auth/verify
```

### Drug Verification Endpoints
```http
POST /api/qr-codes/verify
GET /api/consumer/verifications
POST /api/consumer/reports
```

### Manufacturer Endpoints
```http
POST /api/manufacturer/upload-batch
GET /api/manufacturer/batches
GET /api/manufacturer/batch-details/[id]
POST /api/manufacturer/qr-codes
GET /api/manufacturer/analytics
```

### Pharmacist Endpoints
```http
POST /api/pharmacist/scan
GET /api/pharmacist/inventory
GET /api/pharmacist/history
GET /api/pharmacist/reports
```

### Regulatory Endpoints
```http
GET /api/regulatory/dashboard
GET /api/regulatory/manufacturers
GET /api/regulatory/reports
GET /api/regulatory/analytics
```

### AI/ML Endpoints
```http
POST /api/ai/drug-recognition
```

### Blockchain Endpoints
```http
GET /api/blockchain/status
POST /api/blockchain/verify
```

## 📱 Mobile App

The consumer interface provides:
- QR code scanning for drug verification
- Offline verification capabilities
- Drug information and safety alerts
- Verification history tracking
- Responsive design for mobile devices

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Use shadcn/ui components for consistency
- Write comprehensive tests for new features
- Update documentation for API changes
- Follow the existing code style and conventions

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📚 Documentation

For comprehensive documentation:
- **Business Overview**: [BUSINESS_OVERVIEW.md](./BUSINESS_OVERVIEW.md) - Complete business analysis and market impact
- **User Guide**: [USER_GUIDE.md](./USER_GUIDE.md) - Detailed instructions for all stakeholders
- **Technical Overview**: [TECHNICAL_OVERVIEW.md](./TECHNICAL_OVERVIEW.md) - Architecture and implementation details
- **AI/ML Implementation**: [AI_ML_IMPLEMENTATION.md](./AI_ML_IMPLEMENTATION.md) - AI capabilities and drug recognition
- **Blockchain Integration**: [BLOCKCHAIN_INTEGRATION.md](./BLOCKCHAIN_INTEGRATION.md) - Blockchain implementation guide
- **API Documentation**: [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - Complete API reference
- **Next.js Architecture**: [NEXTJS_ARCHITECTURE.md](./NEXTJS_ARCHITECTURE.md) - Frontend architecture details
- **CSV Schema**: [UNIFIED_CSV_SCHEMA.md](./UNIFIED_CSV_SCHEMA.md) - Data format specifications

## 🆘 Support

For support and questions:
- **Email**: support@drugshield.ng
- **Phone**: +234 XXX XXX XXXX
- **NAFDAC Support**: [nafdac.gov.ng](https://nafdac.gov.ng)

## 🙏 Acknowledgments

### Regulatory Partners
- **NAFDAC (National Agency for Food and Drug Administration and Control)**: For regulatory guidance, Mobile Authentication Service (MAS) integration, and their unwavering commitment to pharmaceutical safety and counterfeit prevention in Nigeria. Their support for innovative technology solutions in drug authentication has been instrumental in shaping this platform's compliance framework.

### Technology Infrastructure Providers
- **Avalanche Foundation**: For providing robust blockchain infrastructure, comprehensive developer support, and commitment to sustainable blockchain solutions that enable secure pharmaceutical authentication at scale.
- **Google TensorFlow Team**: For TensorFlow.js, enabling powerful browser-based machine learning capabilities that drive our AI-powered drug recognition system.
- **Tesseract.js Community**: For the open-source OCR technology that enables accurate text extraction from pharmaceutical packaging and labels.
- **Viem Development Team**: For their modern TypeScript-first Ethereum library that provides seamless blockchain integration capabilities.
- **Vercel/Next.js Team**: For the Next.js framework that powers our full-stack development with exceptional performance and developer experience.

### Pharmaceutical Industry Partners
- **Pharmaceutical Manufacturers**: For providing testing data, feedback on user experience, and validation of batch upload workflows that ensure real-world applicability.
- **Pharmacy Chains**: For participating in pilot programs and providing insights into pharmacist workflows and inventory management requirements.
- **Healthcare Professionals**: For contributing to user experience design and ensuring the platform meets clinical and regulatory requirements.
- **Regulatory Experts**: For providing compliance guidance and ensuring adherence to international pharmaceutical standards.

### Academic and Research Contributions
- **Academic Institutions**: For research on pharmaceutical counterfeiting patterns and blockchain applications in healthcare supply chains.
- **Blockchain Research Community**: For foundational research on decentralized identity and supply chain transparency.
- **AI/ML Research Communities**: For advancing computer vision and machine learning techniques applied to pharmaceutical authentication.
- **Cybersecurity Experts**: For providing security guidance and best practices for blockchain-based healthcare applications.

### Open Source Community
- **shadcn/ui and Radix UI**: For the excellent component library that provides accessible, customizable UI components.
- **Tailwind CSS**: For the utility-first CSS framework that enables rapid, responsive design development.
- **MongoDB Community**: For robust database solutions and comprehensive documentation.
- **React and TypeScript Communities**: For the development frameworks that power our frontend architecture.

### International Organizations
- **WHO (World Health Organization)**: For global pharmaceutical safety standards and guidelines that inform our authentication protocols.
- **International Regulatory Bodies**: For providing international compliance guidance and cross-border pharmaceutical authentication standards.
- **International Pharmaceutical Authentication Initiatives**: For collaborative efforts in combating global counterfeit pharmaceutical trade.

### Special Recognition
We extend our deepest gratitude to all contributors, testers, and stakeholders who have supported this project's mission to create a safer pharmaceutical supply chain through innovative technology solutions.

---

**DrugShield** - Securing Nigeria's pharmaceutical supply chain, one verification at a time. 🛡️💊
