import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Download, 
  Eye, 
  Copy, 
  QrCode, 
  CheckCircle, 
  Clock,
  ExternalLink,
  Share2
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { QRCodeGenerator, QRCodeData as GeneratorQRCodeData } from '@/lib/qr-code-generator';

interface QRCodeData {
  id: string;
  qrCodeId: string;
  batchId: string;
  drug: string;
  quantity: number;
  generated: number;
  status: string;
  date: string;
  downloads: number;
  verifications: number;
  blockchainTx?: string;
  verificationUrl?: string;
  imageUrl?: string;
}

interface QRCodeDisplayProps {
  qrCodes: QRCodeData[];
  onDownload?: (qrId: string) => void;
  onPreview?: (qrId: string) => void;
  onCopyLink?: (qrId: string) => void;
}

export default function QRCodeDisplay({ 
  qrCodes, 
  onDownload, 
  onPreview, 
  onCopyLink 
}: QRCodeDisplayProps) {
  const [selectedQR, setSelectedQR] = useState<QRCodeData | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [generatedQRCodes, setGeneratedQRCodes] = useState<Map<string, string>>(new Map());
  const [isGenerating, setIsGenerating] = useState(false);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "generated":
      case "completed":
        return (
          <Badge className="bg-success text-success-foreground">
            <CheckCircle className="w-3 h-3 mr-1" />
            Generated
          </Badge>
        );
      case "in-progress":
        return (
          <Badge className="bg-warning text-warning-foreground">
            <Clock className="w-3 h-3 mr-1" />
            In Progress
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-muted text-muted-foreground">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  // Generate QR code for a specific QR code data
  const generateQRCode = async (qrCode: QRCodeData): Promise<string> => {
    if (generatedQRCodes.has(qrCode.id)) {
      return generatedQRCodes.get(qrCode.id)!;
    }

    try {
      const qrData: GeneratorQRCodeData = {
        qrCodeId: qrCode.qrCodeId,
        drug: qrCode.drug,
        batchId: qrCode.batchId,
        manufacturer: 'DrugShield Manufacturer', // Default value
        expiryDate: new Date().toISOString().split('T')[0], // Default value
        verificationUrl: qrCode.verificationUrl || `${window.location.origin}/verify/${qrCode.qrCodeId}`,
        serialNumber: 1
      };

      const dataURL = await QRCodeGenerator.generateQRCodeDataURL(qrData);
      setGeneratedQRCodes(prev => new Map(prev).set(qrCode.id, dataURL));
      return dataURL;
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw error;
    }
  };

  // Generate QR codes for all items
  useEffect(() => {
    const generateAllQRCodes = async () => {
      if (qrCodes.length === 0 || isGenerating) return;
      
      setIsGenerating(true);
      try {
        const promises = qrCodes.map(async (qrCode) => {
          try {
            await generateQRCode(qrCode);
          } catch (error) {
            console.error(`Failed to generate QR code for ${qrCode.id}:`, error);
          }
        });
        
        await Promise.all(promises);
      } catch (error) {
        console.error('Error generating QR codes:', error);
      } finally {
        setIsGenerating(false);
      }
    };

    generateAllQRCodes();
  }, [qrCodes]);

  const handleDownload = async (qrCode: QRCodeData) => {
    try {
      if (qrCode.imageUrl) {
        // Use existing image URL if available
        const response = await fetch(qrCode.imageUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `qr-code-${qrCode.qrCodeId}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        // Generate and download QR code
        const qrData: GeneratorQRCodeData = {
          qrCodeId: qrCode.qrCodeId,
          drug: qrCode.drug,
          batchId: qrCode.batchId,
          manufacturer: 'DrugShield Manufacturer',
          expiryDate: new Date().toISOString().split('T')[0],
          verificationUrl: qrCode.verificationUrl || `${window.location.origin}/verify/${qrCode.qrCodeId}`,
          serialNumber: 1
        };

        await QRCodeGenerator.downloadQRCode(qrData, `qr-code-${qrCode.qrCodeId}.png`);
      }
      
      toast({
        title: "QR Code Downloaded",
        description: `QR code ${qrCode.qrCodeId} has been downloaded successfully.`,
      });
      
      if (onDownload) {
        onDownload(qrCode.id);
      }
    } catch (error) {
      console.error('Error downloading QR code:', error);
      toast({
        title: "Download Failed",
        description: "Failed to download QR code. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handlePreview = (qrCode: QRCodeData) => {
    setSelectedQR(qrCode);
    setIsDialogOpen(true);
    if (onPreview) {
      onPreview(qrCode.id);
    }
  };

  const handleCopyLink = async (qrCode: QRCodeData) => {
    try {
      const link = qrCode.verificationUrl || `${window.location.origin}/verify/${qrCode.qrCodeId}`;
      await navigator.clipboard.writeText(link);
      
      toast({
        title: "Link Copied",
        description: "QR code verification link has been copied to clipboard.",
      });
      
      if (onCopyLink) {
        onCopyLink(qrCode.id);
      }
    } catch (error) {
      console.error('Error copying link:', error);
      toast({
        title: "Copy Failed",
        description: "Failed to copy link. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleShare = async (qrCode: QRCodeData) => {
    try {
      const shareData = {
        title: `QR Code: ${qrCode.drug}`,
        text: `Scan this QR code to verify ${qrCode.drug} authenticity`,
        url: qrCode.verificationUrl || `${window.location.origin}/verify/${qrCode.qrCodeId}`
      };

      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback to copying link
        await handleCopyLink(qrCode);
      }
    } catch (error) {
      console.error('Error sharing QR code:', error);
    }
  };

  if (qrCodes.length === 0) {
    return (
      <div className="text-center py-12">
        <QrCode className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-medium text-muted-foreground mb-2">
          No QR Codes Found
        </h3>
        <p className="text-sm text-muted-foreground">
          Generate your first QR codes to see them displayed here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* QR Codes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {qrCodes.map((qrCode) => (
          <Card key={qrCode.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium truncate">
                  {qrCode.drug}
                </CardTitle>
                {getStatusBadge(qrCode.status)}
              </div>
              <p className="text-xs text-muted-foreground">
                ID: {qrCode.qrCodeId}
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* QR Code Image */}
              <div className="flex justify-center">
                {qrCode.imageUrl ? (
                  <div className="relative w-32 h-32 bg-white rounded-lg border-2 border-gray-200 flex items-center justify-center">
                    <Image
                      src={qrCode.imageUrl}
                      alt={`QR Code for ${qrCode.drug}`}
                      width={120}
                      height={120}
                      className="rounded"
                      onError={(e) => {
                        // Fallback to generated QR code if image fails to load
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                    <div className="hidden absolute inset-0 flex items-center justify-center text-xs text-gray-500 text-center p-2">
                      QR Code<br />Image
                    </div>
                  </div>
                ) : generatedQRCodes.has(qrCode.id) ? (
                  <div className="relative w-32 h-32 bg-white rounded-lg border-2 border-gray-200 flex items-center justify-center">
                    <Image
                      src={generatedQRCodes.get(qrCode.id)!}
                      alt={`QR Code for ${qrCode.drug}`}
                      width={120}
                      height={120}
                      className="rounded"
                    />
                  </div>
                ) : isGenerating ? (
                  <div className="w-32 h-32 bg-gray-100 rounded-lg border-2 border-gray-200 flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600 mx-auto mb-1"></div>
                      <span className="text-xs">Generating...</span>
                    </div>
                  </div>
                ) : (
                  <div className="w-32 h-32 bg-gray-100 rounded-lg border-2 border-gray-200 flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <QrCode className="w-8 h-8 mx-auto mb-1" />
                      <span className="text-xs">QR Code</span>
                    </div>
                  </div>
                )}
              </div>

              {/* QR Code Info */}
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Batch:</span>
                  <span className="font-medium truncate">{qrCode.batchId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Downloads:</span>
                  <span className="font-medium">{qrCode.downloads}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Verifications:</span>
                  <span className="font-medium">{qrCode.verifications}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date:</span>
                  <span className="font-medium">
                    {new Date(qrCode.date).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 h-8"
                  onClick={() => handleDownload(qrCode)}
                >
                  <Download className="w-3 h-3" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 h-8"
                  onClick={() => handlePreview(qrCode)}
                >
                  <Eye className="w-3 h-3" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 h-8"
                  onClick={() => handleCopyLink(qrCode)}
                >
                  <Copy className="w-3 h-3" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 h-8"
                  onClick={() => handleShare(qrCode)}
                >
                  <Share2 className="w-3 h-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* QR Code Preview Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>QR Code Preview</DialogTitle>
          </DialogHeader>
          {selectedQR && (
            <div className="space-y-4">
                             <div className="flex justify-center">
                 {selectedQR.imageUrl ? (
                   <div className="relative w-48 h-48 bg-white rounded-lg border-2 border-gray-200 flex items-center justify-center">
                     <Image
                       src={selectedQR.imageUrl}
                       alt={`QR Code for ${selectedQR.drug}`}
                       width={180}
                       height={180}
                       className="rounded"
                     />
                   </div>
                 ) : generatedQRCodes.has(selectedQR.id) ? (
                   <div className="relative w-48 h-48 bg-white rounded-lg border-2 border-gray-200 flex items-center justify-center">
                     <Image
                       src={generatedQRCodes.get(selectedQR.id)!}
                       alt={`QR Code for ${selectedQR.drug}`}
                       width={180}
                       height={180}
                       className="rounded"
                     />
                   </div>
                 ) : (
                   <div className="w-48 h-48 bg-gray-100 rounded-lg border-2 border-gray-200 flex items-center justify-center">
                     <div className="text-center text-gray-500">
                       <QrCode className="w-12 h-12 mx-auto mb-2" />
                       <span>QR Code Image</span>
                     </div>
                   </div>
                 )}
               </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium">Drug:</span>
                  <span>{selectedQR.drug}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">QR Code ID:</span>
                  <span className="font-mono text-xs">{selectedQR.qrCodeId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Batch ID:</span>
                  <span className="font-mono text-xs">{selectedQR.batchId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Status:</span>
                  {getStatusBadge(selectedQR.status)}
                </div>
                {selectedQR.blockchainTx && (
                  <div className="flex justify-between">
                    <span className="font-medium">Blockchain:</span>
                    <span className="text-success">✓ Verified</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleDownload(selectedQR)}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                {selectedQR.verificationUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => window.open(selectedQR.verificationUrl, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Verify
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
