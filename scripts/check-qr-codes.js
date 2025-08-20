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

async function checkQRCodes() {
  console.log('🔍 Checking QR Codes in Database...\n');

  try {
    await connectDB();

    // Import the QRCode model
    const { default: QRCode } = await import('../src/lib/models/QRCode.ts');

    // Get all QR codes
    const qrCodes = await QRCode.find({}).select('qrCodeId uploadId metadata createdAt').limit(10);

    console.log(`📊 Found ${qrCodes.length} QR codes in database:\n`);

    if (qrCodes.length === 0) {
      console.log('❌ No QR codes found in database');
      console.log('💡 You need to upload a batch first to generate QR codes');
    } else {
      qrCodes.forEach((qr, index) => {
        console.log(`${index + 1}. QR Code ID: ${qr.qrCodeId}`);
        console.log(`   Upload ID: ${qr.uploadId}`);
        console.log(`   Drug: ${qr.metadata?.drugName || 'Unknown'}`);
        console.log(`   Created: ${qr.createdAt.toISOString()}`);
        console.log('');
      });

      // Check if the specific QR code exists
      const specificQR = await QRCode.findOne({ qrCodeId: '759cf847498e' });
      if (specificQR) {
        console.log('✅ QR Code 759cf847498e found in database');
      } else {
        console.log('❌ QR Code 759cf847498e NOT found in database');
        console.log('💡 Try using one of the QR codes listed above');
      }
    }

  } catch (error) {
    console.error('❌ Error checking QR codes:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

checkQRCodes();
