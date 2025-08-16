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
  private static generatedIds = new Set<string>(); // In-memory cache for current session

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
  }

  /**
   * Check if QR code ID already exists in database
   */
  private async isQRCodeIdUnique(qrCodeId: string): Promise<boolean> {
    try {
      const { default: QRCode } = await import('./models/QRCode');
      const existingQRCode = await QRCode.findOne({ qrCodeId });
      return !existingQRCode;
    } catch (error) {
      console.error('Error checking QR code uniqueness:', error);
      // If we can't check, assume it's unique to avoid blocking generation
      return true;
    }
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
      let qrCodeId: string;
      let attempts = 0;
      const maxAttempts = 10;
      
      do {
        qrCodeId = this.generateUniqueQRCodeId(uploadId, drugCode, serialNumber);
        attempts++;
        
        // Check if this ID already exists
        const isUnique = await this.isQRCodeIdUnique(qrCodeId);
        if (isUnique) {
          break;
        }
        
        if (attempts >= maxAttempts) {
          throw new Error(`Failed to generate unique QR code ID after ${maxAttempts} attempts`);
        }
        
        // Add a small delay before retrying
        await new Promise(resolve => setTimeout(resolve, 10));
      } while (true);
      
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
    try {
      // Use crypto.randomUUID for guaranteed uniqueness
      const uuid = crypto.randomUUID();
      const timestamp = Date.now();
      const processId = process.pid || Math.floor(Math.random() * 10000);
      
      // Create a unique string combining all elements
      const uniqueString = `${uploadId}-${drugCode}-${serialNumber}-${timestamp}-${processId}-${uuid}`;
      
      // Use SHA-256 hash for better distribution and uniqueness
      const hash = crypto.createHash('sha256').update(uniqueString).digest('hex');
      
      // Take first 8 characters and convert to uppercase for readability
      const shortHash = hash.substring(0, 8).toUpperCase();
      
      // Add a prefix to make it more identifiable
      const qrCodeId = `QR-${shortHash}`;
      
      // Validate the generated ID
      if (!qrCodeId || qrCodeId.length < 5) {
        throw new Error('Generated QR Code ID is invalid');
      }
      
      return qrCodeId;
    } catch (error) {
      console.error('Error generating unique QR code ID:', error);
      // Fallback to a simpler but still unique method
      return this.generateQRCodeIdFallback(uploadId, drugCode, serialNumber);
    }
  }

  /**
   * Generate QR code ID with fallback method (for environments without crypto.randomUUID)
   */
  private generateQRCodeIdFallback(uploadId: string, drugCode: string, serialNumber: number): string {
    const timestamp = Date.now();
    const randomPart = Math.random().toString(36).substring(2, 10);
    const processId = process.pid || Math.floor(Math.random() * 10000);
    const uniqueString = `${uploadId}-${drugCode}-${serialNumber}-${timestamp}-${processId}-${randomPart}`;
    
    // Use SHA-256 hash
    const hash = crypto.createHash('sha256').update(uniqueString).digest('hex');
    const shortHash = hash.substring(0, 8).toUpperCase();
    
    return `QR-${shortHash}`;
  }

  /**
   * Reserve a QR code ID to prevent collisions during batch generation
   */
  private reserveQRCodeId(qrCodeId: string): boolean {
    if (QRCodeService.generatedIds.has(qrCodeId)) {
      return false;
    }
    QRCodeService.generatedIds.add(qrCodeId);
    return true;
  }

  /**
   * Release a reserved QR code ID
   */
  private releaseQRCodeId(qrCodeId: string): void {
    QRCodeService.generatedIds.delete(qrCodeId);
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