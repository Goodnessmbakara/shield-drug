// Test the loadLanguage array fix
const testImageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

console.log('🔧 Testing the fixed loadLanguage([language]) syntax...');

fetch('http://localhost:3002/api/ai/analyze-image', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    imageData: testImageBase64,
    useEnhanced: false
  })
})
.then(res => {
  console.log('✅ API Status:', res.status);
  return res.json();
})
.then(data => {
  console.log('🎉 SUCCESS! No more langsArr.map errors');
  console.log('Response time:', data.metadata?.processingTime, 'ms');
})
.catch(err => {
  console.error('❌ Error:', err.message);
});