import { blockchainService } from './blockchain';
import crypto from 'crypto';

export interface QRCodeData {
  qrCodeId: string;
  uploadId: string;
  drugCode: string;
  serialNumber: number;
  blockchainTx?: {
    hash: string;
    status: string;
    blockNumber?: number;
    timestamp: string;
  };
  verificationUrl: string;
  metadata: {
    drugName: string;
    batchId: string;
    manufacturer: string;
    expiryDate: string;
    quantity: number;
  };
}

export class QRCodeService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
  }

  /**
   * Generate QR code with real blockchain transaction
   */
  async generateQRCode(
    uploadId: string,
    drugCode: string,
    serialNumber: number,
    metadata: {
      drugName: string;
      batchId: string;
      manufacturer: string;
      expiryDate: string;
      quantity: number;
    }
  ): Promise<QRCodeData> {
    try {
      // Generate unique QR code ID with improved uniqueness
      const qrCodeId = this.generateUniqueQRCodeId(uploadId, drugCode, serialNumber);
      
      // Record QR code on blockchain
      console.log('🔗 Recording QR code on blockchain...');
      const blockchainTx = await blockchainService.recordQRCode(qrCodeId, uploadId, serialNumber);
      
      // Create verification URL
      const verificationUrl = `${this.baseUrl}/verify/${qrCodeId}`;
      
      // Generate QR code data
      const qrCodeData: QRCodeData = {
        qrCodeId,
        uploadId,
        drugCode,
        serialNumber,
        blockchainTx: blockchainTx.status === 'confirmed' ? {
          hash: blockchainTx.hash,
          status: blockchainTx.status,
          blockNumber: blockchainTx.blockNumber,
          timestamp: blockchainTx.timestamp,
        } : undefined,
        verificationUrl,
        metadata,
      };

      console.log('✅ QR code generated with blockchain transaction:', {
        qrCodeId,
        blockchainHash: blockchainTx.hash,
        status: blockchainTx.status,
      });

      return qrCodeData;

    } catch (error) {
      console.error('❌ Failed to generate QR code:', error);
      throw error;
    }
  }

  /**
   * Generate QR code image URL
   */
  generateQRCodeImageUrl(qrCodeData: QRCodeData): string {
    const qrData = JSON.stringify(qrCodeData, null, 0);
    const encodedData = encodeURIComponent(qrData);
    
    // Use QR code API to generate image
    const qrApiUrl = process.env.QR_CODE_API_URL || 'https://api.qrserver.com/v1/create-qr-code/';
    return `${qrApiUrl}?data=${encodedData}&size=300x300&format=png&margin=10`;
  }

  /**
   * Generate unique QR code ID with improved uniqueness
   */
  private generateUniqueQRCodeId(uploadId: string, drugCode: string, serialNumber: number): string {
    // Use crypto.randomUUID for guaranteed uniqueness
    const uuid = crypto.randomUUID();
    const timestamp = Date.now();
    
    // Create a unique string combining all elements
    const uniqueString = `${uploadId}-${drugCode}-${serialNumber}-${timestamp}-${uuid}`;
    
    // Use SHA-256 hash for better distribution and uniqueness
    const hash = crypto.createHash('sha256').update(uniqueString).digest('hex');
    
    // Take first 8 characters and convert to uppercase for readability
    const shortHash = hash.substring(0, 8).toUpperCase();
    
    // Add a prefix to make it more identifiable
    return `QR-${shortHash}`;
  }

  /**
   * Generate QR code ID with fallback method (for environments without crypto.randomUUID)
   */
  private generateQRCodeIdFallback(uploadId: string, drugCode: string, serialNumber: number): string {
    const timestamp = Date.now();
    const randomPart = Math.random().toString(36).substring(2, 10);
    const uniqueString = `${uploadId}-${drugCode}-${serialNumber}-${timestamp}-${randomPart}`;
    
    // Use SHA-256 hash
    const hash = crypto.createHash('sha256').update(uniqueString).digest('hex');
    const shortHash = hash.substring(0, 8).toUpperCase();
    
    return `QR-${shortHash}`;
  }

  /**
   * Verify QR code data
   */
  async verifyQRCode(qrCodeId: string): Promise<{
    isValid: boolean;
    data?: QRCodeData;
    blockchainStatus?: {
      confirmed: boolean;
      blockNumber?: number;
      gasUsed?: number;
    };
    error?: string;
  }> {
    try {
      // In a real implementation, you would:
      // 1. Decode QR code data
      // 2. Verify against blockchain
      // 3. Check if transaction is confirmed
      
      // For now, we'll simulate verification
      const mockData: QRCodeData = {
        qrCodeId,
        uploadId: 'mock-upload-id',
        drugCode: 'MOCK-DRUG-001',
        serialNumber: 1,
        blockchainTx: {
          hash: '0x' + Math.random().toString(16).substring(2, 10) + '...' + Math.random().toString(16).substring(2, 10),
          status: 'confirmed',
          blockNumber: Math.floor(Math.random() * 1000000) + 45000000,
          timestamp: new Date().toISOString(),
        },
        verificationUrl: `${this.baseUrl}/verify/${qrCodeId}`,
        metadata: {
          drugName: 'Mock Drug',
          batchId: 'MOCK-BATCH-001',
          manufacturer: 'Mock Manufacturer',
          expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          quantity: 1000,
        },
      };

      // Verify blockchain transaction
      let blockchainStatus;
      if (mockData.blockchainTx?.hash) {
        blockchainStatus = await blockchainService.verifyTransaction(mockData.blockchainTx.hash);
      }

      return {
        isValid: true,
        data: mockData,
        blockchainStatus,
      };

    } catch (error) {
      console.error('❌ QR code verification failed:', error);
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Generate QR codes for an entire batch
   */
  async generateBatchQRCodes(
    uploadId: string,
    drugCode: string,
    quantity: number,
    metadata: {
      drugName: string;
      batchId: string;
      manufacturer: string;
      expiryDate: string;
    }
  ): Promise<QRCodeData[]> {
    const qrCodes: QRCodeData[] = [];
    
    console.log(`🔄 Generating ${quantity} QR codes for batch...`);
    
    for (let i = 1; i <= quantity; i++) {
      try {
        const qrCode = await this.generateQRCode(uploadId, drugCode, i, {
          ...metadata,
          quantity: 1, // Each QR code represents 1 unit
        });
        
        qrCodes.push(qrCode);
        
        // Add small delay to avoid rate limiting
        if (i % 10 === 0) {
          console.log(`✅ Generated ${i}/${quantity} QR codes`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
      } catch (error) {
        console.error(`❌ Failed to generate QR code ${i}:`, error);
        // Continue with other QR codes
      }
    }
    
    console.log(`🎉 Successfully generated ${qrCodes.length} QR codes`);
    return qrCodes;
  }

  /**
   * Get QR code statistics
   */
  async getQRCodeStats(): Promise<{
    totalGenerated: number;
    totalVerified: number;
    blockchainTransactions: number;
    averageGasUsed: number;
  }> {
    // Mock statistics for demo
    return {
      totalGenerated: 1250,
      totalVerified: 1180,
      blockchainTransactions: 1250,
      averageGasUsed: 45000,
    };
  }
}

// Export singleton instance
export const qrCodeService = new QRCodeService(); 