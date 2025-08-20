import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Download, 
  Copy, 
  ExternalLink, 
  Eye, 
  CheckCircle,
  Clock,
  AlertTriangle 
} from 'lucide-react';
import QRCodeGenerator, { useQRCodeDownload } from './QRCodeGenerator';

interface QRCodeCardProps {
  qrCode: {
    qrCodeId: string;
    uploadId: string;
    serialNumber: number;
    verificationUrl: string;
    metadata: {
      drugName: string;
      batchId: string;
      manufacturer: string;
      expiryDate: string;
    };
    status: string;
    verificationCount?: number;
    downloadCount?: number;
    blockchainTx?: string;
    createdAt: string;
  };
  size?: number;
  showActions?: boolean;
  className?: string;
}

export default function QRCodeCard({ 
  qrCode, 
  size = 200, 
  showActions = true,
  className = ''
}: QRCodeCardProps) {
  const [copying, setCopying] = useState(false);
  const { downloadQRCode } = useQRCodeDownload();

  const copyToClipboard = async (text: string) => {
    try {
      setCopying(true);
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
      setTimeout(() => setCopying(false), 1000);
    } catch (error) {
      console.error('Failed to copy:', error);
      setCopying(false);
    }
  };

  const handleDownload = async () => {
    try {
      await downloadQRCode(
        qrCode.verificationUrl,
        `${qrCode.qrCodeId}.png`,
        400
      );
    } catch (error) {
      console.error('Download failed:', error);
      // You could add error handling here
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'generated':
        return (
          <Badge className="bg-success text-success-foreground">
            <CheckCircle className="w-3 h-3 mr-1" />
            Active
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-warning text-warning-foreground">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case 'expired':
      case 'invalid':
        return (
          <Badge className="bg-destructive text-destructive-foreground">
            <AlertTriangle className="w-3 h-3 mr-1" />
            {status}
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            {status}
          </Badge>
        );
    }
  };

  return (
    <Card className={`shadow-soft hover:shadow-medium transition-shadow ${className}`}>
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* QR Code Image */}
          <div className="flex justify-center">
            <QRCodeGenerator
              data={qrCode.verificationUrl}
              size={size}
              alt={`QR Code ${qrCode.qrCodeId}`}
              className="border rounded"
            />
          </div>

          {/* QR Code Info */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm">{qrCode.qrCodeId}</h4>
              {getStatusBadge(qrCode.status)}
            </div>
            
            <div className="text-xs text-muted-foreground space-y-1">
              <p><strong>Drug:</strong> {qrCode.metadata.drugName}</p>
              <p><strong>Batch:</strong> {qrCode.metadata.batchId}</p>
              <p><strong>Serial:</strong> #{qrCode.serialNumber}</p>
              <p><strong>Manufacturer:</strong> {qrCode.metadata.manufacturer}</p>
              <p><strong>Expires:</strong> {new Date(qrCode.metadata.expiryDate).toLocaleDateString()}</p>
            </div>

            {(qrCode.verificationCount !== undefined || qrCode.downloadCount !== undefined) && (
              <div className="flex justify-between text-xs text-muted-foreground pt-2 border-t">
                {qrCode.verificationCount !== undefined && (
                  <span>Verified: {qrCode.verificationCount}</span>
                )}
                {qrCode.downloadCount !== undefined && (
                  <span>Downloads: {qrCode.downloadCount}</span>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          {showActions && (
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                className="text-xs"
              >
                <Download className="w-3 h-3 mr-1" />
                Download
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(qrCode.verificationUrl)}
                className="text-xs"
                disabled={copying}
              >
                <Copy className="w-3 h-3 mr-1" />
                {copying ? 'Copied!' : 'Copy URL'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(qrCode.verificationUrl, '_blank')}
                className="text-xs col-span-2"
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                Test Verification
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
