import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, CheckCircle, AlertTriangle, Camera } from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';

interface QRScannerProps {
  onResult: (result: string) => void;
  onClose: () => void;
}

interface VerificationResult {
  status: 'authentic' | 'counterfeit' | 'unknown';
  drugName: string;
  batchId: string;
  manufacturingDate: string;
  expiryDate: string;
  manufacturer: string;
}

export default function QRScanner({ onResult, onClose }: QRScannerProps) {
  const [scanning, setScanning] = useState(true);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    if (scanning) {
      const scanner = new Html5QrcodeScanner(
        "qr-reader",
        { 
          fps: 10, 
          qrbox: { width: 250, height: 250 },
          supportedScanTypes: []
        },
        false
      );

      scanner.render(
        (decodedText) => {
          // Simulate verification process
          const mockResult: VerificationResult = {
            status: Math.random() > 0.3 ? 'authentic' : 'counterfeit',
            drugName: 'Paracetamol 500mg',
            batchId: decodedText.substring(0, 8) || 'BTH001234',
            manufacturingDate: '2024-01-15',
            expiryDate: '2026-01-15',
            manufacturer: 'GlaxoSmithKline Nigeria'
          };
          
          setResult(mockResult);
          setScanning(false);
          scanner.clear();
          onResult(decodedText);
        },
        (error) => {
          // Handle scan error silently
        }
      );

      scannerRef.current = scanner;

      return () => {
        if (scannerRef.current) {
          scannerRef.current.clear();
        }
      };
    }
  }, [scanning, onResult]);

  const getStatusIcon = () => {
    if (!result) return null;
    switch (result.status) {
      case 'authentic':
        return <CheckCircle className="h-6 w-6 text-success" />;
      case 'counterfeit':
        return <AlertTriangle className="h-6 w-6 text-destructive" />;
      default:
        return <AlertTriangle className="h-6 w-6 text-warning" />;
    }
  };

  const getStatusBadge = () => {
    if (!result) return null;
    switch (result.status) {
      case 'authentic':
        return <Badge className="bg-success text-success-foreground">Authentic Drug</Badge>;
      case 'counterfeit':
        return <Badge variant="destructive">Counterfeit Detected</Badge>;
      default:
        return <Badge variant="outline">Unknown Status</Badge>;
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-strong">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            QR Code Scanner
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {scanning ? (
            <>
              <div id="qr-reader" className="rounded-lg overflow-hidden"></div>
              <p className="text-sm text-muted-foreground text-center">
                Position the QR code within the frame to scan
              </p>
            </>
          ) : result ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-2">
                {getStatusIcon()}
                {getStatusBadge()}
              </div>
              
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Drug Name:</span> {result.drugName}
                </div>
                <div>
                  <span className="font-medium">Batch ID:</span> {result.batchId}
                </div>
                <div>
                  <span className="font-medium">Manufacturer:</span> {result.manufacturer}
                </div>
                <div>
                  <span className="font-medium">Manufacturing Date:</span> {result.manufacturingDate}
                </div>
                <div>
                  <span className="font-medium">Expiry Date:</span> {result.expiryDate}
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => {
                    setResult(null);
                    setScanning(true);
                  }}
                >
                  Scan Again
                </Button>
                <Button variant="default" className="flex-1" onClick={onClose}>
                  Done
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}