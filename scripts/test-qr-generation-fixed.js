const { qrCodeService } = require('../src/lib/qr-code');

async function testQRGenerationFixed() {
  console.log('🧪 Testing Fixed QR Code Generation...\n');

  try {
    // Test QR code generation
    console.log('1️⃣ Generating QR code...');
    const qrCode = await qrCodeService.generateQRCode(
      'test-upload-id-123',
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
      verificationUrl: qrCode.verificationUrl,
      blockchainTx: qrCode.blockchainTx ? 'Present' : 'None'
    });

    console.log('\n🎉 QR Code Generation Test Complete!');
    console.log('\n📋 Summary:');
    console.log(`   QR Code ID: ${qrCode.qrCodeId}`);
    console.log(`   QR Code ID Length: ${qrCode.qrCodeId.length}`);
    console.log(`   QR Code ID Format: ${qrCode.qrCodeId.match(/^[a-f0-9]+$/i) ? 'Valid hex' : 'Invalid format'}`);
    console.log(`   Verification URL: ${qrCode.verificationUrl}`);
    console.log(`   Blockchain Transaction: ${qrCode.blockchainTx ? 'Recorded' : 'Not recorded'}`);

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testQRGenerationFixed();
