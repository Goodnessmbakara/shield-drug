import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Package, 
  Calendar, 
  Building, 
  Hash,
  ExternalLink,
  ArrowLeft
} from 'lucide-react';

interface VerificationData {
  qrCodeId: string;
  drug: string;
  batchId: string;
  manufacturer: string;
  expiryDate: string;
  verificationUrl: string;
  serialNumber: number;
  isValid: boolean;
  verificationStatus: 'valid' | 'invalid' | 'expired' | 'unknown';
  blockchainTx?: {
    hash: string;
    status: string;
    blockNumber?: number;
    timestamp: string;
  };
  scannedAt: string;
}

export default function VerifyPage() {
  const router = useRouter();
  const { qrCodeId } = router.query;
  const [verificationData, setVerificationData] = useState<VerificationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('🔄 useEffect triggered with qrCodeId:', qrCodeId);
    if (!qrCodeId) {
      console.log('❌ No qrCodeId, returning early');
      return;
    }

    const verifyQRCode = async () => {
      try {
        console.log('🔍 Starting verification for QR Code:', qrCodeId);
        setIsLoading(true);
        setError(null);

        // Call the actual verification API
        console.log('📡 Making API request...');
        const response = await fetch('/api/qr-codes/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            qrCodeId: qrCodeId as string
          })
        });

        console.log('📡 API response status:', response.status);
        const result = await response.json();
        console.log('📡 API response:', result);

        if (result.success && result.data) {
          const { qrCode, verificationInfo } = result.data;
          
          // Transform API response to match our interface
          const verificationData: VerificationData = {
            qrCodeId: qrCode.qrCodeId,
            drug: qrCode.metadata.drugName,
            batchId: qrCode.metadata.batchId,
            manufacturer: qrCode.metadata.manufacturer,
            expiryDate: qrCode.metadata.expiryDate.split('T')[0], // Format date
            verificationUrl: typeof window !== 'undefined' ? window.location.href : '',
            serialNumber: qrCode.serialNumber,
            isValid: verificationInfo.isValid,
            verificationStatus: verificationInfo.isValid ? 'valid' : 'invalid',
            blockchainTx: qrCode.blockchainTx && 
              ((typeof qrCode.blockchainTx === 'string' && qrCode.blockchainTx.length > 0) || 
               (typeof qrCode.blockchainTx === 'object' && qrCode.blockchainTx.hash && qrCode.blockchainTx.hash.length > 0)) ? {
              hash: typeof qrCode.blockchainTx === 'string' ? qrCode.blockchainTx : qrCode.blockchainTx.hash,
              status: typeof qrCode.blockchainTx === 'string' ? 'confirmed' : qrCode.blockchainTx.status,
              blockNumber: typeof qrCode.blockchainTx === 'string' ? undefined : qrCode.blockchainTx.blockNumber,
              timestamp: typeof qrCode.blockchainTx === 'string' ? new Date().toISOString() : qrCode.blockchainTx.timestamp,
            } : undefined,
            scannedAt: verificationInfo.verifiedAt
          };

          console.log('✅ Setting verification data:', verificationData);
          setVerificationData(verificationData);
        } else {
          // Handle verification failure
          console.log('❌ Verification failed:', result.error);
          setError(result.error || 'QR Code verification failed');
          
          // Still show some data for failed verification
          const failedData: VerificationData = {
            qrCodeId: qrCodeId as string,
            drug: 'Unknown Drug',
            batchId: 'Unknown Batch',
            manufacturer: 'Unknown Manufacturer',
            expiryDate: 'Unknown',
            verificationUrl: typeof window !== 'undefined' ? window.location.href : '',
            serialNumber: 0,
            isValid: false,
            verificationStatus: 'invalid',
            blockchainTx: undefined,
            scannedAt: new Date().toISOString()
          };
          
          setVerificationData(failedData);
        }
      } catch (err) {
        console.error('❌ Verification error:', err);
        setError(err instanceof Error ? err.message : 'Network error during verification');
      } finally {
        console.log('🏁 Setting loading to false');
        setIsLoading(false);
      }
    };

    verifyQRCode();
  }, [qrCodeId]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'valid':
        return (
          <Badge className="bg-success text-success-foreground">
            <CheckCircle className="w-3 h-3 mr-1" />
            Authentic
          </Badge>
        );
      case 'invalid':
        return (
          <Badge className="bg-destructive text-destructive-foreground">
            <XCircle className="w-3 h-3 mr-1" />
            Counterfeit
          </Badge>
        );
      case 'expired':
        return (
          <Badge className="bg-warning text-warning-foreground">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Expired
          </Badge>
        );
      default:
        return (
          <Badge className="bg-muted text-muted-foreground">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Unknown
          </Badge>
        );
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'valid':
        return 'text-success';
      case 'invalid':
        return 'text-destructive';
      case 'expired':
        return 'text-warning';
      default:
        return 'text-muted-foreground';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Verifying QR Code</h2>
          <p className="text-gray-500">Please wait while we verify the authenticity...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-8">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Verification Failed</h2>
            <p className="text-gray-500 mb-4">{error}</p>
            <Button onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!verificationData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-8">
            <AlertTriangle className="h-12 w-12 text-gray-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">QR Code Not Found</h2>
            <p className="text-gray-500 mb-4">The QR code could not be verified.</p>
            <Button onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">DrugShield Verification</h1>
          <p className="text-gray-600">Pharmaceutical Authentication System</p>
        </div>

        {/* Main Verification Card */}
        <Card className="shadow-lg">
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-4">
              {getStatusBadge(verificationData.verificationStatus)}
            </div>
            <CardTitle className={`text-2xl font-bold ${getStatusColor(verificationData.verificationStatus)}`}>
              {verificationData.verificationStatus === 'valid' ? 'Authentic Product' : 'Verification Failed'}
            </CardTitle>
            <p className="text-muted-foreground">
              QR Code ID: {verificationData.qrCodeId}
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Drug Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Package className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Drug Name</p>
                    <p className="font-semibold">{verificationData.drug}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Hash className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Batch ID</p>
                    <p className="font-semibold">{verificationData.batchId}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Building className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Manufacturer</p>
                    <p className="font-semibold">{verificationData.manufacturer}</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-orange-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Expiry Date</p>
                    <p className="font-semibold">{verificationData.expiryDate}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Hash className="h-5 w-5 text-indigo-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Serial Number</p>
                    <p className="font-semibold">{verificationData.serialNumber}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-gray-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Scanned At</p>
                    <p className="font-semibold">
                      {new Date(verificationData.scannedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Blockchain Verification */}
            {verificationData.blockchainTx && verificationData.blockchainTx.hash && verificationData.blockchainTx.hash.length > 0 && (
              <div className="border-t pt-4">
                <div className="flex items-center space-x-3 mb-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-semibold">Blockchain Verified</span>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  This product has been verified on the blockchain
                </p>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-muted-foreground">Transaction:</span>
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                    {verificationData.blockchainTx.hash.substring(0, 10)}...
                  </code>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.open(`https://testnet.snowtrace.io/tx/${verificationData.blockchainTx?.hash}`, '_blank')}
                  >
                    <ExternalLink className="w-3 h-3 mr-1" />
                    View
                  </Button>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => router.push('/')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
              <Button 
                className="flex-1"
                onClick={() => window.print()}
              >
                Print Report
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            Powered by DrugShield - Pharmaceutical Authentication System
          </p>
          <p className="text-xs text-gray-400 mt-1">
            This verification is timestamped and stored on the blockchain
          </p>
        </div>
      </div>
    </div>
  );
}
