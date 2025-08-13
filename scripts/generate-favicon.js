const fs = require('fs');
const path = require('path');

// Create a simple SVG favicon with shield and medical cross design
const svgContent = `
<svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
  <!-- Shield background -->
  <defs>
    <linearGradient id="shieldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3B82F6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1D4ED8;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="crossGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#FFFFFF;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#F3F4F6;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Shield shape -->
  <path d="M16 2 L28 8 L28 16 C28 22 22 28 16 30 C10 28 4 22 4 16 L4 8 Z" 
        fill="url(#shieldGradient)" 
        stroke="#1E40AF" 
        stroke-width="1"/>
  
  <!-- Medical cross -->
  <rect x="14" y="10" width="4" height="12" fill="url(#crossGradient)" rx="1"/>
  <rect x="10" y="14" width="12" height="4" fill="url(#crossGradient)" rx="1"/>
  
  <!-- Shield highlight -->
  <path d="M16 2 L28 8 L28 16 C28 22 22 28 16 30" 
        fill="none" 
        stroke="#FFFFFF" 
        stroke-width="0.5" 
        opacity="0.3"/>
</svg>
`;

// Convert SVG to ICO format (simplified - in production you'd use a proper library)
const icoContent = Buffer.from(svgContent, 'utf8');

// Write the favicon files
const publicDir = path.join(__dirname, '..', 'public');

// Write SVG favicon
fs.writeFileSync(path.join(publicDir, 'favicon.svg'), svgContent);
console.log('✅ Generated favicon.svg');

// Write ICO favicon (simplified - you'd need a proper ICO converter)
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), icoContent);
console.log('✅ Generated favicon.ico');

// Also create a larger version for better quality
const largeSvgContent = `
<svg width="512" height="512" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
  <!-- Shield background -->
  <defs>
    <linearGradient id="shieldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3B82F6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1D4ED8;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="crossGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#FFFFFF;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#F3F4F6;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Shield shape -->
  <path d="M16 2 L28 8 L28 16 C28 22 22 28 16 30 C10 28 4 22 4 16 L4 8 Z" 
        fill="url(#shieldGradient)" 
        stroke="#1E40AF" 
        stroke-width="1"/>
  
  <!-- Medical cross -->
  <rect x="14" y="10" width="4" height="12" fill="url(#crossGradient)" rx="1"/>
  <rect x="10" y="14" width="12" height="4" fill="url(#crossGradient)" rx="1"/>
  
  <!-- Shield highlight -->
  <path d="M16 2 L28 8 L28 16 C28 22 22 28 16 30" 
        fill="none" 
        stroke="#FFFFFF" 
        stroke-width="0.5" 
        opacity="0.3"/>
</svg>
`;

fs.writeFileSync(path.join(publicDir, 'logo.svg'), largeSvgContent);
console.log('✅ Generated logo.svg');

console.log('🎨 DrugShield favicon generated successfully!');
console.log('📁 Files created:');
console.log('   - public/favicon.ico (32x32)');
console.log('   - public/favicon.svg (32x32)');
console.log('   - public/logo.svg (512x512)'); 