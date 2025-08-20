#!/usr/bin/env node

/**
 * Patch script to fix TensorFlow.js Node.js backend compatibility issues
 * with newer versions of Node.js that removed util.isNullOrUndefined
 */

const fs = require('fs');
const path = require('path');

function patchTensorFlowJsNode() {
  const nodeModulesPath = path.join(__dirname, '..', 'node_modules');
  
  // Find the TensorFlow.js Node.js backend file
  const backendFilePaths = [
    path.join(nodeModulesPath, '.pnpm', '@tensorflow+tfjs-node@4.17.0_seedrandom@3.0.5', 'node_modules', '@tensorflow', 'tfjs-node', 'dist', 'nodejs_kernel_backend.js'),
    path.join(nodeModulesPath, '.pnpm', '@tensorflow+tfjs-node@4.21.0_seedrandom@3.0.5', 'node_modules', '@tensorflow', 'tfjs-node', 'dist', 'nodejs_kernel_backend.js'),
    path.join(nodeModulesPath, '.pnpm', '@tensorflow+tfjs-node@4.22.0_seedrandom@3.0.5', 'node_modules', '@tensorflow', 'tfjs-node', 'dist', 'nodejs_kernel_backend.js'),
    path.join(nodeModulesPath, '@tensorflow', 'tfjs-node', 'dist', 'nodejs_kernel_backend.js')
  ];
  
  for (const backendPath of backendFilePaths) {
    if (fs.existsSync(backendPath)) {
      console.log(`Patching TensorFlow.js Node.js backend at: ${backendPath}`);
      
      let content = fs.readFileSync(backendPath, 'utf8');
      
      // Replace util_1.isNullOrUndefined with inline function
      content = content.replace(
        /util_1\.isNullOrUndefined/g,
        'function(x) { return x == null; }'
      );
      
      // Replace util_1.isArray with Array.isArray
      content = content.replace(
        /util_1\.isArray/g,
        'Array.isArray'
      );
      
      fs.writeFileSync(backendPath, content, 'utf8');
      console.log(`Successfully patched: ${backendPath}`);
    }
  }
}

if (require.main === module) {
  patchTensorFlowJsNode();
}

module.exports = { patchTensorFlowJsNode };