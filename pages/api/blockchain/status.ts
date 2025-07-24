import { NextApiRequest, NextApiResponse } from 'next';
import { blockchainService } from '@/lib/blockchain';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check blockchain connection
    const isConnected = await blockchainService.isConnected();
    
    if (!isConnected) {
      return res.status(200).json({
        success: true,
        status: 'development',
        message: 'Running in development mode with mock blockchain',
        network: {
          name: 'Development Mode',
          chainId: 80001,
          blockNumber: 0,
          gasPrice: '0',
          isCorrectNetwork: true
        },
        contract: {
          address: 'Mock Contract',
          isConfigured: false
        },
        wallet: {
          isConfigured: false,
          hasBalance: false
        },
        timestamp: new Date().toISOString()
      });
    }

    // Get network information
    const networkInfo = await blockchainService.getNetworkInfo();
    
    // Check if we're on the correct network (Polygon Mumbai testnet)
    const isCorrectNetwork = networkInfo.chainId === 80001;
    
    const status = {
      success: true,
      status: 'connected',
      network: {
        name: 'Polygon Mumbai Testnet',
        chainId: networkInfo.chainId,
        blockNumber: networkInfo.blockNumber,
        gasPrice: networkInfo.gasPrice,
        isCorrectNetwork
      },
      contract: {
        address: process.env.POLYGON_CONTRACT_ADDRESS || 'Not configured',
        isConfigured: !!process.env.POLYGON_CONTRACT_ADDRESS
      },
      wallet: {
        isConfigured: !!process.env.POLYGON_PRIVATE_KEY,
        hasBalance: true // In a real app, you'd check actual balance
      },
      timestamp: new Date().toISOString()
    };

    res.status(200).json(status);

  } catch (error) {
    console.error('Blockchain status check error:', error);
    res.status(500).json({
      success: false,
      status: 'error',
      message: 'Failed to check blockchain status',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
} 