#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🚀 Shield Drug Blockchain Setup\n');
console.log('This script will help you configure a real blockchain connection for Avalanche Fuji testnet.\n');

async function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

async function setupBlockchain() {
  try {
    // Choose provider
    console.log('Choose your blockchain provider:');
    console.log('1. Alchemy (Recommended - Free tier available)');
    console.log('2. Infura (Free tier available)');
    console.log('3. QuickNode (Free tier available)');
    console.log('4. Use public RPC (Not recommended for production)');
    
    const providerChoice = await askQuestion('\nEnter your choice (1-4): ');
    
    let rpcUrl = '';
    let providerName = '';
    
    switch (providerChoice) {
      case '1':
        providerName = 'Alchemy';
        console.log('\n📋 Alchemy Setup:');
        console.log('1. Go to https://www.alchemy.com/');
        console.log('2. Sign up for a free account');
        console.log('3. Create a new app');
        console.log('4. Select "Avalanche" network');
        console.log('5. Copy your API key');
        
        const alchemyKey = await askQuestion('\nEnter your Alchemy API key: ');
        rpcUrl = `https://avalanche-fuji.g.alchemy.com/v2/${alchemyKey}`;
        break;
        
      case '2':
        providerName = 'Infura';
        console.log('\n📋 Infura Setup:');
        console.log('1. Go to https://infura.io/');
        console.log('2. Sign up for a free account');
        console.log('3. Create a new project');
        console.log('4. Select "Avalanche" network');
        console.log('5. Copy your project ID');
        
        const infuraProjectId = await askQuestion('\nEnter your Infura project ID: ');
        rpcUrl = `https://avalanche-fuji.infura.io/v3/${infuraProjectId}`;
        break;
        
      case '3':
        providerName = 'QuickNode';
        console.log('\n📋 QuickNode Setup:');
        console.log('1. Go to https://www.quicknode.com/');
        console.log('2. Sign up for a free account');
        console.log('3. Create a new endpoint');
        console.log('4. Select "Avalanche Fuji" network');
        console.log('5. Copy your HTTP provider URL');
        
        const quicknodeUrl = await askQuestion('\nEnter your QuickNode HTTP provider URL: ');
        rpcUrl = quicknodeUrl;
        break;
        
      case '4':
        providerName = 'Public RPC';
        console.log('\n⚠️  Warning: Public RPC endpoints are not recommended for production use.');
        console.log('They may be unreliable and have rate limits.');
        
        const usePublic = await askQuestion('\nDo you want to continue with public RPC? (y/n): ');
        if (usePublic.toLowerCase() !== 'y') {
          console.log('Setup cancelled.');
          rl.close();
          return;
        }
        
        rpcUrl = 'https://api.avax-test.network/ext/bc/C/rpc';
        break;
        
      default:
        console.log('Invalid choice. Setup cancelled.');
        rl.close();
        return;
    }
    
    // Test the connection
    console.log('\n🔗 Testing blockchain connection...');
    
    const { ethers } = require('ethers');
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    
    try {
      const network = await provider.getNetwork();
      const blockNumber = await provider.getBlockNumber();
      const gasPrice = await provider.getFeeData();
      
      console.log('✅ Connection successful!');
      console.log(`Network: ${network.name} (Chain ID: ${network.chainId})`);
      console.log(`Current Block: ${blockNumber}`);
      console.log(`Gas Price: ${gasPrice.gasPrice?.toString() || 'Unknown'} wei`);
      
      if (network.chainId !== 43113n) {
        console.log('⚠️  Warning: You are not connected to Avalanche Fuji testnet!');
        console.log('Expected Chain ID: 43113, Got:', network.chainId.toString());
      }
      
    } catch (error) {
      console.log('❌ Connection failed:', error.message);
      console.log('Please check your API key and try again.');
      rl.close();
      return;
    }
    
    // Get wallet private key
    console.log('\n🔑 Wallet Setup:');
    console.log('You need a wallet with some test AVAX tokens.');
    console.log('1. Install MetaMask: https://metamask.io/');
    console.log('2. Add Avalanche Fuji testnet to MetaMask');
    console.log('3. Get test AVAX from: https://faucet.avax.network/');
    console.log('4. Export your private key (for testing only)');
    
    const privateKey = await askQuestion('\nEnter your wallet private key (0x...): ');
    
    if (!privateKey.startsWith('0x')) {
      console.log('❌ Invalid private key format. Must start with 0x');
      rl.close();
      return;
    }
    
    // Test wallet
    try {
      const wallet = new ethers.Wallet(privateKey, provider);
      const balance = await wallet.getBalance();
      console.log(`✅ Wallet connected! Balance: ${ethers.formatEther(balance)} MATIC`);
      
      if (balance === 0n) {
        console.log('⚠️  Warning: Wallet has 0 MATIC. Get test tokens from the faucet.');
      }
      
    } catch (error) {
      console.log('❌ Invalid private key:', error.message);
      rl.close();
      return;
    }
    
    // Update .env.local
    const envPath = path.join(process.cwd(), '.env.local');
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // Update RPC URL
    envContent = envContent.replace(
          /AVALANCHE_RPC_URL=.*/,
    `AVALANCHE_RPC_URL=${rpcUrl}`
    );
    
    // Update private key
    envContent = envContent.replace(
          /AVALANCHE_PRIVATE_KEY=.*/,
    `AVALANCHE_PRIVATE_KEY=${privateKey}`
    );
    
    // Add provider info
    envContent = envContent.replace(
      /# Blockchain Integration.*/,
      `# Blockchain Integration (${providerName} - Avalanche Fuji Testnet)`
    );
    
    fs.writeFileSync(envPath, envContent);
    
    console.log('\n✅ Configuration updated successfully!');
    console.log(`Provider: ${providerName}`);
    console.log(`RPC URL: ${rpcUrl}`);
    console.log('Private Key: [Hidden for security]');
    
    console.log('\n📝 Next Steps:');
    console.log('1. Deploy the smart contract (see BLOCKCHAIN_SETUP.md)');
    console.log('2. Update AVALANCHE_CONTRACT_ADDRESS in .env.local');
    console.log('3. Restart your development server');
    console.log('4. Test the blockchain integration');
    
    console.log('\n🚀 Your blockchain connection is ready!');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
  } finally {
    rl.close();
  }
}

setupBlockchain(); 