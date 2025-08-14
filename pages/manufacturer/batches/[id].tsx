import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import DashboardLayout from "@/components/Layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Download,
  FileText,
  CheckCircle,
  Clock,
  AlertTriangle,
  BarChart3,
  Hash,
  Activity,
  RefreshCw,
  ExternalLink,
  Copy,
  QrCode,
  Shield,
  Pill,
} from "lucide-react";
import { DrugBatch } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { generateUnifiedCSVExport, convertToCSV } from "@/lib/utils";

interface BatchDetails extends DrugBatch {
  status: string;
  blockchainTx: string;
  qrCodesGenerated?: number;
  processingTime?: number;
  fileHash?: string;
  validationResult?: {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  };
  qualityScore?: number;
  complianceStatus?: string;
  regulatoryApproval?: string;
  verifications?: number;
  authenticityRate?: number;
}

interface QRCode {
  id: string;
  qrCodeId: string;
  imageUrl: string;
  verificationUrl: string;
  blockchainTx: string;
  date: string;
  status: string;
  downloads: number;
  verifications: number;
}

// Fetch batch details from database
const fetchBatchDetails = async (batchId: string, userEmail: string) => {
  try {
    const response = await fetch(`/api/manufacturer/batch-details?batchId=${batchId}`, {
      headers: {
        'x-user-role': 'manufacturer',
        'x-user-email': userEmail
      }
    });
    
    if (response.ok) {
      return await response.json();
    } else {
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 404) {
        throw new Error(`Batch with ID "${batchId}" not found. Please check the batch ID and try again.`);
      } else if (response.status === 403) {
        throw new Error('Access denied. You do not have permission to view this batch.');
      } else if (response.status === 401) {
        throw new Error('Authentication required. Please log in again.');
      } else {
        throw new Error(errorData.error || `Failed to fetch batch details (${response.status})`);
      }
    }
  } catch (error) {
    console.error('Error fetching batch details:', error);
    throw error;
  }
};

// Fetch QR codes for this batch using existing endpoint
const fetchQRCodes = async (batchId: string, userEmail: string) => {
  try {
    const response = await fetch(`/api/manufacturer/qr-codes?batchId=${batchId}&limit=50`, {
      headers: {
        'x-user-role': 'manufacturer',
        'x-user-email': userEmail
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.qrCodes || [];
    } else {
      throw new Error('Failed to fetch QR codes');
    }
  } catch (error) {
    console.error('Error fetching QR codes:', error);
    return [];
  }
};

// Generate processed data for download from batch details and QR codes
const generateProcessedData = (batchDetails: BatchDetails, qrCodes: QRCode[]) => {
  return generateUnifiedCSVExport(batchDetails, qrCodes, {
    qualityScore: batchDetails.qualityScore,
    complianceStatus: batchDetails.complianceStatus,
    regulatoryApproval: batchDetails.regulatoryApproval,
    verificationCount: batchDetails.verifications,
    authenticityRate: batchDetails.authenticityRate,
  });
};

export default function BatchDetailsPage() {
  const router = useRouter();
  const { id } = router.query;
  const [userEmail, setUserEmail] = useState<string>("");
  const [isClient, setIsClient] = useState(false);
  const [batchDetails, setBatchDetails] = useState<BatchDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showQRCodes, setShowQRCodes] = useState(false);
  const [qrCodes, setQrCodes] = useState<QRCode[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    setIsClient(true);

    if (typeof window !== "undefined") {
      const role = localStorage.getItem("userRole");
      const email = localStorage.getItem("userEmail");

      if (role !== "manufacturer") {
        router.push("/login");
        return;
      }

      if (email) {
        setUserEmail(email);
      }
    }
  }, [router]);

  // Fetch batch details and QR codes when component mounts
  useEffect(() => {
    const loadData = async () => {
      if (!id || !userEmail) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const [details, codes] = await Promise.all([
          fetchBatchDetails(id as string, userEmail),
          fetchQRCodes(id as string, userEmail)
        ]);
        
        setBatchDetails(details);
        setQrCodes(codes);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load batch details';
        setError(errorMessage);
        console.error('Error loading data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [id, userEmail]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-success text-success-foreground">
            <CheckCircle className="w-3 h-3 mr-1" />
            Active
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-warning text-warning-foreground">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case "expired":
        return (
          <Badge className="bg-danger text-danger-foreground">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Expired
          </Badge>
        );
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const handleBack = () => {
    router.push("/manufacturer/batches");
  };

  const handleDownloadData = () => {
    if (!batchDetails) return;

    // Generate processed data from batch details and QR codes
    const processedData = generateProcessedData(batchDetails, qrCodes);

    // Check if there's data to download
    if (!processedData.length) {
      toast({
        title: "No data available",
        description: "Please ensure QR codes have been generated for this batch.",
        variant: "destructive",
      });
      return;
    }

    // Convert to CSV using unified format
    const csvContent = convertToCSV(processedData);

    // Create and download file
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${batchDetails.batchId}_processed_${
      new Date().toISOString().split("T")[0]
    }.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleViewBlockchain = () => {
    if (!batchDetails?.blockchainTx) return;
    // Open Avalanche C-Chain explorer
    window.open(
      `https://testnet.snowtrace.io/tx/${batchDetails.blockchainTx}`,
      "_blank"
    );
    toast({
      title: "Opening Snowtrace",
      description: "Blockchain transaction details opened in new tab.",
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "The text has been copied to your clipboard.",
    });
  };

  const downloadQRCode = (qrCode: QRCode) => {
    const a = document.createElement("a");
    a.href = qrCode.imageUrl;
    a.download = `QR_${qrCode.id}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (!isClient) {
    return null;
  }

  if (isLoading) {
    return (
      <DashboardLayout userRole="manufacturer" userName={userEmail}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Loading batch details...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !batchDetails) {
    return (
      <DashboardLayout userRole="manufacturer" userName={userEmail}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center max-w-md">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-destructive" />
            <h3 className="text-lg font-semibold text-destructive mb-2">
              {error ? 'Error Loading Batch' : 'Batch Not Found'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {error || 'The requested batch could not be found in the database.'}
            </p>
            <div className="space-y-2">
              <Button onClick={handleBack} className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Batches
              </Button>
              <Button 
                variant="outline" 
                onClick={() => window.location.reload()} 
                className="w-full"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userRole="manufacturer" userName={userEmail}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                Batch Details
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Batch ID: {batchDetails.batchId}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge(batchDetails.status)}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleDownloadData}
              disabled={qrCodes.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Download Data
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Drug Name</p>
                    <p className="font-medium">{batchDetails.drugName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Batch ID</p>
                    <p className="font-medium font-mono text-sm">
                      {batchDetails.batchId}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">NAFDAC Number</p>
                    <p className="font-medium">{batchDetails.nafdacNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Manufacturer</p>
                    <p className="font-medium">{batchDetails.manufacturer}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Quantity</p>
                    <p className="font-medium">
                      {batchDetails.quantity.toLocaleString()} units
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Location</p>
                    <p className="font-medium">{batchDetails.location}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Manufacturing Date</p>
                    <p className="font-medium">{batchDetails.manufacturingDate}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Expiry Date</p>
                    <p className="font-medium">{batchDetails.expiryDate}</p>
                  </div>
                </div>

                {batchDetails.description && (
                  <div>
                    <p className="text-sm text-muted-foreground">Description</p>
                    <p className="font-medium">{batchDetails.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Product Specifications */}
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Pill className="h-5 w-5" />
                  Product Specifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Active Ingredient</p>
                    <p className="font-medium">{batchDetails.activeIngredient}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Dosage Form</p>
                    <p className="font-medium">{batchDetails.dosageForm}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Strength</p>
                    <p className="font-medium">{batchDetails.strength}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Package Size</p>
                    <p className="font-medium">{batchDetails.packageSize}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Storage Conditions</p>
                    <p className="font-medium">{batchDetails.storageConditions}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Created Date</p>
                    <p className="font-medium">{batchDetails.createdAt}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Processing Details */}
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Processing Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      QR Codes Generated
                    </p>
                    <p className="font-medium">
                      {batchDetails.qrCodesGenerated?.toLocaleString() || qrCodes.length.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Processing Time
                    </p>
                    <p className="font-medium">
                      {batchDetails.processingTime != null ? `${batchDetails.processingTime}s` : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Verifications
                    </p>
                    <p className="font-medium">
                      {batchDetails.verifications?.toLocaleString() || '0'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Quality Score
                    </p>
                    <p className="font-medium">{batchDetails.qualityScore != null ? `${batchDetails.qualityScore}%` : '—'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Authenticity Rate
                    </p>
                    <p className="font-medium">{batchDetails.authenticityRate != null ? `${batchDetails.authenticityRate}%` : '—'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Compliance Status
                    </p>
                    {batchDetails.complianceStatus != null ? (
                      <Badge className="bg-success text-success-foreground">
                        {batchDetails.complianceStatus}
                      </Badge>
                    ) : (
                      <p className="font-medium">—</p>
                    )}
                  </div>
                </div>

                {batchDetails.fileHash && (
                  <div>
                    <p className="text-sm text-muted-foreground">
                      File Hash (SHA-256)
                    </p>
                    <div className="flex items-center gap-2">
                      <p className="font-medium font-mono text-xs">
                        {batchDetails.fileHash}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          copyToClipboard(batchDetails.fileHash || "")
                        }
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Cryptographic fingerprint for data integrity verification
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Validation Results */}
            {batchDetails.validationResult && (
              <Card className="shadow-soft">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Validation Results
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge
                      className={
                        batchDetails.validationResult.isValid
                          ? "bg-success text-success-foreground"
                          : "bg-danger text-danger-foreground"
                      }
                    >
                      {batchDetails.validationResult.isValid
                        ? "Valid"
                        : "Invalid"}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {batchDetails.validationResult.errors.length} errors,{" "}
                      {batchDetails.validationResult.warnings.length} warnings
                    </span>
                  </div>

                  {batchDetails.validationResult.errors.length > 0 && (
                    <div>
                      <h4 className="font-medium text-danger mb-2">Errors</h4>
                      <ul className="space-y-1">
                        {batchDetails.validationResult.errors.map(
                          (error, index) => (
                            <li
                              key={index}
                              className="text-sm text-danger flex items-center gap-2"
                            >
                              <AlertTriangle className="h-3 w-3" />
                              {error}
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  )}

                  {batchDetails.validationResult.warnings.length > 0 && (
                    <div>
                      <h4 className="font-medium text-warning mb-2">
                        Warnings
                      </h4>
                      <ul className="space-y-1">
                        {batchDetails.validationResult.warnings.map(
                          (warning, index) => (
                            <li
                              key={index}
                              className="text-sm text-warning flex items-center gap-2"
                            >
                              <Clock className="h-3 w-3" />
                              {warning}
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Blockchain Information */}
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Hash className="h-5 w-5" />
                  Blockchain Transaction
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Network</p>
                    <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                      Avalanche C-Chain
                    </Badge>
                  </div>
                  {batchDetails.blockchainTx && (
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Transaction Hash
                      </p>
                      <div className="flex items-center gap-2">
                        <a
                          href={`https://testnet.snowtrace.io/tx/${batchDetails.blockchainTx}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium font-mono text-xs hover:text-blue-600 transition-colors cursor-pointer"
                          title="View on Snowtrace"
                        >
                          {batchDetails.blockchainTx}
                        </a>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            copyToClipboard(batchDetails.blockchainTx)
                          }
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Gas Used</p>
                      <p className="font-medium">~150,000</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Gas Price</p>
                      <p className="font-medium">30 Gwei</p>
                    </div>
                  </div>
                </div>
                {batchDetails.blockchainTx && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleViewBlockchain}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View on Snowtrace
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Regulatory Information */}
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Regulatory Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">NAFDAC Status</p>
                    <Badge className="bg-success text-success-foreground">
                      Approved
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Regulatory Approval
                    </p>
                    <Badge className="bg-success text-success-foreground">
                      {batchDetails.regulatoryApproval || 'Approved'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Dialog open={showQRCodes} onOpenChange={setShowQRCodes}>
                  <DialogTrigger asChild>
                    <Button
                      variant="default"
                      className="w-full"
                    >
                      <QrCode className="h-4 w-4 mr-2" />
                      View QR Codes
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <QrCode className="h-5 w-5" />
                        Generated QR Codes
                      </DialogTitle>
                      <DialogDescription>
                        Showing first 50 QR codes from{" "}
                        {batchDetails.qrCodesGenerated?.toLocaleString() || qrCodes.length.toLocaleString()}{" "}
                        generated codes
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {qrCodes.map((qrCode, index) => (
                        <div
                          key={qrCode.id}
                          className="border rounded-lg p-4 text-center"
                        >
                          <img
                            src={qrCode.imageUrl}
                            alt={`QR Code ${index + 1}`}
                            className="w-full h-auto mb-2"
                          />
                          <p className="text-xs font-medium mb-1">
                            #{index + 1}
                          </p>
                          <p className="text-xs text-muted-foreground mb-2">
                            {qrCode.id}
                          </p>
                          <div className="space-y-1">
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full text-xs"
                              onClick={() => downloadQRCode(qrCode)}
                            >
                              <Download className="h-3 w-3 mr-1" />
                              Download
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full text-xs"
                              onClick={() =>
                                copyToClipboard(qrCode.verificationUrl)
                              }
                            >
                              <Copy className="h-3 w-3 mr-1" />
                              Copy URL
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleDownloadData}
                  disabled={qrCodes.length === 0}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Data
                </Button>
                {batchDetails.blockchainTx && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleViewBlockchain}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Blockchain Explorer
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push(`/manufacturer/analytics?batch=${batchDetails.batchId}`)}
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View Analytics
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
