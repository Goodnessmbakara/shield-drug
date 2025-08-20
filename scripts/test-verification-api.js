// Test script to test the verification API directly

async function testVerificationAPI() {
  console.log('🧪 Testing Verification API...\n');

  const qrCodeId = '759cf847498e';
  const baseUrl = 'http://localhost:3003'; // Using the current dev server port

  try {
    console.log(`1️⃣ Testing verification for QR Code: ${qrCodeId}`);
    
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
        console.log('   QR Code Data:');
        console.log('     QR Code ID:', result.data.qrCode.qrCodeId);
        console.log('     Drug Name:', result.data.qrCode.metadata.drugName);
        console.log('     Manufacturer:', result.data.qrCode.metadata.manufacturer);
        console.log('     Blockchain TX:', result.data.qrCode.blockchainTx ? 'Present' : 'None');
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

  console.log('\n🎉 Verification API Test Complete!');
}

testVerificationAPI();
