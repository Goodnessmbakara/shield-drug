require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(process.env.DATABASE_URL);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
}

async function checkSpecificQR() {
  console.log('🔍 Checking Specific QR Code Details...\n');

  try {
    await connectDB();

    // Import the QRCode model
    const { default: QRCode } = await import('../src/lib/models/QRCode.ts');

    const qrCodeId = '759cf847498e';
    
    // Get the specific QR code
    const qrCode = await QRCode.findOne({ qrCodeId });

    if (!qrCode) {
      console.log(`❌ QR Code ${qrCodeId} not found in database`);
    } else {
      console.log(`✅ QR Code ${qrCodeId} found in database`);
      console.log('\n📋 QR Code Details:');
      console.log('   QR Code ID:', qrCode.qrCodeId);
      console.log('   Upload ID:', qrCode.uploadId);
      console.log('   Drug Code:', qrCode.drugCode);
      console.log('   Serial Number:', qrCode.serialNumber);
      console.log('   Verification Count:', qrCode.verificationCount);
      console.log('   Created At:', qrCode.createdAt);
      console.log('   Updated At:', qrCode.updatedAt);
      
      console.log('\n📦 Metadata:');
      console.log('   Drug Name:', qrCode.metadata?.drugName);
      console.log('   Batch ID:', qrCode.metadata?.batchId);
      console.log('   Manufacturer:', qrCode.metadata?.manufacturer);
      console.log('   Expiry Date:', qrCode.metadata?.expiryDate);
      console.log('   Quantity:', qrCode.metadata?.quantity);
      
      console.log('\n🔗 Blockchain Transaction:');
      console.log('   Type:', typeof qrCode.blockchainTx);
      console.log('   Value:', JSON.stringify(qrCode.blockchainTx, null, 2));
      
      if (qrCode.blockchainTx) {
        if (typeof qrCode.blockchainTx === 'string') {
          console.log('   Hash (string):', qrCode.blockchainTx);
        } else if (typeof qrCode.blockchainTx === 'object') {
          console.log('   Hash (object):', qrCode.blockchainTx.hash);
          console.log('   Status:', qrCode.blockchainTx.status);
          console.log('   Block Number:', qrCode.blockchainTx.blockNumber);
          console.log('   Timestamp:', qrCode.blockchainTx.timestamp);
        }
      }
      
      console.log('\n🌐 Verification URL:', qrCode.verificationUrl);
    }

  } catch (error) {
    console.error('❌ Error checking QR code:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

checkSpecificQR();
