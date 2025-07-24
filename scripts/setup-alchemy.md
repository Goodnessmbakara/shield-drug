# Quick Alchemy Setup for Polygon Mumbai

## 🚀 **Step-by-Step Alchemy Setup**

### **1. Create Alchemy Account**
1. Go to [Alchemy.com](https://www.alchemy.com/)
2. Click "Get Started" and sign up for a free account
3. Verify your email

### **2. Create New App**
1. Click "Create App" in your dashboard
2. Fill in the details:
   - **Name**: `Shield Drug`
   - **Description**: `Pharmaceutical blockchain application`
   - **Network**: Select **Polygon**
   - **Environment**: Select **Testnet**
3. Click "Create App"

### **3. Get Your API Key**
1. Once created, click on your app
2. Copy the **HTTP URL** (it looks like: `https://polygon-mumbai.g.alchemy.com/v2/YOUR_API_KEY`)
3. Or copy just the **API Key** from the URL

### **4. Update Environment**
Run the setup script:
```bash
node scripts/setup-blockchain.js
```

Or manually update `.env.local`:
```env
POLYGON_RPC_URL=https://polygon-mumbai.g.alchemy.com/v2/YOUR_API_KEY
```

### **5. Test Connection**
```bash
curl http://localhost:3001/api/blockchain/status
```

## 🎯 **Why Alchemy?**

- ✅ **Free Tier**: 300M compute units per month
- ✅ **Reliable**: Excellent uptime and performance
- ✅ **Polygon Support**: Native support for Polygon networks
- ✅ **Developer Tools**: Great debugging and monitoring
- ✅ **Rate Limits**: Generous limits for development

## 🔗 **Alternative Providers**

If Alchemy doesn't work for you:

### **Infura**
- URL: `https://polygon-mumbai.infura.io/v3/YOUR_PROJECT_ID`
- Free tier: 100,000 requests/day

### **QuickNode**
- URL: `https://your-endpoint.quiknode.pro/YOUR_API_KEY/`
- Free tier: 3M requests/month

### **Public RPC (Not Recommended)**
- URL: `https://rpc-mumbai.maticvigil.com/`
- No rate limits but unreliable

## 🚀 **Next Steps**

After setting up Alchemy:

1. **Get Test MATIC**: [Polygon Faucet](https://faucet.polygon.technology/)
2. **Deploy Smart Contract**: See `BLOCKCHAIN_SETUP.md`
3. **Test Upload**: Try uploading a CSV file
4. **Verify Transactions**: Check blockchain status

Your blockchain connection will be **fast, reliable, and production-ready**! 🎉 