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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Upload,
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
  Download,
  Eye,
  Trash2,
  RefreshCw,
  Cloud,
  X,
  Copy,
} from "lucide-react";
import { useBatchUpload } from "@/hooks/useBatchUpload";
import { ValidationResults } from "@/components/ValidationResults";
import { UploadHistory } from "@/lib/types";

export default function UploadPage() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string>("");
  const [isClient, setIsClient] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showValidationResults, setShowValidationResults] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Use the batch upload hook
  const {
    isUploading,
    uploadProgress,
    uploadResult,
    error,
    uploadFile,
    validateFile,
    downloadTemplate,
    resetUpload,
  } = useBatchUpload();

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

  const [uploadHistory, setUploadHistory] = useState<UploadHistory[]>([]);

  // Load upload history from database
  useEffect(() => {
    const fetchUploadHistory = async () => {
      if (!userEmail) return;

      try {
        const response = await fetch(
          `/api/manufacturer/upload-history?limit=10`,
          {
            headers: {
              'x-user-role': 'manufacturer',
              'x-user-email': userEmail
            }
          }
        );
        if (response.ok) {
          const data = await response.json();
          setUploadHistory(data.uploads || []);
        } else {
          console.warn("Failed to fetch upload history from database");
          setUploadHistory([]);
        }
      } catch (error) {
        console.error("Error fetching upload history:", error);
        // Set empty array on error
        setUploadHistory([]);
      }
    };

    fetchUploadHistory();
  }, [userEmail, uploadResult]); // Reload when new upload completes

  // Auto-show validation results when there are validation errors
  useEffect(() => {
    if (
      uploadResult?.validationResult &&
      !uploadResult.validationResult.isValid &&
      uploadResult.status !== "completed"
    ) {
      setShowValidationResults(true);
    }
  }, [uploadResult]);

  const [stats, setStats] = useState({
    totalUploads: 0,
    successfulUploads: 0,
    failedUploads: 0,
    totalRecords: 0,
    averageFileSize: "0 KB",
    uploadSuccessRate: 0,
    blockchainSuccessRate: 99.8,
    totalQRCodes: 0,
    scannedQRCodes: 0,
    unScannedQRCodes: 0,
  });

  // Fetch upload statistics
  useEffect(() => {
    const fetchStats = async () => {
      if (!userEmail) return;

      try {
        const response = await fetch(
          `/api/manufacturer/upload-stats?userEmail=${encodeURIComponent(
            userEmail
          )}`
        );
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error("Error fetching upload stats:", error);
      }
    };

    fetchStats();
  }, [userEmail]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-success text-success-foreground">
            Completed
          </Badge>
        );
      case "in-progress":
        return (
          <Badge className="bg-warning text-warning-foreground">
            In Progress
          </Badge>
        );
      case "failed":
        return (
          <Badge className="bg-danger text-danger-foreground">Failed</Badge>
        );
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file first
      const validation = validateFile(file);
      if (!validation.isValid) {
        alert(`File validation failed: ${validation.errors[0]}`);
        return;
      }

      setSelectedFile(file);
      setShowValidationResults(false);
      resetUpload();
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      await uploadFile(selectedFile);
      setSelectedFile(null);
    } catch (err) {
      console.error("Upload failed:", err);
    }
  };

  const handleUploadNewData = () => {
    setShowUploadModal(true);
    // In a real app, this would open upload modal
    console.log("Opening upload modal...");
  };

  const handleViewAnalytics = () => {
    setShowAnalytics(true);
    router.push("/manufacturer/analytics");
  };

  const handleViewSettings = () => {
    setShowSettings(true);
    // In a real app, this would open settings modal
    console.log("Opening upload settings...");
  };

  const handleDownloadTemplate = () => {
    downloadTemplate();
  };

  const handleViewUploadDetails = (uploadId: string) => {
    // Navigate to upload details page
    router.push(`/manufacturer/upload/${uploadId}`);
  };

  const handleRetryUpload = (uploadId: string) => {
    // In a real app, this would retry the failed upload
    console.log(`Retrying upload ${uploadId}...`);
  };

  const handleDeleteUpload = (uploadId: string) => {
    // In a real app, this would show confirmation dialog
    console.log(`Deleting upload ${uploadId}...`);
  };

  const handleExportUploadHistory = () => {
    // Export upload history as CSV
    const csvData = uploadHistory.map((upload) => ({
      id: upload.id,
      fileName: upload.fileName,
      drug: upload.drug,
      quantity: upload.quantity,
      status: upload.status,
      date: upload.date,
      size: upload.size,
      records: upload.records,
      blockchainTx: upload.blockchainTx,
    }));

    const csv = [
      Object.keys(csvData[0]).join(","),
      ...csvData.map((row) => Object.values(row).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `upload-history-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (!isClient) {
    return null;
  }

  return (
    <DashboardLayout userRole="manufacturer" userName={userEmail}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              Data Upload
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Upload drug batch data and generate QR codes for authentication
            </p>
          </div>
          <Button
            variant="hero"
            size="lg"
            className="w-full sm:w-auto"
            onClick={handleUploadNewData}
          >
            <Upload className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
            <span className="hidden sm:inline">Upload New Data</span>
            <span className="sm:hidden">Upload Data</span>
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4">
          <Card className="shadow-soft hover:shadow-medium transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Uploads
              </CardTitle>
              <Upload className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUploads}</div>
              <p className="text-xs text-muted-foreground">+12 this month</p>
            </CardContent>
          </Card>

          <Card className="shadow-soft hover:shadow-medium transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Successful</CardTitle>
              <CheckCircle className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">
                {stats.successfulUploads}
              </div>
              <p className="text-xs text-muted-foreground">Completed uploads</p>
            </CardContent>
          </Card>

          <Card className="shadow-soft hover:shadow-medium transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Failed</CardTitle>
              <AlertTriangle className="h-4 w-4 text-danger" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-danger">
                {stats.failedUploads}
              </div>
              <p className="text-xs text-muted-foreground">
                Requires attention
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-soft hover:shadow-medium transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Records
              </CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(stats.totalRecords / 1000000).toFixed(1)}M
              </div>
              <p className="text-xs text-muted-foreground">Data records</p>
            </CardContent>
          </Card>

          <Card className="shadow-soft hover:shadow-medium transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Avg File Size
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.averageFileSize}</div>
              <p className="text-xs text-muted-foreground">Per upload</p>
            </CardContent>
          </Card>

          <Card className="shadow-soft hover:shadow-medium transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Success Rate
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">
                {stats.uploadSuccessRate}%
              </div>
              <p className="text-xs text-muted-foreground">Upload success</p>
            </CardContent>
          </Card>

          <Card className="shadow-soft hover:shadow-medium transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Blockchain Success
              </CardTitle>
              <Hash className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">
                {stats.blockchainSuccessRate}%
              </div>
              <p className="text-xs text-muted-foreground">
                Transaction success
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Upload Form */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload Drug Batch Data
              </CardTitle>
              <CardDescription>
                Upload CSV files containing drug batch information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="drug">Drug Name</Label>
                <Input id="drug" placeholder="Enter drug name" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="batch">Batch ID</Label>
                <Input id="batch" placeholder="Enter batch ID" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="manufacturer">Manufacturer</Label>
                <Input id="manufacturer" placeholder="Enter manufacturer" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="file">Upload File</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Drag and drop your CSV file here, or click to browse
                  </p>
                  <Input
                    id="file"
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    onClick={() => document.getElementById("file")?.click()}
                  >
                    Choose File
                  </Button>
                  {selectedFile && (
                    <p className="text-sm text-success mt-2">
                      Selected: {selectedFile.name}
                    </p>
                  )}

                  {/* Quick Validation Status */}
                  {uploadResult?.validationResult &&
                    !uploadResult.validationResult.isValid &&
                    uploadResult.status !== "completed" && (
                      <div className="mt-3 p-3 border border-red-200 rounded-lg bg-red-50">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                          <span className="text-sm font-medium text-red-700">
                            Validation Failed
                          </span>
                        </div>
                        <p className="text-xs text-red-600 mt-1">
                          {uploadResult.validationResult.errors.length} errors
                          found. Click "View All Errors" below for details.
                        </p>
                      </div>
                    )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Enter any additional notes"
                />
              </div>

              {/* Upload Progress */}
              {uploadProgress && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{uploadProgress.message}</span>
                    <span className="font-medium">
                      {uploadProgress.progress}%
                    </span>
                  </div>
                  <Progress value={uploadProgress.progress} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    Stage: {uploadProgress.stage}
                  </p>
                </div>
              )}

              {/* Validation Error Summary */}
              {uploadResult?.validationResult &&
                !uploadResult.validationResult.isValid &&
                uploadResult.status !== "completed" && (
                  <div className="p-4 border border-red-200 rounded-lg bg-red-50">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                      <h4 className="font-medium text-red-700">
                        Validation Failed
                      </h4>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-red-600">
                        Your file contains{" "}
                        {uploadResult.validationResult.errors.length} errors and{" "}
                        {uploadResult.validationResult.warnings.length} warnings
                        that need to be fixed.
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowValidationResults(true)}
                          className="text-red-600 border-red-300 hover:bg-red-50"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View All Errors
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadTemplate()}
                          className="text-blue-600 border-blue-300 hover:bg-blue-50"
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Download Template
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

              {/* Error Display */}
              {error && (
                <div className="p-3 border border-red-200 rounded-lg bg-red-50">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <span className="text-sm text-red-700 font-medium">
                      {error}
                    </span>
                  </div>
                  {uploadResult?.validationResult &&
                    !uploadResult.validationResult.isValid && (
                      <div className="mt-2">
                        <p className="text-xs text-red-600 mb-2">
                          Validation failed with{" "}
                          {uploadResult.validationResult.errors.length} errors
                          and {uploadResult.validationResult.warnings.length}{" "}
                          warnings.
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowValidationResults(true)}
                          className="text-red-600 border-red-300 hover:bg-red-50"
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          View Details
                        </Button>
                      </div>
                    )}
                </div>
              )}

              {/* Success Display */}
              {uploadResult && uploadResult.status === "completed" && (
                <div className="p-3 border border-green-200 rounded-lg bg-green-50">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-green-700">
                      Upload completed! {uploadResult.qrCodesGenerated} QR codes
                      generated.
                    </span>
                  </div>
                  <p className="text-xs text-green-600 mt-1">
                    Transaction: {uploadResult.blockchainTx?.hash}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Button
                  className="w-full"
                  onClick={handleUpload}
                  disabled={
                    !selectedFile ||
                    isUploading ||
                    (uploadResult?.validationResult &&
                      !uploadResult.validationResult.isValid &&
                      uploadResult.status !== "completed")
                  }
                >
                  {isUploading ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : uploadResult?.validationResult &&
                    !uploadResult.validationResult.isValid ? (
                    <>
                      <AlertTriangle className="mr-2 h-4 w-4" />
                      Fix Validation Errors First
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Data
                    </>
                  )}
                </Button>

                {uploadResult?.validationResult &&
                  !uploadResult.validationResult.isValid &&
                  uploadResult.status !== "completed" && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        setSelectedFile(null);
                        resetUpload();
                      }}
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Try Different File
                    </Button>
                  )}
              </div>
            </CardContent>
          </Card>

          {/* Upload Requirements */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Upload Requirements
              </CardTitle>
              <CardDescription>
                File format and data requirements
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <h4 className="font-medium">File Format</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" />
                    CSV format only (.csv extension)
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" />
                    Maximum file size: 10 MB
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" />
                    UTF-8 encoding required
                  </li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">Required Columns</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" />
                    drug_name (string)
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" />
                    batch_id (string)
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" />
                    quantity (integer)
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" />
                    expiry_date (YYYY-MM-DD)
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" />
                    manufacturer (string)
                  </li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">Data Validation</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" />
                    All required fields must be present
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" />
                    Dates must be in valid format
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" />
                    Quantities must be positive integers
                  </li>
                </ul>
              </div>

              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleDownloadTemplate}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download Template
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    const a = document.createElement("a");
                    a.href = "/sample-batch.csv";
                    a.download = "sample-batch.csv";
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                  }}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download Sample File
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Validation Results */}
        {uploadResult?.validationResult &&
          showValidationResults &&
          uploadResult.status !== "completed" && (
            <ValidationResults
              validationResult={uploadResult.validationResult}
              onClose={() => setShowValidationResults(false)}
            />
          )}

        {/* Upload History */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Upload History
            </CardTitle>
            <CardDescription>
              Recent data uploads and their status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {uploadHistory.map((upload) => (
                <div
                  key={upload.id}
                  className="p-4 border border-border rounded-lg"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-medium">{upload.fileName}</p>
                      <p className="text-sm text-muted-foreground">
                        Upload ID: {upload.id}
                      </p>
                    </div>
                    {getStatusBadge(upload.status)}
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm mb-3">
                    <div>
                      <p className="text-muted-foreground text-xs">Drug</p>
                      <p
                        className="font-medium text-sm truncate"
                        title={upload.drug}
                      >
                        {upload.drug}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Quantity</p>
                      <p className="font-medium text-sm">
                        {upload.quantity.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">File Size</p>
                      <p className="font-medium text-sm">{upload.size}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Records</p>
                      <p className="font-medium text-sm">
                        {upload.records.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-3">
                    <div>
                      <p className="text-muted-foreground">Upload Date</p>
                      <p className="font-medium">{upload.date}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Status</p>
                      <p className="font-medium">{upload.status}</p>
                    </div>
                  </div>

                  <div className="mb-3">
                    <p className="text-muted-foreground text-sm mb-1">
                      Blockchain Transaction
                    </p>
                    <div className="flex items-center gap-2">
                      <p className="font-medium font-mono text-xs bg-muted px-2 py-1 rounded truncate flex-1">
                        {upload.blockchainTx}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(
                              String(upload.blockchainTx)
                            );
                            // Simple alert for now - you could replace with a proper toast
                            alert("Transaction hash copied to clipboard!");
                          } catch (err) {
                            console.error("Failed to copy:", err);
                          }
                        }}
                        title="Copy transaction hash"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewUploadDetails(upload.id)}
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      <span className="hidden sm:inline">View Details</span>
                      <span className="sm:hidden">View</span>
                    </Button>
                    {uploadResult?.validationResult && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowValidationResults(true)}
                      >
                        <FileText className="w-3 h-3 mr-1" />
                        <span className="hidden sm:inline">Validation</span>
                        <span className="sm:hidden">Valid</span>
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadTemplate()}
                    >
                      <Download className="w-3 h-3 mr-1" />
                      <span className="hidden sm:inline">Download</span>
                      <span className="sm:hidden">DL</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewAnalytics()}
                    >
                      <BarChart3 className="w-3 h-3 mr-1" />
                      <span className="hidden sm:inline">Analytics</span>
                      <span className="sm:hidden">Stats</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-danger hover:text-danger"
                      onClick={() => handleDeleteUpload(upload.id)}
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      <span className="hidden sm:inline">Delete</span>
                      <span className="sm:hidden">Del</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Blockchain Status */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Blockchain Integration Status
            </CardTitle>
            <CardDescription>
              Data upload blockchain transaction monitoring
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Network Status</span>
                  <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                    <div className="w-2 h-2 bg-current rounded-full mr-1 animate-pulse"></div>
                    Avalanche C-Chain
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Transaction Success Rate</span>
                    <span className="font-medium">99.8%</span>
                  </div>
                  <Progress value={99.8} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Data Validation</span>
                    <span className="font-medium">100%</span>
                  </div>
                  <Progress value={100} className="h-2" />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Recent Uploads</h4>
                <div className="space-y-2">
                  {uploadHistory.length > 0 ? (
                    uploadHistory.slice(0, 3).map((upload) => (
                      <div key={upload.id} className="flex items-center justify-between text-sm">
                        <span className="truncate">{upload.fileName}</span>
                        <Badge 
                          className={`text-xs ${
                            upload.status === 'completed' 
                              ? 'bg-success text-success-foreground'
                              : upload.status === 'pending' || upload.status === 'in-progress'
                              ? 'bg-warning text-warning-foreground'
                              : 'bg-destructive text-destructive-foreground'
                          }`}
                        >
                          {upload.status === 'completed' ? 'Success' : 
                           upload.status === 'pending' ? 'Pending' :
                           upload.status === 'in-progress' ? 'Processing' :
                           upload.status === 'failed' ? 'Failed' : upload.status}
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      No uploads yet
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Network Stats</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Pending Uploads</p>
                    <p className="font-medium">{stats.failedUploads}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Total Uploads</p>
                    <p className="font-medium">{stats.totalUploads}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Success Rate</p>
                    <p className="font-medium">{stats.uploadSuccessRate}%</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Total Records</p>
                    <p className="font-medium">{stats.totalRecords.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common upload management tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              <Button
                variant="default"
                size="lg"
                className="h-20 flex-col"
                onClick={handleUploadNewData}
              >
                <Upload className="h-6 w-6 mb-2" />
                Upload Data
              </Button>
              <Button
                variant="secondary"
                size="lg"
                className="h-20 flex-col"
                onClick={handleDownloadTemplate}
              >
                <Download className="h-6 w-6 mb-2" />
                Download Template
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="h-20 flex-col"
                onClick={handleViewAnalytics}
              >
                <BarChart3 className="h-6 w-6 mb-2" />
                Upload Analytics
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="h-20 flex-col"
                onClick={handleViewSettings}
              >
                <Settings className="h-6 w-6 mb-2" />
                Upload Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
