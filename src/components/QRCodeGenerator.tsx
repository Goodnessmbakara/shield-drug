import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';

interface QRCodeGeneratorProps {
  data: string;
  size?: number;
  className?: string;
  alt?: string;
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  margin?: number;
  color?: {
    dark?: string;
    light?: string;
  };
}

export default function QRCodeGenerator({
  data,
  size = 200,
  className = '',
  alt = 'QR Code',
  errorCorrectionLevel = 'M',
  margin = 4,
  color = {
    dark: '#000000',
    light: '#FFFFFF'
  }
}: QRCodeGeneratorProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!data) {
      setError('No data provided for QR code generation');
      setIsLoading(false);
      return;
    }

    const generateQRCode = async () => {
      try {
        setIsLoading(true);
        setError('');

        const url = await QRCode.toDataURL(data, {
          width: size,
          margin: margin,
          color: color,
          errorCorrectionLevel: errorCorrectionLevel,
        });

        setQrCodeUrl(url);
      } catch (err) {
        console.error('QR Code generation failed:', err);
        setError('Failed to generate QR code');
      } finally {
        setIsLoading(false);
      }
    };

    generateQRCode();
  }, [data, size, margin, color, errorCorrectionLevel]);

  if (isLoading) {
    return (
      <div 
        className={`flex items-center justify-center bg-gray-100 rounded ${className}`}
        style={{ width: size, height: size }}
      >
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div 
        className={`flex items-center justify-center bg-red-50 border border-red-200 rounded text-red-600 text-sm ${className}`}
        style={{ width: size, height: size }}
      >
        <span className="text-center px-2">{error}</span>
      </div>
    );
  }

  return (
    <img
      src={qrCodeUrl}
      alt={alt}
      className={`rounded ${className}`}
      style={{ width: size, height: size }}
      onError={() => setError('Failed to load QR code image')}
    />
  );
}

// Hook for downloading QR codes
export function useQRCodeDownload() {
  const downloadQRCode = async (
    data: string,
    filename: string = 'qrcode.png',
    size: number = 400
  ) => {
    try {
      const url = await QRCode.toDataURL(data, {
        width: size,
        margin: 4,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'H', // High error correction for downloads
      });

      // Create download link
      const link = document.createElement('a');
      link.download = filename;
      link.href = url;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Failed to download QR code:', error);
      throw new Error('Failed to generate QR code for download');
    }
  };

  return { downloadQRCode };
}
