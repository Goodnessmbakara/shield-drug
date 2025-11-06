#!/usr/bin/env node
/**
 * TensorFlow.js Patch Script
 * Fixes compatibility issues with Node.js by adding missing util functions
 * Works with both npm and pnpm package managers
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Applying TensorFlow.js patches...');

// Find tfjs-node module - try multiple locations for npm and pnpm
const nodeModulesPath = path.join(__dirname, '..', 'node_modules');
const possiblePaths = [
  // Standard npm/yarn location
  path.join(nodeModulesPath, '@tensorflow', 'tfjs-node', 'dist', 'nodejs_kernel_backend.js'),
  // pnpm location (find first match)
  ...(function() {
    try {
      const result = execSync(
        `find "${nodeModulesPath}/.pnpm" -path "*/@tensorflow+tfjs-node*/dist/nodejs_kernel_backend.js" -type f 2>/dev/null | head -1`,
        { encoding: 'utf8', cwd: __dirname }
      ).trim();
      return result ? [result] : [];
    } catch {
      return [];
    }
  })()
];

let tfjsNodePath = null;
for (const possiblePath of possiblePaths) {
  if (fs.existsSync(possiblePath)) {
    tfjsNodePath = possiblePath;
    break;
  }
}

if (!tfjsNodePath) {
  console.log('⚠️  TensorFlow.js node module not found, skipping patch');
  process.exit(0);
}

try {
  let content = fs.readFileSync(tfjsNodePath, 'utf8');
  
  // Check if already patched
  if (content.includes('// PATCHED: util.isNullOrUndefined')) {
    console.log('✅ TensorFlow.js already patched');
    process.exit(0);
  }
  
  // Add polyfill at the top of the file after imports
  const patchCode = `
// PATCHED: util.isNullOrUndefined polyfill for Node.js compatibility
if (!util_1.isNullOrUndefined) {
  util_1.isNullOrUndefined = function(val) {
    return val === null || val === undefined;
  };
}
if (!util_1.isArray) {
  util_1.isArray = Array.isArray;
}
`;
  
  // Insert patch after util_1 require
  const insertPoint = content.indexOf('var util_1 = require("util");');
  if (insertPoint === -1) {
    console.log('⚠️  Could not find util import, skipping patch');
    process.exit(0);
  }
  
  const nextLine = content.indexOf('\n', insertPoint);
  const newContent = content.slice(0, nextLine + 1) + patchCode + content.slice(nextLine + 1);
  
  fs.writeFileSync(tfjsNodePath, newContent, 'utf8');
  console.log(`✅ TensorFlow.js patched successfully at: ${tfjsNodePath}`);
} catch (error) {
  console.error('❌ Error patching TensorFlow.js:', error.message);
  process.exit(1);
}

