const { createPublicClient, http, createWalletClient } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');
const { avalancheFuji } = require('viem/chains');
require('dotenv').config({ path: '.env.local' });

// Smart Contract ABI for authorization
const CONTRACT_ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "manufacturer",
        "type": "address"
      }
    ],
    "name": "addAuthorizedManufacturer",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
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

async function authorizeManufacturer() {
  try {
    // Get environment variables
    const rpcUrl = process.env.AVALANCHE_RPC_URL || 'https://api.avax-test.network/ext/bc/C/rpc';
    const contractAddress = process.env.AVALANCHE_CONTRACT_ADDRESS;
    const privateKey = process.env.AVALANCHE_PRIVATE_KEY;
    
    if (!contractAddress || contractAddress === '0x1234567890123456789012345678901234567890') {
      console.error('❌ Contract address not configured. Please set AVALANCHE_CONTRACT_ADDRESS in .env.local');
      return;
    }

    if (!privateKey || privateKey === 'your-private-key-here') {
      console.error('❌ Private key not configured. Please set AVALANCHE_PRIVATE_KEY in .env.local');
      return;
    }

    console.log('🔗 Connecting to Avalanche Fuji testnet...');
    console.log('RPC URL:', rpcUrl);
    console.log('Contract Address:', contractAddress);

    // Initialize clients
    const publicClient = createPublicClient({
      chain: avalancheFuji,
      transport: http(rpcUrl),
    });

    const formattedPrivateKey = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;
    const account = privateKeyToAccount(formattedPrivateKey);
    const walletClient = createWalletClient({
      chain: avalancheFuji,
      transport: http(rpcUrl),
      account: account,
    });

    console.log('✅ Connected to blockchain');
    console.log('Wallet Address:', account.address);

    // Check if wallet is already authorized
    console.log('🔍 Checking current authorization status...');
    const isAuthorized = await publicClient.readContract({
      address: contractAddress,
      abi: CONTRACT_ABI,
      functionName: 'authorizedManufacturers',
      args: [account.address],
    });

    if (isAuthorized) {
      console.log('✅ Wallet is already authorized as manufacturer');
      return;
    }

    // Check if wallet is the contract owner
    console.log('🔍 Checking contract ownership...');
    const owner = await publicClient.readContract({
      address: contractAddress,
      abi: CONTRACT_ABI,
      functionName: 'owner',
    });

    if (owner.toLowerCase() === account.address.toLowerCase()) {
      console.log('✅ Wallet is the contract owner');
      console.log('🔧 Authorizing wallet as manufacturer...');
      
      // Authorize the wallet as manufacturer
      const hash = await walletClient.writeContract({
        address: contractAddress,
        abi: CONTRACT_ABI,
        functionName: 'addAuthorizedManufacturer',
        args: [account.address],
      });

      console.log('⏳ Transaction submitted:', hash);
      
      // Wait for transaction confirmation
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      console.log('✅ Transaction confirmed in block:', receipt.blockNumber);
      
      // Verify authorization
      const newAuthStatus = await publicClient.readContract({
        address: contractAddress,
        abi: CONTRACT_ABI,
        functionName: 'authorizedManufacturers',
        args: [account.address],
      });

      if (newAuthStatus) {
        console.log('✅ Wallet successfully authorized as manufacturer!');
        console.log('🎉 You can now use the recordQRCode function');
      } else {
        console.error('❌ Authorization failed');
      }

    } else {
      console.error('❌ Wallet is not the contract owner');
      console.log('Contract Owner:', owner);
      console.log('Your Wallet:', account.address);
      console.log('💡 Only the contract owner can authorize manufacturers');
    }

  } catch (error) {
    console.error('❌ Error authorizing manufacturer:', error);
    if (error.message.includes('insufficient funds')) {
      console.log('💡 Make sure your wallet has enough AVAX for gas fees');
    }
  }
}

// Run the script
authorizeManufacturer(); 