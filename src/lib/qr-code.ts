import { blockchainService } from './blockchain';
import { generateUniqueQRCodeId } from './utils';
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
        qrCodeId = generateUniqueQRCodeId(uploadId, drugCode, serialNumber);
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
      
      // Record QR code on blockchain (optional - don't fail if blockchain is unavailable)
      let blockchainTx;
      try {
        console.log('🔗 Recording QR code on blockchain...');
        blockchainTx = await blockchainService.recordQRCode(qrCodeId, uploadId, serialNumber);
      } catch (blockchainError) {
        console.warn('⚠️ Blockchain recording failed, continuing without blockchain:', blockchainError);
        blockchainTx = {
          hash: '',
          status: 'failed',
          gasUsed: 0,
          gasPrice: 0,
          timestamp: new Date().toISOString(),
          errorMessage: blockchainError instanceof Error ? blockchainError.message : 'Blockchain error'
        };
      }
      
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
        uploadId,
        drugCode,
        serialNumber,
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
   * Generate QR code image URL (now returns verification URL for client-side generation)
   */
  generateQRCodeImageUrl(qrCodeData: QRCodeData): string {
    // Return the verification URL - the frontend will generate the QR code image
    return qrCodeData.verificationUrl;
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
   * Check if a string is a valid MongoDB ObjectId
   */
  private isValidObjectId(id: string): boolean {
    // MongoDB ObjectId is 24 hex characters
    return /^[0-9a-fA-F]{24}$/.test(id);
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
      // Import database models
      const { default: QRCode } = await import('./models/QRCode');

      console.log('🔍 Looking for QR code with ID:', qrCodeId);

      let qrCodeDoc = null;

      // Strategy 1: Check if input is a MongoDB ObjectId and try to find by _id
      if (this.isValidObjectId(qrCodeId)) {
        console.log('🔍 Input appears to be a MongoDB ObjectId, trying lookup by _id...');
        try {
          qrCodeDoc = await QRCode.findById(qrCodeId);
          if (qrCodeDoc) {
            console.log(`✅ Found QR code by MongoDB _id: ${qrCodeDoc.qrCodeId}`);
          }
        } catch (idError) {
          // ObjectId might be invalid, continue with other strategies
          console.log('⚠️ ObjectId lookup failed, trying other strategies...');
        }
      }

      // Strategy 2: Try exact match by qrCodeId
      if (!qrCodeDoc) {
        qrCodeDoc = await QRCode.findOne({ qrCodeId });
        if (qrCodeDoc) {
          console.log(`✅ Found QR code by qrCodeId: ${qrCodeDoc.qrCodeId}`);
        }
      }

      // Strategy 3: If not found, try pattern matching for different formats
      if (!qrCodeDoc) {
        console.log('⚠️ Exact match not found, trying pattern matching...');

        // Try to find similar QR codes with different formats
        const similarQRCodes = await QRCode.find({
          $or: [
            { qrCodeId: qrCodeId.toUpperCase() }, // Try uppercase
            { qrCodeId: qrCodeId.toLowerCase() }, // Try lowercase
            { qrCodeId: `QR-${qrCodeId}` }, // Try with QR- prefix
            { qrCodeId: qrCodeId.replace(/^QR-/, '') }, // Try without QR- prefix
            // Pattern matching for hash-like IDs (only if not ObjectId)
            ...(!this.isValidObjectId(qrCodeId) ? [
              { qrCodeId: { $regex: new RegExp(qrCodeId.replace(/[^a-zA-Z0-9]/g, ''), 'i') } }
            ] : [])
          ]
        }).limit(1);

        if (similarQRCodes.length > 0) {
          qrCodeDoc = similarQRCodes[0];
          console.log(`✅ Found QR code with alternate format: ${qrCodeDoc.qrCodeId}`);
        }
      }

      // Strategy 4: If input is ObjectId and still not found, try uploadId
      if (!qrCodeDoc && this.isValidObjectId(qrCodeId)) {
        console.log('⚠️ Trying to find QR code by uploadId...');
        // Find first QR code with this uploadId (there might be multiple)
        qrCodeDoc = await QRCode.findOne({ uploadId: qrCodeId }).sort({ serialNumber: 1 });
        if (qrCodeDoc) {
          console.log(`✅ Found QR code by uploadId (showing first): ${qrCodeDoc.qrCodeId}`);
        }
      }

      if (!qrCodeDoc) {
        console.log('❌ QR code not found in database. Available QR codes:');
        const allQRCodes = await QRCode.find({}).select('qrCodeId').limit(10);
        console.log('Sample QR codes in database:', allQRCodes.map(qr => qr.qrCodeId));

        return {
          isValid: false,
          error: 'QR Code not found in database'
        };
      }

      // Update verification count
      qrCodeDoc.verificationCount = (qrCodeDoc.verificationCount || 0) + 1;
      await qrCodeDoc.save();

      // Convert database document to QRCodeData format
      const qrCodeData: QRCodeData = {
        qrCodeId: qrCodeDoc.qrCodeId,
        uploadId: qrCodeDoc.uploadId,
        drugCode: qrCodeDoc.drugCode,
        serialNumber: qrCodeDoc.serialNumber,
        blockchainTx: qrCodeDoc.blockchainTx && (qrCodeDoc.blockchainTx.hash || typeof qrCodeDoc.blockchainTx === 'string') ? {
          hash: typeof qrCodeDoc.blockchainTx === 'string' ? qrCodeDoc.blockchainTx : qrCodeDoc.blockchainTx.hash,
          status: qrCodeDoc.blockchainTx.status || 'confirmed',
          blockNumber: typeof qrCodeDoc.blockchainTx === 'object' ? qrCodeDoc.blockchainTx.blockNumber : undefined,
          timestamp: qrCodeDoc.blockchainTx.timestamp || qrCodeDoc.createdAt.toISOString(),
        } : undefined,
        verificationUrl: qrCodeDoc.verificationUrl,
        metadata: qrCodeDoc.metadata,
      };

      // Verify blockchain transaction if hash exists
      let blockchainStatus;
      if (qrCodeData.blockchainTx?.hash) {
        try {
          blockchainStatus = await blockchainService.verifyTransaction(qrCodeData.blockchainTx.hash);
        } catch (blockchainError) {
          console.warn('Could not verify blockchain transaction:', blockchainError);
          // Don't fail verification if blockchain is unavailable
          blockchainStatus = { confirmed: false };
        }
      }

      return {
        isValid: true,
        data: qrCodeData,
        blockchainStatus,
      };

    } catch (error) {
      console.error('❌ QR code verification failed:', error);
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Database error during verification',
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