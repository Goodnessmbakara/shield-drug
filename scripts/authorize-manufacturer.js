const { createPublicClient, http, createWalletClient, getContract } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');
const { polygonAmoy } = require('viem/chains');
require('dotenv').config({ path: '.env.local' });

// Smart Contract ABI for authorization functions
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
        "name": "manufacturer",
        "type": "address"
      }
    ],
    "name": "removeAuthorizedManufacturer",
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
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "uploadId",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "drugName",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "batchId",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "quantity",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "manufacturer",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "fileHash",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "expiryDate",
        "type": "uint256"
      }
    ],
    "name": "recordPharmaceuticalBatch",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

async function authorizeManufacturer() {
  try {
    // Get environment variables
    const rpcUrl = process.env.POLYGON_RPC_URL;
    const privateKey = process.env.POLYGON_PRIVATE_KEY;
    const contractAddress = process.env.POLYGON_CONTRACT_ADDRESS;

    if (!rpcUrl || !privateKey || !contractAddress) {
      console.error('❌ Missing required environment variables:');
      console.error('   POLYGON_RPC_URL:', rpcUrl ? '✅ Set' : '❌ Missing');
      console.error('   POLYGON_PRIVATE_KEY:', privateKey ? '✅ Set' : '❌ Missing');
      console.error('   POLYGON_CONTRACT_ADDRESS:', contractAddress ? '✅ Set' : '❌ Missing');
      process.exit(1);
    }

    console.log('🔗 Initializing blockchain connection...');

    // Create public client
    const publicClient = createPublicClient({
      chain: polygonAmoy,
      transport: http(rpcUrl),
    });

    // Create wallet client
    const formattedPrivateKey = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;
    const account = privateKeyToAccount(formattedPrivateKey);
    
    const walletClient = createWalletClient({
      chain: polygonAmoy,
      transport: http(rpcUrl),
      account: account,
    });

    console.log('✅ Blockchain clients initialized');
    console.log('👤 Account address:', account.address);

    // Create contract instance
    const contract = getContract({
      address: contractAddress,
      abi: CONTRACT_ABI,
      publicClient,
      walletClient,
    });

    console.log('📋 Contract address:', contractAddress);

    // Check if the account is already authorized
    console.log('🔍 Checking current authorization status...');
    const isAuthorized = await publicClient.readContract({
      address: contractAddress,
      abi: CONTRACT_ABI,
      functionName: 'authorizedManufacturers',
      args: [account.address]
    });
    
    if (isAuthorized) {
      console.log('✅ Account is already authorized as a manufacturer');
      return;
    }

    // Check if the account is the contract owner
    console.log('👑 Checking contract ownership...');
    const owner = await publicClient.readContract({
      address: contractAddress,
      abi: CONTRACT_ABI,
      functionName: 'owner'
    });
    
    if (owner.toLowerCase() === account.address.toLowerCase()) {
      console.log('✅ Account is the contract owner, proceeding with authorization...');
    } else {
      console.log('❌ Account is not the contract owner');
      console.log('   Owner address:', owner);
      console.log('   Your address:', account.address);
      console.log('💡 Only the contract owner can authorize manufacturers');
      process.exit(1);
    }

    // Add the account as an authorized manufacturer
    console.log('🔐 Adding account as authorized manufacturer...');
    
    const { request } = await publicClient.simulateContract({
      address: contractAddress,
      abi: CONTRACT_ABI,
      functionName: 'addAuthorizedManufacturer',
      args: [account.address],
      account: account.address
    });
    
    const hash = await walletClient.writeContract(request);
    
    console.log('📝 Transaction submitted:', hash);
    console.log('⏳ Waiting for confirmation...');

    // Wait for transaction confirmation
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    
    if (receipt.status === 'success') {
      console.log('✅ Transaction confirmed!');
      console.log('   Block number:', receipt.blockNumber);
      console.log('   Gas used:', receipt.gasUsed.toString());
      
      // Verify authorization
      const isNowAuthorized = await publicClient.readContract({
        address: contractAddress,
        abi: CONTRACT_ABI,
        functionName: 'authorizedManufacturers',
        args: [account.address]
      });
      
      if (isNowAuthorized) {
        console.log('✅ Account successfully authorized as manufacturer!');
        console.log('🎉 You can now upload pharmaceutical batches');
      } else {
        console.log('❌ Authorization verification failed');
      }
    } else {
      console.log('❌ Transaction failed');
    }

  } catch (error) {
    console.error('❌ Error authorizing manufacturer:', error);
    
    if (error.message.includes('Only owner can call this function')) {
      console.log('💡 Solution: Only the contract owner can authorize manufacturers');
      console.log('   You need to use the wallet that deployed the contract');
    } else if (error.message.includes('insufficient funds')) {
      console.log('💡 Solution: Ensure your wallet has enough MATIC for gas fees');
    } else if (error.message.includes('nonce')) {
      console.log('💡 Solution: Try again in a few seconds (nonce issue)');
    }
  }
}

// Run the authorization
authorizeManufacturer(); 