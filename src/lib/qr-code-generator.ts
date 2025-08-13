import QRCode from 'qrcode';

export interface QRCodeData {
  qrCodeId: string;
  drug: string;
  batchId: string;
  manufacturer: string;
  expiryDate: string;
  verificationUrl: string;
  serialNumber?: number;
}

export class QRCodeGenerator {
  /**
   * Generate a QR code as a data URL
   */
  static async generateQRCodeDataURL(data: QRCodeData): Promise<string> {
    try {
      const qrData = {
        qrCodeId: data.qrCodeId,
        drug: data.drug,
        batchId: data.batchId,
        manufacturer: data.manufacturer,
        expiryDate: data.expiryDate,
        verificationUrl: data.verificationUrl,
        serialNumber: data.serialNumber
      };

      const qrString = JSON.stringify(qrData);
      
      const dataURL = await QRCode.toDataURL(qrString, {
        errorCorrectionLevel: 'M',
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        width: 256
      });

      return dataURL;
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw new Error('Failed to generate QR code');
    }
  }

  /**
   * Generate a QR code as a canvas element
   */
  static async generateQRCodeCanvas(data: QRCodeData, canvas: HTMLCanvasElement): Promise<void> {
    try {
      const qrData = {
        qrCodeId: data.qrCodeId,
        drug: data.drug,
        batchId: data.batchId,
        manufacturer: data.manufacturer,
        expiryDate: data.expiryDate,
        verificationUrl: data.verificationUrl,
        serialNumber: data.serialNumber
      };

      const qrString = JSON.stringify(qrData);
      
      await QRCode.toCanvas(canvas, qrString, {
        errorCorrectionLevel: 'M',
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        width: 256
      });
    } catch (error) {
      console.error('Error generating QR code canvas:', error);
      throw new Error('Failed to generate QR code canvas');
    }
  }

  /**
   * Generate a QR code as a blob
   */
  static async generateQRCodeBlob(data: QRCodeData): Promise<Blob> {
    try {
      const qrData = {
        qrCodeId: data.qrCodeId,
        drug: data.drug,
        batchId: data.batchId,
        manufacturer: data.manufacturer,
        expiryDate: data.expiryDate,
        verificationUrl: data.verificationUrl,
        serialNumber: data.serialNumber
      };

      const qrString = JSON.stringify(qrData);
      
      const canvas = document.createElement('canvas');
      await QRCode.toCanvas(canvas, qrString, {
        errorCorrectionLevel: 'M',
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        width: 256
      });

      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            throw new Error('Failed to create blob from canvas');
          }
        }, 'image/png');
      });
    } catch (error) {
      console.error('Error generating QR code blob:', error);
      throw new Error('Failed to generate QR code blob');
    }
  }

  /**
   * Download a QR code as a PNG file
   */
  static async downloadQRCode(data: QRCodeData, filename?: string): Promise<void> {
    try {
      const blob = await this.generateQRCodeBlob(data);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || `qr-code-${data.qrCodeId}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading QR code:', error);
      throw new Error('Failed to download QR code');
    }
  }

  /**
   * Generate multiple QR codes for a batch
   */
  static async generateBatchQRCodes(
    batchData: Omit<QRCodeData, 'qrCodeId' | 'serialNumber'>,
    quantity: number
  ): Promise<{ qrCodeId: string; dataURL: string; serialNumber: number }[]> {
    const results = [];
    
    for (let i = 1; i <= quantity; i++) {
      const qrCodeId = `${batchData.batchId}-${i.toString().padStart(6, '0')}`;
      const qrData: QRCodeData = {
        ...batchData,
        qrCodeId,
        serialNumber: i
      };

      try {
        const dataURL = await this.generateQRCodeDataURL(qrData);
        results.push({
          qrCodeId,
          dataURL,
          serialNumber: i
        });
      } catch (error) {
        console.error(`Failed to generate QR code ${i}:`, error);
        // Continue with next QR code
      }
    }

    return results;
  }
}
