#!/usr/bin/env node

const fs = require('fs');
const { execSync } = require('child_process');

function fixPackageJson() {
  try {
    const packageJsonPath = './package.json';
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    // Fix tsconfig-paths version
    packageJson.devDependencies['tsconfig-paths'] = '^4.2.0';
    
    // Write back to file
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log('✅ Fixed tsconfig-paths version in package.json');
    
    return true;
  } catch (error) {
    console.error('❌ Error fixing package.json:', error.message);
    return false;
  }
}

function installDependencies() {
  try {
    console.log('📦 Installing dependencies...');
    execSync('pnpm install', { stdio: 'inherit' });
    console.log('✅ Dependencies installed successfully');
    return true;
  } catch (error) {
    console.error('❌ Error installing dependencies:', error.message);
    return false;
  }
}

function main() {
  console.log('🔧 Fixing dependencies...\n');
  
  if (fixPackageJson()) {
    if (installDependencies()) {
      console.log('\n🎉 All dependencies fixed and installed!');
      console.log('\n🚀 You can now run:');
      console.log('   node scripts/test-ai-models.js');
    }
  }
}

if (require.main === module) {
  main();
}
