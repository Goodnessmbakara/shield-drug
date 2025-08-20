const { qrCodeService } = require('../src/lib/qr-code');

async function testQRFlow() {
  console.log('🧪 Testing QR Code Generation and Verification Flow...\n');

  try {
    // Test QR code generation
    console.log('1️⃣ Generating QR code...');
    const qrCode = await qrCodeService.generateQRCode(
      'test-upload-id',
      'TestDrug',
      1,
      {
        drugName: 'Test Drug 500mg',
        batchId: 'TEST-BATCH-001',
        manufacturer: 'Test Manufacturer',
        expiryDate: '2025-12-31',
        quantity: 1
      }
    );

    console.log('✅ Generated QR Code:', {
      qrCodeId: qrCode.qrCodeId,
      uploadId: qrCode.uploadId,
      verificationUrl: qrCode.verificationUrl
    });

    // Test QR code verification
    console.log('\n2️⃣ Verifying QR code...');
    const verificationResult = await qrCodeService.verifyQRCode(qrCode.qrCodeId);

    console.log('✅ Verification Result:', {
      isValid: verificationResult.isValid,
      error: verificationResult.error,
      data: verificationResult.data ? {
        qrCodeId: verificationResult.data.qrCodeId,
        drugName: verificationResult.data.metadata.drugName
      } : null
    });

    console.log('\n🎉 QR Code Flow Test Complete!');
    console.log('\n📋 Summary:');
    console.log(`   QR Code ID: ${qrCode.qrCodeId}`);
    console.log(`   Verification URL: ${qrCode.verificationUrl}`);
    console.log(`   Verification Success: ${verificationResult.isValid}`);

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testQRFlow();
