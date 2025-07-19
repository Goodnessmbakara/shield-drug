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
} from "lucide-react";

export default function UploadPage() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string>("");
  const [isClient, setIsClient] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

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

  const uploadHistory = [
    {
      id: "UP2024001",
      fileName: "coartem_batch_001.csv",
      drug: "Coartem",
      quantity: 10000,
      status: "completed",
      date: "2024-01-15",
      size: "2.4 MB",
      records: 10000,
      blockchainTx: "0x1234...5678",
    },
    {
      id: "UP2024002",
      fileName: "amoxil_batch_002.csv",
      drug: "Amoxil",
      quantity: 5000,
      status: "completed",
      date: "2024-01-20",
      size: "1.2 MB",
      records: 5000,
      blockchainTx: "0x8765...4321",
    },
    {
      id: "UP2024003",
      fileName: "panadol_batch_003.csv",
      drug: "Panadol",
      quantity: 15000,
      status: "in-progress",
      date: "2024-01-25",
      size: "3.6 MB",
      records: 15000,
      blockchainTx: "Pending...",
    },
    {
      id: "UP2024004",
      fileName: "aspirin_batch_004.csv",
      drug: "Aspirin",
      quantity: 8000,
      status: "failed",
      date: "2024-01-30",
      size: "1.9 MB",
      records: 0,
      blockchainTx: "Failed",
    },
  ];

  const stats = {
    totalUploads: 156,
    successfulUploads: 142,
    failedUploads: 14,
    totalRecords: 2840000,
    averageFileSize: "2.1 MB",
    uploadSuccessRate: 91.0,
    blockchainSuccessRate: 99.8,
  };

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
      setSelectedFile(file);
    }
  };

  const handleUpload = () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(0);

    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  if (!isClient) {
    return null;
  }

  return (
    <DashboardLayout userRole="manufacturer" userName={userEmail}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Data Upload</h1>
            <p className="text-muted-foreground">
              Upload drug batch data and generate QR codes for authentication
            </p>
          </div>
          <Button variant="hero" size="xl">
            <Upload className="mr-2 h-5 w-5" />
            Upload New Data
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Enter any additional notes"
                />
              </div>

              {isUploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Upload Progress</span>
                    <span className="font-medium">{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-2" />
                </div>
              )}

              <Button
                className="w-full"
                onClick={handleUpload}
                disabled={!selectedFile || isUploading}
              >
                {isUploading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Data
                  </>
                )}
              </Button>
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

              <Button variant="outline" className="w-full">
                <Download className="mr-2 h-4 w-4" />
                Download Template
              </Button>
            </CardContent>
          </Card>
        </div>

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

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                    <div>
                      <p className="text-muted-foreground">Drug</p>
                      <p className="font-medium">{upload.drug}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Quantity</p>
                      <p className="font-medium">
                        {upload.quantity.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">File Size</p>
                      <p className="font-medium">{upload.size}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Records</p>
                      <p className="font-medium">
                        {upload.records.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mb-3">
                    <div>
                      <p className="text-muted-foreground">Upload Date</p>
                      <p className="font-medium">{upload.date}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Blockchain TX</p>
                      <p className="font-medium font-mono text-xs">
                        {upload.blockchainTx}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Status</p>
                      <p className="font-medium">{upload.status}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <Eye className="w-3 h-3 mr-1" />
                      View Details
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="w-3 h-3 mr-1" />
                      Download
                    </Button>
                    <Button variant="outline" size="sm">
                      <BarChart3 className="w-3 h-3 mr-1" />
                      Analytics
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-danger hover:text-danger"
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Delete
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Network Status</span>
                  <Badge className="bg-success text-success-foreground">
                    <div className="w-2 h-2 bg-current rounded-full mr-1 animate-pulse"></div>
                    Online
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
                  <div className="flex items-center justify-between text-sm">
                    <span>coartem_batch_001.csv</span>
                    <Badge className="bg-success text-success-foreground text-xs">
                      Success
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>amoxil_batch_002.csv</span>
                    <Badge className="bg-success text-success-foreground text-xs">
                      Success
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>panadol_batch_003.csv</span>
                    <Badge className="bg-warning text-warning-foreground text-xs">
                      Pending
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Network Stats</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Pending Txns</p>
                    <p className="font-medium">1</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Daily Uploads</p>
                    <p className="font-medium">8</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Block Height</p>
                    <p className="font-medium">45,892,147</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Gas Price</p>
                    <p className="font-medium">25 Gwei</p>
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Button variant="default" size="lg" className="h-20 flex-col">
                <Upload className="h-6 w-6 mb-2" />
                Upload Data
              </Button>
              <Button variant="secondary" size="lg" className="h-20 flex-col">
                <Download className="h-6 w-6 mb-2" />
                Download Template
              </Button>
              <Button variant="outline" size="lg" className="h-20 flex-col">
                <BarChart3 className="h-6 w-6 mb-2" />
                Upload Analytics
              </Button>
              <Button variant="outline" size="lg" className="h-20 flex-col">
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
