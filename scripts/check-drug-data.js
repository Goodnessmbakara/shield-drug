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

async function checkDrugData() {
  console.log('🔍 Checking Drug Data in Database...\n');

  try {
    await connectDB();

    // Import the models
    const { default: QRCode } = await import('../src/lib/models/QRCode.ts');
    const { default: Upload } = await import('../src/lib/models/Upload.ts');

    // Get all QR codes with drug information
    const qrCodes = await QRCode.find({}).select('qrCodeId uploadId metadata userEmail createdAt').limit(10);

    console.log(`📊 Found ${qrCodes.length} QR codes with drug data:\n`);

    if (qrCodes.length === 0) {
      console.log('❌ No QR codes found in database');
    } else {
      qrCodes.forEach((qr, index) => {
        console.log(`${index + 1}. QR Code ID: ${qr.qrCodeId}`);
        console.log(`   Upload ID: ${qr.uploadId}`);
        console.log(`   Drug: ${qr.metadata?.drugName || 'Unknown'}`);
        console.log(`   User Email: ${qr.userEmail || 'Not set'}`);
        console.log(`   Created: ${qr.createdAt.toISOString()}`);
        console.log('');
      });

      // Get unique drugs
      const uniqueDrugs = [...new Set(qrCodes.map(qr => qr.metadata?.drugName).filter(Boolean))];
      console.log('📦 Unique drugs found:');
      uniqueDrugs.forEach(drug => console.log(`   - ${drug}`));
      console.log('');

      // Get unique user emails
      const uniqueEmails = [...new Set(qrCodes.map(qr => qr.userEmail).filter(Boolean))];
      console.log('👤 Unique user emails found:');
      uniqueEmails.forEach(email => console.log(`   - ${email}`));
      console.log('');

      // Check uploads
      const uploads = await Upload.find({}).select('batchId metadata userEmail createdAt').limit(5);
      console.log(`📤 Found ${uploads.length} uploads:\n`);
      
      uploads.forEach((upload, index) => {
        console.log(`${index + 1}. Batch ID: ${upload.batchId}`);
        console.log(`   Drug: ${upload.metadata?.drugName || 'Unknown'}`);
        console.log(`   User Email: ${upload.userEmail || 'Not set'}`);
        console.log(`   Created: ${upload.createdAt.toISOString()}`);
        console.log('');
      });
    }

  } catch (error) {
    console.error('❌ Error checking drug data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

checkDrugData();
