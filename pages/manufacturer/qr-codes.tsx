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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  QrCode,
  Download,
  Copy,
  Eye,
  Search,
  Filter,
  BarChart3,
  TrendingUp,
  Package,
  CheckCircle,
  Clock,
  AlertTriangle,
  Database,
  Upload,
  RefreshCw,
  Settings,
  FileText,
  Calendar,
  Hash,
  Globe,
} from "lucide-react";

export default function QRCodesPage() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string>("");
  const [isClient, setIsClient] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState("");
  const [qrQuantity, setQrQuantity] = useState(1000);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showBulkGenerate, setShowBulkGenerate] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

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

  const qrCodes = [
    {
      id: "QR2024001",
      batchId: "CT2024001",
      drug: "Coartem",
      quantity: 10000,
      generated: 10000,
      status: "completed",
      date: "2024-01-15",
      downloads: 8500,
      verifications: 1250,
    },
    {
      id: "QR2024002",
      batchId: "AX2024002",
      drug: "Amoxil",
      quantity: 5000,
      generated: 5000,
      status: "completed",
      date: "2024-01-20",
      downloads: 4200,
      verifications: 890,
    },
    {
      id: "QR2024003",
      batchId: "PD2024003",
      drug: "Panadol",
      quantity: 15000,
      generated: 12000,
      status: "in-progress",
      date: "2024-01-25",
      downloads: 9800,
      verifications: 3420,
    },
    {
      id: "QR2024004",
      batchId: "AP2024004",
      drug: "Aspirin",
      quantity: 8000,
      generated: 0,
      status: "pending",
      date: "2024-01-30",
      downloads: 0,
      verifications: 0,
    },
  ];

  const batches = [
    { id: "CT2024001", drug: "Coartem", quantity: 10000, status: "active" },
    { id: "AX2024002", drug: "Amoxil", quantity: 5000, status: "active" },
    { id: "PD2024003", drug: "Panadol", quantity: 15000, status: "active" },
    { id: "AP2024004", drug: "Aspirin", quantity: 8000, status: "pending" },
  ];

  const stats = {
    totalQRCodes: 32000,
    generatedToday: 2500,
    pendingGeneration: 8000,
    downloadRate: 87.5,
    verificationRate: 12.3,
    blockchainSuccess: 99.8,
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
      case "pending":
        return (
          <Badge className="bg-muted text-muted-foreground">Pending</Badge>
        );
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getProgressPercentage = (generated: number, total: number) => {
    return (generated / total) * 100;
  };

  const handleBulkGenerate = () => {
    setShowBulkGenerate(true);
    // In a real app, this would open a modal or navigate to bulk generation page
    console.log("Opening bulk QR code generation...");
  };

  const handleExportData = () => {
    // Simulate data export
    const csvData = qrCodes.map((qr) => ({
      id: qr.id,
      batchId: qr.batchId,
      drug: qr.drug,
      quantity: qr.quantity,
      generated: qr.generated,
      status: qr.status,
      downloads: qr.downloads,
      verifications: qr.verifications,
    }));

    const csv = [
      Object.keys(csvData[0]).join(","),
      ...csvData.map((row) => Object.values(row).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `qr-codes-export-${
      new Date().toISOString().split("T")[0]
    }.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleAnalytics = () => {
    setShowAnalytics(true);
    router.push("/manufacturer/analytics");
  };

  const handleSettings = () => {
    setShowSettings(true);
    // In a real app, this would open settings modal or navigate to settings page
    console.log("Opening QR code settings...");
  };

  const handleDownloadQR = (qrId: string) => {
    // Simulate QR code download
    console.log(`Downloading QR codes for ${qrId}...`);
    // In a real app, this would generate and download QR codes
  };

  const handlePreviewQR = (qrId: string) => {
    // Simulate QR code preview
    console.log(`Previewing QR codes for ${qrId}...`);
    // In a real app, this would show QR code preview modal
  };

  const handleCopyLink = (qrId: string) => {
    // Simulate copying QR code link
    const link = `${window.location.origin}/verify/${qrId}`;
    navigator.clipboard.writeText(link).then(() => {
      console.log("QR code link copied to clipboard");
    });
  };

  const handleQRAnalytics = (qrId: string) => {
    // Navigate to analytics page with QR code filter
    router.push(`/manufacturer/analytics?qr=${qrId}`);
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
            <h1 className="text-3xl font-bold text-foreground">
              QR Code Generation
            </h1>
            <p className="text-muted-foreground">
              Generate, manage, and track QR codes for drug batch authentication
            </p>
          </div>
          <Button variant="hero" size="xl">
            <QrCode className="mr-2 h-5 w-5" />
            Generate New QR Codes
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <Card className="shadow-soft hover:shadow-medium transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total QR Codes
              </CardTitle>
              <QrCode className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.totalQRCodes.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                +{stats.generatedToday} today
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-soft hover:shadow-medium transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Generated Today
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">
                {stats.generatedToday.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">New QR codes</p>
            </CardContent>
          </Card>

          <Card className="shadow-soft hover:shadow-medium transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">
                {stats.pendingGeneration.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                Awaiting generation
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-soft hover:shadow-medium transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Download Rate
              </CardTitle>
              <Download className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.downloadRate}%</div>
              <p className="text-xs text-muted-foreground">
                QR codes downloaded
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-soft hover:shadow-medium transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Verification Rate
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">
                {stats.verificationRate}%
              </div>
              <p className="text-xs text-muted-foreground">QR codes verified</p>
            </CardContent>
          </Card>

          <Card className="shadow-soft hover:shadow-medium transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Blockchain Success
              </CardTitle>
              <Database className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">
                {stats.blockchainSuccess}%
              </div>
              <p className="text-xs text-muted-foreground">
                Transaction success
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* QR Code Generation */}
          <Card className="shadow-soft lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                Generate QR Codes
              </CardTitle>
              <CardDescription>
                Create new QR codes for drug batches
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="batch">Select Batch</Label>
                <Select value={selectedBatch} onValueChange={setSelectedBatch}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a batch" />
                  </SelectTrigger>
                  <SelectContent>
                    {batches.map((batch) => (
                      <SelectItem key={batch.id} value={batch.id}>
                        {batch.drug} - {batch.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">QR Code Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={qrQuantity}
                  onChange={(e) => setQrQuantity(parseInt(e.target.value) || 0)}
                  placeholder="Enter quantity"
                />
              </div>

              <div className="space-y-2">
                <Label>Batch Information</Label>
                {selectedBatch && (
                  <div className="p-3 bg-accent rounded-lg">
                    <p className="text-sm font-medium">
                      {batches.find((b) => b.id === selectedBatch)?.drug}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Batch ID: {selectedBatch}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Available:{" "}
                      {batches
                        .find((b) => b.id === selectedBatch)
                        ?.quantity.toLocaleString()}{" "}
                      units
                    </p>
                  </div>
                )}
              </div>

              <Button className="w-full" disabled={!selectedBatch}>
                <QrCode className="mr-2 h-4 w-4" />
                Generate QR Codes
              </Button>
            </CardContent>
          </Card>

          {/* QR Codes List */}
          <Card className="shadow-soft lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    QR Code Management
                  </CardTitle>
                  <CardDescription>
                    Track and manage generated QR codes
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search QR codes..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {qrCodes
                  .filter(
                    (qr) =>
                      (filterStatus === "all" || qr.status === filterStatus) &&
                      (qr.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        qr.drug
                          .toLowerCase()
                          .includes(searchTerm.toLowerCase()) ||
                        qr.batchId
                          .toLowerCase()
                          .includes(searchTerm.toLowerCase()))
                  )
                  .map((qr) => (
                    <div
                      key={qr.id}
                      className="p-4 border border-border rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-medium">{qr.drug}</p>
                          <p className="text-sm text-muted-foreground">
                            QR ID: {qr.id} | Batch: {qr.batchId}
                          </p>
                        </div>
                        {getStatusBadge(qr.status)}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                        <div>
                          <p className="text-muted-foreground">Quantity</p>
                          <p className="font-medium">
                            {qr.quantity.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Generated</p>
                          <p className="font-medium">
                            {qr.generated.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Downloads</p>
                          <p className="font-medium">
                            {qr.downloads.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Verifications</p>
                          <p className="font-medium">
                            {qr.verifications.toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Generation Progress</span>
                          <span className="font-medium">
                            {getProgressPercentage(
                              qr.generated,
                              qr.quantity
                            ).toFixed(1)}
                            %
                          </span>
                        </div>
                        <Progress
                          value={getProgressPercentage(
                            qr.generated,
                            qr.quantity
                          )}
                          className="h-2"
                        />
                      </div>

                      <div className="flex items-center gap-2 mt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadQR(qr.id)}
                        >
                          <Download className="w-3 h-3 mr-1" />
                          Download
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePreviewQR(qr.id)}
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          Preview
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopyLink(qr.id)}
                        >
                          <Copy className="w-3 h-3 mr-1" />
                          Copy Link
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleQRAnalytics(qr.id)}
                        >
                          <BarChart3 className="w-3 h-3 mr-1" />
                          Analytics
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Blockchain Status */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Blockchain Integration Status
            </CardTitle>
            <CardDescription>
              QR code blockchain transaction monitoring
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
                    <span>Gas Optimization</span>
                    <span className="font-medium">87%</span>
                  </div>
                  <Progress value={87} className="h-2" />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Recent Transactions</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>QR2024001</span>
                    <Badge className="bg-success text-success-foreground text-xs">
                      Success
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>QR2024002</span>
                    <Badge className="bg-success text-success-foreground text-xs">
                      Success
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>QR2024003</span>
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
                    <p className="font-medium">3</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Daily Volume</p>
                    <p className="font-medium">12,847</p>
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
            <CardDescription>Common QR code management tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Button 
                variant="default" 
                size="lg" 
                className="h-20 flex-col"
                onClick={handleBulkGenerate}
              >
                <Upload className="h-6 w-6 mb-2" />
                Bulk Generate
              </Button>
              <Button 
                variant="secondary" 
                size="lg" 
                className="h-20 flex-col"
                onClick={handleExportData}
              >
                <Download className="h-6 w-6 mb-2" />
                Export Data
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="h-20 flex-col"
                onClick={handleAnalytics}
              >
                <BarChart3 className="h-6 w-6 mb-2" />
                Analytics
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="h-20 flex-col"
                onClick={handleSettings}
              >
                <Settings className="h-6 w-6 mb-2" />
                Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
