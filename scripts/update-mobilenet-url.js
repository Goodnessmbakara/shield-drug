#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Old and new URLs
const OLD_URL = 'https://tfhub.dev/google/tfjs-model/imagenet/mobilenet_v2_100_224/classification/3';
const NEW_URL = 'https://tfhub.dev/google/imagenet/mobilenet_v2_100_224/classification/4';

// Files to update
const filesToUpdate = [
  'src/services/aiDrugAnalysis.ts',
  'scripts/test-ai-models.js',
  'env-template.txt',
  'README.md'
];

function updateFile(filePath) {
  try {
    const fullPath = path.join(__dirname, '..', filePath);
    
    if (!fs.existsSync(fullPath)) {
      console.log(`⚠️  File not found: ${filePath}`);
      return false;
    }
    
    let content = fs.readFileSync(fullPath, 'utf8');
    const originalContent = content;
    
    // Replace the old URL with the new one
    content = content.replace(new RegExp(OLD_URL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), NEW_URL);
    
    if (content !== originalContent) {
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`✅ Updated: ${filePath}`);
      return true;
    } else {
      console.log(`ℹ️  No changes needed: ${filePath}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error updating ${filePath}:`, error.message);
    return false;
  }
}

function main() {
  console.log('🔄 Updating MobileNet v2 URLs...\n');
  console.log(`Old URL: ${OLD_URL}`);
  console.log(`New URL: ${NEW_URL}\n`);
  
  let updatedCount = 0;
  
  for (const file of filesToUpdate) {
    if (updateFile(file)) {
      updatedCount++;
    }
  }
  
  console.log(`\n🎉 Updated ${updatedCount} files successfully!`);
  console.log('\n📋 Summary of changes:');
  console.log('- Removed "/tfjs-model" prefix from URL path');
  console.log('- Updated version from "/3" to "/4"');
  console.log('- This should fix the "Failed to parse model JSON" error');
  
  console.log('\n🚀 Next steps:');
  console.log('1. Test the AI models: node scripts/test-ai-models.js');
  console.log('2. Restart your development server if running');
  console.log('3. Try uploading an image for AI analysis');
}

if (require.main === module) {
  main();
}

module.exports = { updateFile, OLD_URL, NEW_URL };
