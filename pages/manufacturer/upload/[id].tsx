import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import DashboardLayout from "@/components/Layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
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
  Eye,
  FileText,
  CheckCircle,
  Clock,
  AlertTriangle,
  Database,
  BarChart3,
  TrendingUp,
  Package,
  Users,
  Calendar,
  Hash,
  Globe,
  Activity,
  Settings,
  RefreshCw,
  Cloud,
  ExternalLink,
  Copy,
  QrCode,
  Shield,
  Zap,
  Target,
  MapPin,
  Thermometer,
  Scale,
  Pill,
  X,
} from "lucide-react";
import { UploadHistory } from "@/lib/types";
import { generateUnifiedCSVExport, convertToCSV } from "@/lib/utils";

interface UploadDetails {
  id: string;
  fileName: string;
  drug: string;
  quantity: number;
  status: string;
  date: string;
  size: string;
  records: number;
  blockchainTx: string;
  description?: string;
  manufacturer: string;
  batchId: string;
  expiryDate: string;
  validationResult?: {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  };
  qrCodesGenerated?: number;
  processingTime?: number;
  fileHash?: string;
  location?: string;
  temperature?: string;
  humidity?: string;
  qualityScore?: number;
  complianceStatus?: string;
  regulatoryApproval?: string;
}

// Fetch real upload details from database
const fetchUploadDetails = async (uploadId: string, userEmail: string) => {
  try {
    const response = await fetch(`/api/manufacturer/upload-details?uploadId=${uploadId}`, {
      headers: {
        'x-user-role': 'manufacturer',
        'x-user-email': userEmail
      }
    });
    
    if (response.ok) {
      return await response.json();
    } else {
      throw new Error('Failed to fetch upload details');
    }
  } catch (error) {
    console.error('Error fetching upload details:', error);
    return null;
  }
};

// Fetch QR codes for this upload
const fetchQRCodes = async (uploadId: string, userEmail: string) => {
  try {
    const response = await fetch(`/api/manufacturer/qr-codes?uploadId=${uploadId}&limit=50`, {
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

// Generate processed data for download from real upload details
const generateProcessedData = (uploadDetails: UploadDetails, qrCodes: any[]) => {
  return generateUnifiedCSVExport(uploadDetails, qrCodes, {
    temperature: uploadDetails.temperature,
    humidity: uploadDetails.humidity,
    qualityScore: uploadDetails.qualityScore,
    complianceStatus: uploadDetails.complianceStatus,
    regulatoryApproval: uploadDetails.regulatoryApproval,
  });
};

export default function UploadDetailsPage() {
  const router = useRouter();
  const { id } = router.query;
  const [userEmail, setUserEmail] = useState<string>("");
  const [isClient, setIsClient] = useState(false);
  const [uploadDetails, setUploadDetails] = useState<UploadDetails | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showQRCodes, setShowQRCodes] = useState(false);
  const [qrCodes, setQrCodes] = useState<any[]>([]);

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

  // Fetch upload details and QR codes when component mounts
  useEffect(() => {
    const loadData = async () => {
      if (!id || !userEmail) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const [details, codes] = await Promise.all([
          fetchUploadDetails(id as string, userEmail),
          fetchQRCodes(id as string, userEmail)
        ]);
        
        if (details) {
          setUploadDetails(details);
        } else {
          setError('Upload not found');
        }
        
        setQrCodes(codes);
      } catch (err) {
        setError('Failed to load upload details');
        console.error('Error loading data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [id, userEmail]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-success text-success-foreground">
            <CheckCircle className="w-3 h-3 mr-1" />
            Completed
          </Badge>
        );
      case "in-progress":
        return (
          <Badge className="bg-warning text-warning-foreground">
            <Clock className="w-3 h-3 mr-1" />
            In Progress
          </Badge>
        );
      case "failed":
        return (
          <Badge className="bg-danger text-danger-foreground">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Failed
          </Badge>
        );
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const handleBack = () => {
    router.push("/manufacturer/upload");
  };

  const handleDownloadData = () => {
    if (!uploadDetails) return;

    // Generate processed data from real upload details and QR codes
    const processedData = generateProcessedData(uploadDetails, qrCodes);

    // Convert to CSV using unified format
    const csvContent = convertToCSV(processedData);

    // Create and download file
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${uploadDetails.fileName.replace(".csv", "")}_processed_${
      new Date().toISOString().split("T")[0]
    }.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleViewQRCodes = () => {
    setShowQRCodes(true);
  };

  const handleViewBlockchain = () => {
    // Open Avalanche C-Chain explorer
    window.open(
      `https://testnet.snowtrace.io/tx/${uploadDetails?.blockchainTx}`,
      "_blank"
    );
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // In a real app, show toast notification
  };

  const downloadQRCode = (qrCode: any) => {
    const a = document.createElement("a");
    a.href = qrCode.qrCodeUrl;
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
            <p className="text-muted-foreground">Loading upload details...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !uploadDetails) {
    return (
      <DashboardLayout userRole="manufacturer" userName={userEmail}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertTriangle className="h-8 w-8 mx-auto mb-4 text-danger" />
            <p className="text-danger">Failed to load upload details</p>
            <Button onClick={handleBack} className="mt-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Uploads
            </Button>
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
                Upload Details
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Batch ID: {uploadDetails.batchId}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge(uploadDetails.status)}
            <Button variant="outline" size="sm" onClick={handleDownloadData}>
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
                    <p className="text-sm text-muted-foreground">File Name</p>
                    <p className="font-medium">{uploadDetails.fileName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Upload ID</p>
                    <p className="font-medium font-mono text-sm">
                      {uploadDetails.id}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Drug Name</p>
                    <p className="font-medium">{uploadDetails.drug}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Batch ID</p>
                    <p className="font-medium">{uploadDetails.batchId}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Manufacturer
                    </p>
                    <p className="font-medium">{uploadDetails.manufacturer}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Quantity</p>
                    <p className="font-medium">
                      {uploadDetails.quantity.toLocaleString()} units
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Expiry Date</p>
                    <p className="font-medium">{uploadDetails.expiryDate}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Upload Date</p>
                    <p className="font-medium">{uploadDetails.date}</p>
                  </div>
                </div>

                {uploadDetails.description && (
                  <div>
                    <p className="text-sm text-muted-foreground">Description</p>
                    <p className="font-medium">{uploadDetails.description}</p>
                  </div>
                )}
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
                    <p className="text-sm text-muted-foreground">File Size</p>
                    <p className="font-medium">{uploadDetails.size}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Records Processed
                    </p>
                    <p className="font-medium">
                      {uploadDetails.records.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Processing Time
                    </p>
                    <p className="font-medium">
                      {uploadDetails.processingTime}s
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      QR Codes Generated
                    </p>
                    <p className="font-medium">
                      {uploadDetails.qrCodesGenerated?.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Quality Score
                    </p>
                    <p className="font-medium">{uploadDetails.qualityScore}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Compliance Status
                    </p>
                    <Badge className="bg-success text-success-foreground">
                      {uploadDetails.complianceStatus}
                    </Badge>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">
                    File Hash (SHA-256)
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="font-medium font-mono text-xs">
                      {uploadDetails.fileHash}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        copyToClipboard(uploadDetails.fileHash || "")
                      }
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Cryptographic fingerprint for data integrity verification
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Validation Results */}
            {uploadDetails.validationResult && (
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
                        uploadDetails.validationResult.isValid
                          ? "bg-success text-success-foreground"
                          : "bg-danger text-danger-foreground"
                      }
                    >
                      {uploadDetails.validationResult.isValid
                        ? "Valid"
                        : "Invalid"}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {uploadDetails.validationResult.errors.length} errors,{" "}
                      {uploadDetails.validationResult.warnings.length} warnings
                    </span>
                  </div>

                  {uploadDetails.validationResult.errors.length > 0 && (
                    <div>
                      <h4 className="font-medium text-danger mb-2">Errors</h4>
                      <ul className="space-y-1">
                        {uploadDetails.validationResult.errors.map(
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

                  {uploadDetails.validationResult.warnings.length > 0 && (
                    <div>
                      <h4 className="font-medium text-warning mb-2">
                        Warnings
                      </h4>
                      <ul className="space-y-1">
                        {uploadDetails.validationResult.warnings.map(
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
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Transaction Hash
                    </p>
                    <div className="flex items-center gap-2">
                      <a
                        href={`https://testnet.snowtrace.io/tx/${uploadDetails.blockchainTx}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium font-mono text-xs hover:text-blue-600 transition-colors cursor-pointer"
                        title="View on Snowtrace"
                      >
                        {uploadDetails.blockchainTx}
                      </a>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          copyToClipboard(uploadDetails.blockchainTx)
                        }
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
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
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleViewBlockchain}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                                          View on Snowtrace
                </Button>
              </CardContent>
            </Card>

            {/* Environmental Data */}
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Thermometer className="h-5 w-5" />
                  Environmental Data
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Location</p>
                    <p className="font-medium">{uploadDetails.location}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Temperature</p>
                    <p className="font-medium">{uploadDetails.temperature}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Humidity</p>
                    <p className="font-medium">{uploadDetails.humidity}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Regulatory Approval
                    </p>
                    <Badge className="bg-success text-success-foreground">
                      {uploadDetails.regulatoryApproval}
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
                      onClick={handleViewQRCodes}
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
                        Showing first 10 QR codes from{" "}
                        {uploadDetails.qrCodesGenerated?.toLocaleString()}{" "}
                        generated codes
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {qrCodes.map((qrCode) => (
                        <div
                          key={qrCode.id}
                          className="border rounded-lg p-4 text-center"
                        >
                          <img
                            src={qrCode.qrCodeUrl}
                            alt={`QR Code ${qrCode.serialNumber}`}
                            className="w-full h-auto mb-2"
                          />
                          <p className="text-xs font-medium mb-1">
                            #{qrCode.serialNumber}
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
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Data
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleViewBlockchain}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Blockchain Explorer
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
