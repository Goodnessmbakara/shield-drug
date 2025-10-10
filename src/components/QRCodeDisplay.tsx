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
import QRCodeGenerator, { useQRCodeDownload } from './QRCodeGenerator';

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
  const { downloadQRCode } = useQRCodeDownload();

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



  const handleDownload = async (qrCode: QRCodeData) => {
    try {
      const verificationUrl = qrCode.verificationUrl || `${window.location.origin}/verify/${qrCode.qrCodeId}`;
      await downloadQRCode(verificationUrl, `qr-code-${qrCode.qrCodeId}.png`, 400);
      
      // Track download in database
      try {
        await fetch(`/api/qr-codes/${qrCode.id}/download`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
        });
      } catch (trackingError) {
        console.warn('Failed to track download:', trackingError);
        // Continue with success toast even if tracking fails
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
      <div className="text-center py-16">
        <QrCode className="h-16 w-16 mx-auto mb-6 text-muted-foreground" />
        <h3 className="text-xl font-semibold text-muted-foreground mb-3">
          No QR Codes Found
        </h3>
        <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
          You haven't generated any QR codes yet. Use the "Generate QR Codes" section to create QR codes for your pharmaceutical batches.
        </p>
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          <span>Select a batch from the dropdown</span>
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          <span>Enter the quantity needed</span>
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          <span>Click "Generate QR Codes"</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* QR Codes Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
        {qrCodes.map((qrCode) => (
          <Card key={qrCode.id} className="hover:shadow-lg transition-all duration-200 hover:scale-[1.02] p-0">
            <CardHeader className="pb-4 px-6 pt-6">
              <div className="flex items-center justify-between mb-2">
                <CardTitle className="text-base font-semibold truncate">
                  {qrCode.drug}
                </CardTitle>
                {getStatusBadge(qrCode.status)}
              </div>
              <p className="text-sm text-muted-foreground font-mono">
                ID: {qrCode.qrCodeId}
              </p>
            </CardHeader>
            <CardContent className="space-y-4 px-6 pb-6">
              {/* QR Code Image */}
              <div className="flex justify-center p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl">
                <QRCodeGenerator
                  data={qrCode.verificationUrl || `${window.location.origin}/verify/${qrCode.qrCodeId}`}
                  size={160}
                  className="rounded-lg border-2 border-white shadow-lg"
                  alt={`QR Code for ${qrCode.drug}`}
                />
              </div>

              {/* QR Code Info */}
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Batch:</span>
                  <span className="font-medium truncate max-w-[120px]">{qrCode.batchId}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Downloads:</span>
                  <span className="font-semibold text-blue-600">{qrCode.downloads}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Verifications:</span>
                  <span className="font-semibold text-green-600">{qrCode.verifications}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Date:</span>
                  <span className="font-medium">
                    {new Date(qrCode.date).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 hover:bg-blue-50 hover:border-blue-200 touch-target mobile-optimized"
                  onClick={() => handleDownload(qrCode)}
                >
                  <Download className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 hover:bg-green-50 hover:border-green-200 touch-target mobile-optimized"
                  onClick={() => handlePreview(qrCode)}
                >
                  <Eye className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 hover:bg-purple-50 hover:border-purple-200 touch-target mobile-optimized"
                  onClick={() => handleCopyLink(qrCode)}
                >
                  <Copy className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 hover:bg-orange-50 hover:border-orange-200 touch-target mobile-optimized"
                  onClick={() => handleShare(qrCode)}
                >
                  <Share2 className="w-4 h-4" />
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
                <QRCodeGenerator
                  data={selectedQR.verificationUrl || `${window.location.origin}/verify/${selectedQR.qrCodeId}`}
                  size={180}
                  className="rounded border-2 border-gray-200"
                  alt={`QR Code for ${selectedQR.drug}`}
                />
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
