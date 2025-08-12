#!/usr/bin/env node

const { createPublicClient, http, createWalletClient } = require('viem');
const { avalancheFuji } = require('viem/chains');

async function testBlockchainConnection() {
  console.log('🔗 Testing Blockchain Connection with Viem\n');
  
  // Check environment variables
  const rpcUrl = process.env.AVALANCHE_RPC_URL;
  const privateKey = process.env.AVALANCHE_PRIVATE_KEY;
  
  console.log('📋 Environment Check:');
  console.log(`RPC URL: ${rpcUrl ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`Private Key: ${privateKey && privateKey !== 'your-private-key-here' ? '✅ Configured' : '❌ Not configured'}`);
  
  if (!rpcUrl || rpcUrl.includes('your-')) {
    console.log('\n❌ Please configure your blockchain connection first.');
    console.log('💡 Run: node scripts/setup-blockchain.js');
    return;
  }
  
  try {
    // Test provider connection
    console.log('\n🔗 Testing RPC Connection...');
      const publicClient = createPublicClient({
    chain: avalancheFuji,
    transport: http(rpcUrl),
  });
    
    const blockNumber = await publicClient.getBlockNumber();
    const gasPrice = await publicClient.getGasPrice();
    const chainId = avalancheFuji.id;
    
    console.log('✅ RPC Connection Successful!');
    console.log(`Network: ${avalancheFuji.name} (Chain ID: ${chainId})`);
    console.log(`Current Block: ${blockNumber}`);
    console.log(`Gas Price: ${gasPrice} wei`);
    
    if (chainId !== 80002) {
      console.log('⚠️  Warning: Not connected to Avalanche Fuji testnet!');
      console.log('Expected Chain ID: 80002, Got:', chainId);
    } else {
      console.log('✅ Connected to Avalanche Fuji testnet!');
    }
    
    // Test wallet if private key is configured
    if (privateKey && privateKey !== 'your-private-key-here') {
      console.log('\n🔑 Testing Wallet Connection...');
      
      try {
        // Ensure private key has 0x prefix
        const formattedPrivateKey = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;
        
        // Import privateKeyToAccount to derive address from private key
        const { privateKeyToAccount } = require('viem/accounts');
        const account = privateKeyToAccount(formattedPrivateKey);
        
        const walletClient = createWalletClient({
          chain: avalancheFuji,
          transport: http(rpcUrl),
          account: account,
        });
        
        const address = account.address;
        const balance = await publicClient.getBalance({ address });
        
        console.log('✅ Wallet Connection Successful!');
        console.log(`Address: ${address}`);
        console.log(`Balance: ${balance} wei (${balance / BigInt(10**18)} MATIC)`);
        
        if (balance === 0n) {
          console.log('⚠️  Warning: Wallet has 0 MATIC');
          console.log('💡 Get test tokens from: https://faucet.avax.network/');
        } else {
          console.log('✅ Wallet has sufficient balance for transactions');
        }
        
      } catch (error) {
        console.log('❌ Wallet Connection Failed:', error.message);
      }
    }
    
    // Test API endpoints
    console.log('\n🌐 Testing API Endpoints...');
    
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);
    
    try {
      const { stdout: statusOutput } = await execAsync('curl -s http://localhost:3001/api/blockchain/status');
      const status = JSON.parse(statusOutput);
      
      if (status.success) {
        console.log('✅ Blockchain Status API: Working');
        console.log(`Status: ${status.status}`);
        console.log(`Network: ${status.network?.name || 'Unknown'}`);
      } else {
        console.log('❌ Blockchain Status API: Failed');
        console.log('Error:', status.message);
      }
      
    } catch (error) {
      console.log('❌ API Test Failed: Make sure the development server is running');
      console.log('💡 Run: npm run dev');
    }
    
    console.log('\n🎉 Blockchain Connection Test Complete!');
    
    if (chainId === 80002 && privateKey && privateKey !== 'your-private-key-here') {
      console.log('\n✅ Your blockchain is ready for real transactions!');
      console.log('🚀 You can now:');
      console.log('   • Upload pharmaceutical batches');
      console.log('   • Generate QR codes');
      console.log('   • Verify transactions on blockchain');
    } else {
      console.log('\n⚠️  Some configuration is missing:');
      if (chainId !== 80002) {
        console.log('   • Wrong network (should be Avalanche Fuji)');
      }
      if (!privateKey || privateKey === 'your-private-key-here') {
        console.log('   • Private key not configured');
      }
      console.log('\n💡 Run: node scripts/setup-blockchain.js');
    }
    
  } catch (error) {
    console.log('❌ Connection Test Failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check your RPC URL in .env.local');
    console.log('2. Make sure your API key is valid');
    console.log('3. Try a different provider (Alchemy, Infura, QuickNode)');
    console.log('4. Check your internet connection');
    console.log('\n📖 See scripts/setup-alchemy.md for setup instructions');
  }
}

// Load environment variables
require('dotenv').config({ path: '.env.local' });

testBlockchainConnection(); 