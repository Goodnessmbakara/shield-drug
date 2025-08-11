const { createPublicClient, http } = require('viem');
const { polygonAmoy } = require('viem/chains');
require('dotenv').config({ path: '.env.local' });

// Smart Contract ABI for checking authorization
const CONTRACT_ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "authorizedManufacturers",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

async function checkAuthorization() {
  try {
    // Get environment variables
    const rpcUrl = process.env.POLYGON_RPC_URL;
    const privateKey = process.env.POLYGON_PRIVATE_KEY;
    const contractAddress = process.env.POLYGON_CONTRACT_ADDRESS;

    if (!rpcUrl || !privateKey || !contractAddress) {
      console.error('❌ Missing required environment variables');
      process.exit(1);
    }

    console.log('🔗 Checking blockchain authorization status...');

    // Create public client
    const publicClient = createPublicClient({
      chain: polygonAmoy,
      transport: http(rpcUrl),
    });

    // Derive account from private key
    const { privateKeyToAccount } = require('viem/accounts');
    const formattedPrivateKey = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;
    const account = privateKeyToAccount(formattedPrivateKey);

    console.log('👤 Account address:', account.address);
    console.log('📋 Contract address:', contractAddress);

    // Check if the account is authorized
    console.log('🔍 Checking authorization status...');
    const isAuthorized = await publicClient.readContract({
      address: contractAddress,
      abi: CONTRACT_ABI,
      functionName: 'authorizedManufacturers',
      args: [account.address]
    });

    console.log('✅ Authorization status:', isAuthorized ? 'AUTHORIZED' : 'NOT AUTHORIZED');

    // Check contract owner
    console.log('👑 Checking contract ownership...');
    const owner = await publicClient.readContract({
      address: contractAddress,
      abi: CONTRACT_ABI,
      functionName: 'owner'
    });

    console.log('📋 Contract owner:', owner);
    console.log('👤 Your address:', account.address);
    console.log('🔐 Is owner:', owner.toLowerCase() === account.address.toLowerCase() ? 'YES' : 'NO');

    // Provide recommendations
    console.log('\n📋 Summary:');
    if (isAuthorized) {
      console.log('✅ Your wallet is authorized as a manufacturer');
      console.log('🎉 You can upload pharmaceutical batches');
    } else {
      console.log('❌ Your wallet is NOT authorized as a manufacturer');
      console.log('💡 To fix this:');
      
      if (owner.toLowerCase() === account.address.toLowerCase()) {
        console.log('   1. You are the contract owner');
        console.log('   2. Run: node scripts/authorize-manufacturer.js');
        console.log('   3. Note: This may fail due to RPC limitations');
        console.log('   4. Alternative: Use a different RPC provider that supports transactions');
      } else {
        console.log('   1. You are NOT the contract owner');
        console.log('   2. Contact the contract owner to authorize your address');
        console.log('   3. Owner address:', owner);
      }
    }

  } catch (error) {
    console.error('❌ Error checking authorization:', error);
  }
}

// Run the check
checkAuthorization(); 