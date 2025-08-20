// Test script to simulate the exact frontend verification request

async function testFrontendVerification() {
  console.log('🧪 Testing Frontend Verification Request...\n');

  const qrCodeId = '759cf847498e';
  const baseUrl = 'http://localhost:3003';

  try {
    console.log(`1️⃣ Simulating frontend verification for QR Code: ${qrCodeId}`);
    
    // Simulate the exact request the frontend makes
    const response = await fetch(`${baseUrl}/api/qr-codes/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        qrCodeId: qrCodeId
      })
    });

    console.log(`   Status: ${response.status}`);
    console.log(`   Status Text: ${response.statusText}`);

    if (response.ok) {
      const result = await response.json();
      console.log('   ✅ API Response:');
      console.log('   Success:', result.success);
      console.log('   Message:', result.message);
      
      if (result.data) {
        const { qrCode, verificationInfo } = result.data;
        
        console.log('\n   📦 QR Code Data:');
        console.log('     QR Code ID:', qrCode.qrCodeId);
        console.log('     Drug Name:', qrCode.metadata.drugName);
        console.log('     Batch ID:', qrCode.metadata.batchId);
        console.log('     Manufacturer:', qrCode.metadata.manufacturer);
        console.log('     Expiry Date:', qrCode.metadata.expiryDate);
        console.log('     Serial Number:', qrCode.serialNumber);
        
        console.log('\n   🔗 Blockchain Transaction:');
        console.log('     Type:', typeof qrCode.blockchainTx);
        console.log('     Value:', JSON.stringify(qrCode.blockchainTx, null, 2));
        
        console.log('\n   ✅ Verification Info:');
        console.log('     Is Valid:', verificationInfo.isValid);
        console.log('     Verified At:', verificationInfo.verifiedAt);
        console.log('     Blockchain Confirmed:', verificationInfo.blockchainConfirmed);
        
        // Test the data transformation logic
        console.log('\n   🧪 Testing Data Transformation:');
        
        const blockchainTx = qrCode.blockchainTx && 
          ((typeof qrCode.blockchainTx === 'string' && qrCode.blockchainTx.length > 0) || 
           (typeof qrCode.blockchainTx === 'object' && qrCode.blockchainTx.hash && qrCode.blockchainTx.hash.length > 0)) ? {
          hash: typeof qrCode.blockchainTx === 'string' ? qrCode.blockchainTx : qrCode.blockchainTx.hash,
          status: typeof qrCode.blockchainTx === 'string' ? 'confirmed' : qrCode.blockchainTx.status,
          blockNumber: typeof qrCode.blockchainTx === 'string' ? undefined : qrCode.blockchainTx.blockNumber,
          timestamp: typeof qrCode.blockchainTx === 'string' ? new Date().toISOString() : qrCode.blockchainTx.timestamp,
        } : undefined;
        
        console.log('     Transformed blockchainTx:', blockchainTx);
        console.log('     Should display blockchain section:', !!(blockchainTx && blockchainTx.hash && blockchainTx.hash.length > 0));
        
        // Test the verification data object
        const verificationData = {
          qrCodeId: qrCode.qrCodeId,
          drug: qrCode.metadata.drugName,
          batchId: qrCode.metadata.batchId,
          manufacturer: qrCode.metadata.manufacturer,
          expiryDate: qrCode.metadata.expiryDate.split('T')[0], // Format date
          verificationUrl: `${baseUrl}/verify/${qrCodeId}`,
          serialNumber: qrCode.serialNumber,
          isValid: verificationInfo.isValid,
          verificationStatus: verificationInfo.isValid ? 'valid' : 'invalid',
          blockchainTx: blockchainTx,
          scannedAt: verificationInfo.verifiedAt
        };
        
        console.log('\n   📋 Final Verification Data:');
        console.log('     QR Code ID:', verificationData.qrCodeId);
        console.log('     Drug:', verificationData.drug);
        console.log('     Manufacturer:', verificationData.manufacturer);
        console.log('     Is Valid:', verificationData.isValid);
        console.log('     Blockchain TX:', verificationData.blockchainTx ? 'Present' : 'None');
        
        console.log('\n   ✅ Data transformation successful!');
      }
    } else {
      const errorResult = await response.json();
      console.log('   ❌ API Error:');
      console.log('   Error:', errorResult.error);
      console.log('   Details:', errorResult.details);
    }

  } catch (error) {
    console.error('❌ Network error:', error.message);
  }

  console.log('\n🎉 Frontend Verification Test Complete!');
}

testFrontendVerification();
