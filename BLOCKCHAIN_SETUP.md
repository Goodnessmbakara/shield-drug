# Blockchain Setup Guide

## 🎯 **Overview**

This guide will help you set up the blockchain functionality for the pharmaceutical application using **Polygon Mumbai Testnet**. The system includes:

- **Smart Contract**: `PharmaceuticalData.sol` for storing batch data
- **Blockchain Service**: Integration with Polygon Mumbai testnet
- **API Endpoints**: For blockchain operations and verification

## 🏗️ **Architecture**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Next.js API   │    │   Polygon       │
│   (React)       │───▶│   Routes        │───▶│   Mumbai        │
│                 │    │                 │    │   Testnet       │
│ • Upload Form   │    │ • /api/upload   │    │ • Smart Contract│
│ • QR Codes      │    │ • /api/verify   │    │ • Transactions  │
│ • Verification  │    │ • /api/status   │    │ • Data Storage  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📋 **Prerequisites**

### **1. Polygon Mumbai Testnet Setup**

1. **Get Test MATIC**:
   - Visit [Polygon Faucet](https://faucet.polygon.technology/)
   - Connect your wallet
   - Request test MATIC tokens

2. **Network Configuration**:
   - **Network Name**: Polygon Mumbai Testnet
   - **RPC URL**: `https://polygon-mumbai.infura.io/v3/YOUR_PROJECT_ID`
   - **Chain ID**: `80001`
   - **Currency Symbol**: `MATIC`
   - **Block Explorer**: `https://mumbai.polygonscan.com`

### **2. Infura Setup (Recommended)**

1. **Create Account**: [Infura.io](https://infura.io)
2. **Create Project**: Select "Polygon" network
3. **Get Project ID**: Copy your project ID
4. **Update Environment**: Add to `.env.local`

### **3. Wallet Setup**

1. **Install MetaMask**: [metamask.io](https://metamask.io)
2. **Add Mumbai Network**: Use the configuration above
3. **Get Private Key**: Export your private key (for testing only)

## 🔧 **Smart Contract Deployment**

### **1. Install Hardhat**

```bash
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
npx hardhat init
```

### **2. Configure Hardhat**

Create `hardhat.config.js`:

```javascript
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: "0.8.19",
  networks: {
    mumbai: {
      url: process.env.POLYGON_RPC_URL,
      accounts: [process.env.POLYGON_PRIVATE_KEY],
      chainId: 80001
    }
  },
  etherscan: {
    apiKey: process.env.POLYGONSCAN_API_KEY
  }
};
```

### **3. Deploy Contract**

```bash
# Compile contract
npx hardhat compile

# Deploy to Mumbai testnet
npx hardhat run scripts/deploy.js --network mumbai
```

### **4. Update Environment Variables**

After deployment, update `.env.local`:

```env
POLYGON_CONTRACT_ADDRESS=0x... # Your deployed contract address
POLYGON_PRIVATE_KEY=0x... # Your wallet private key
POLYGON_RPC_URL=https://polygon-mumbai.infura.io/v3/YOUR_PROJECT_ID
POLYGONSCAN_API_KEY=your-polygonscan-api-key
```

## 🚀 **Application Configuration**

### **1. Environment Variables**

Update `.env.local` with your blockchain configuration:

```env
# Blockchain Configuration
POLYGON_RPC_URL=https://polygon-mumbai.infura.io/v3/YOUR_PROJECT_ID
POLYGON_CHAIN_ID=80001
POLYGON_EXPLORER_URL=https://mumbai.polygonscan.com
POLYGON_PRIVATE_KEY=your-private-key-here
POLYGON_CONTRACT_ADDRESS=your-deployed-contract-address
POLYGONSCAN_API_KEY=your-polygonscan-api-key
```

### **2. Test Blockchain Connection**

```bash
# Start development server
npm run dev

# Test blockchain status
curl http://localhost:3001/api/blockchain/status

# Test database connection
curl http://localhost:3001/api/test-db
```

## 📊 **API Endpoints**

### **1. Upload with Blockchain**

```http
POST /api/manufacturer/upload-batch
Content-Type: application/json

{
  "fileContent": "csv content...",
  "fileName": "batch.csv",
  "fileSize": 1024
}
```

**Response**:
```json
{
  "uploadId": "UPMDGJKFKFVCWZEC",
  "status": "completed",
  "blockchainTx": {
    "hash": "0x...",
    "status": "confirmed",
    "gasUsed": 150000,
    "blockNumber": 45892147
  },
  "qrCodesGenerated": 50000
}
```

### **2. Verify Transaction**

```http
GET /api/blockchain/verify?txHash=0x...
```

**Response**:
```json
{
  "success": true,
  "data": {
    "transaction": {
      "hash": "0x...",
      "confirmed": true,
      "blockNumber": 45892147,
      "gasUsed": 150000
    },
    "network": {
      "chainId": 80001,
      "blockNumber": 45892150,
      "gasPrice": "30000000000"
    }
  }
}
```

### **3. Check Blockchain Status**

```http
GET /api/blockchain/status
```

**Response**:
```json
{
  "success": true,
  "status": "connected",
  "network": {
    "name": "Polygon Mumbai Testnet",
    "chainId": 80001,
    "blockNumber": 45892150,
    "gasPrice": "30000000000",
    "isCorrectNetwork": true
  },
  "contract": {
    "address": "0x...",
    "isConfigured": true
  },
  "wallet": {
    "isConfigured": true,
    "hasBalance": true
  }
}
```

## 🔍 **Smart Contract Functions**

### **1. Record Pharmaceutical Batch**

```solidity
function recordPharmaceuticalBatch(
    string memory uploadId,
    string memory drugName,
    string memory batchId,
    uint256 quantity,
    string memory manufacturer,
    string memory fileHash,
    uint256 expiryDate
) public returns (bool)
```

### **2. Record QR Code**

```solidity
function recordQRCode(
    string memory qrCodeId,
    string memory uploadId,
    uint256 serialNumber
) public returns (bool)
```

### **3. Verify Batch**

```solidity
function verifyBatch(
    string memory uploadId,
    bool isValid
) public returns (bool)
```

### **4. Get Batch Data**

```solidity
function getPharmaceuticalBatch(string memory uploadId) 
    public view returns (Batch memory)
```

## 🛡️ **Security Considerations**

### **1. Private Key Management**

- **Never commit private keys** to version control
- **Use environment variables** for sensitive data
- **Consider using a dedicated wallet** for the application
- **Regularly rotate keys** in production

### **2. Access Control**

- **Implement role-based access** in smart contract
- **Use multi-signature wallets** for critical operations
- **Monitor transactions** for suspicious activity
- **Implement rate limiting** on API endpoints

### **3. Data Validation**

- **Validate all inputs** before blockchain submission
- **Check file hashes** for data integrity
- **Verify transaction confirmations** before proceeding
- **Implement error handling** for failed transactions

## 🔄 **Testing Workflow**

### **1. Local Testing**

```bash
# Start local blockchain (optional)
npx hardhat node

# Run tests
npx hardhat test

# Deploy to local network
npx hardhat run scripts/deploy.js --network localhost
```

### **2. Testnet Testing**

```bash
# Deploy to Mumbai testnet
npx hardhat run scripts/deploy.js --network mumbai

# Test upload functionality
curl -X POST http://localhost:3001/api/manufacturer/upload-batch \
  -H "Content-Type: application/json" \
  -d '{"fileContent":"test","fileName":"test.csv","fileSize":100}'
```

### **3. Verification Testing**

```bash
# Check blockchain status
curl http://localhost:3001/api/blockchain/status

# Verify transaction
curl "http://localhost:3001/api/blockchain/verify?txHash=0x..."
```

## 📈 **Monitoring & Analytics**

### **1. Transaction Monitoring**

- **Track gas usage** for cost optimization
- **Monitor transaction success rates**
- **Alert on failed transactions**
- **Log all blockchain interactions**

### **2. Network Monitoring**

- **Check network connectivity**
- **Monitor gas prices**
- **Track block confirmations**
- **Alert on network issues**

### **3. Contract Monitoring**

- **Monitor contract events**
- **Track data storage usage**
- **Alert on contract errors**
- **Monitor access patterns**

## 🚀 **Production Deployment**

### **1. Mainnet Migration**

1. **Audit smart contract** with professional auditors
2. **Deploy to Polygon mainnet**
3. **Update environment variables**
4. **Test thoroughly** before going live
5. **Monitor closely** after deployment

### **2. Scaling Considerations**

- **Use IPFS** for large file storage
- **Implement batch processing** for multiple uploads
- **Use Layer 2 solutions** for cost reduction
- **Consider sharding** for high-volume data

### **3. Backup & Recovery**

- **Regular backups** of blockchain data
- **Multiple RPC providers** for redundancy
- **Disaster recovery** procedures
- **Data migration** strategies

This setup provides a **robust, secure, and scalable** blockchain solution for pharmaceutical data management on Polygon Mumbai testnet! 