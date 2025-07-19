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
  ScanLine,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Database,
  BarChart3,
  Eye,
  Download,
  Trash2,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Calendar,
  Hash,
  Globe,
  Activity,
  Settings,
  FileText,
  Upload,
  QrCode,
  Shield,
  Users,
  Target,
  Award,
  Zap,
  Camera,
  CameraOff,
  Flashlight,
  FlashlightOff,
  RotateCcw,
  History,
  Share,
  Copy,
  ExternalLink,
  Info,
  AlertCircle,
  Clock3,
  MapPin,
  Package,
  Building,
  User,
  Phone,
  Mail,
  Globe2,
  Lock,
  Unlock,
  Wifi,
  WifiOff,
} from "lucide-react";

export default function PharmacistScanPage() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string>("");
  const [isClient, setIsClient] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [scanHistory, setScanHistory] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterResult, setFilterResult] = useState("all");
  const [showHistory, setShowHistory] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [cameraActive, setCameraActive] = useState(false);
  const [flashActive, setFlashActive] = useState(false);

  useEffect(() => {
    setIsClient(true);

    if (typeof window !== "undefined") {
      const role = localStorage.getItem("userRole");
      const email = localStorage.getItem("userEmail");

      if (role !== "pharmacist") {
        router.push("/login");
        return;
      }

      if (email) {
        setUserEmail(email);
      }
    }
  }, [router]);

  const scanHistoryData = [
    {
      id: "SCAN001",
      drugName: "Coartem",
      batchId: "CT2024001",
      qrCode: "QR2024001-001",
      result: "authentic",
      timestamp: "2024-01-25 14:30:22",
      location: "Lagos, Nigeria",
      pharmacist: "Dr. Sarah Johnson",
      pharmacy: "MedPlus Pharmacy",
      verificationDetails: {
        manufacturer: "Novartis",
        expiryDate: "2025-06-15",
        quantity: 150,
        blockchainTx: "0x1234...5678",
        verificationCount: 1247,
        firstVerified: "2024-01-15",
        lastVerified: "2024-01-25",
      },
    },
    {
      id: "SCAN002",
      drugName: "Amoxil",
      batchId: "AX2024002",
      qrCode: "QR2024002-045",
      result: "authentic",
      timestamp: "2024-01-25 13:15:45",
      location: "Lagos, Nigeria",
      pharmacist: "Dr. Sarah Johnson",
      pharmacy: "MedPlus Pharmacy",
      verificationDetails: {
        manufacturer: "GlaxoSmithKline",
        expiryDate: "2025-03-20",
        quantity: 85,
        blockchainTx: "0x8765...4321",
        verificationCount: 892,
        firstVerified: "2024-01-10",
        lastVerified: "2024-01-25",
      },
    },
    {
      id: "SCAN003",
      drugName: "Panadol",
      batchId: "PD2024003",
      qrCode: "QR2024003-123",
      result: "suspicious",
      timestamp: "2024-01-25 11:45:12",
      location: "Lagos, Nigeria",
      pharmacist: "Dr. Sarah Johnson",
      pharmacy: "MedPlus Pharmacy",
      verificationDetails: {
        manufacturer: "GSK Consumer",
        expiryDate: "2026-01-10",
        quantity: 300,
        blockchainTx: "0x9999...8888",
        verificationCount: 156,
        firstVerified: "2024-01-05",
        lastVerified: "2024-01-25",
      },
    },
    {
      id: "SCAN004",
      drugName: "Augmentin",
      batchId: "AG2024004",
      qrCode: "QR2024004-067",
      result: "authentic",
      timestamp: "2024-01-25 10:20:33",
      location: "Lagos, Nigeria",
      pharmacist: "Dr. Sarah Johnson",
      pharmacy: "MedPlus Pharmacy",
      verificationDetails: {
        manufacturer: "GlaxoSmithKline",
        expiryDate: "2024-12-05",
        quantity: 8,
        blockchainTx: "0x5555...4444",
        verificationCount: 45,
        firstVerified: "2023-12-01",
        lastVerified: "2024-01-25",
      },
    },
    {
      id: "SCAN005",
      drugName: "Unknown Drug",
      batchId: "UNKNOWN",
      qrCode: "INVALID-QR-CODE",
      result: "counterfeit",
      timestamp: "2024-01-25 09:15:18",
      location: "Lagos, Nigeria",
      pharmacist: "Dr. Sarah Johnson",
      pharmacy: "MedPlus Pharmacy",
      verificationDetails: {
        manufacturer: "Unknown",
        expiryDate: "Unknown",
        quantity: 0,
        blockchainTx: "Failed",
        verificationCount: 0,
        firstVerified: "Never",
        lastVerified: "Never",
      },
    },
  ];

  const stats = {
    totalScans: 1247,
    authenticScans: 1185,
    suspiciousScans: 42,
    counterfeitScans: 20,
    successRate: 95.0,
    averageScanTime: 2.3,
    todayScans: 156,
    weeklyScans: 892,
    monthlyScans: 3247,
  };

  const getResultBadge = (result: string) => {
    switch (result) {
      case "authentic":
        return (
          <Badge className="bg-success text-success-foreground">
            <CheckCircle className="w-3 h-3 mr-1" />
            Authentic
          </Badge>
        );
      case "suspicious":
        return (
          <Badge className="bg-warning text-warning-foreground">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Suspicious
          </Badge>
        );
      case "counterfeit":
        return (
          <Badge className="bg-danger text-danger-foreground">
            <XCircle className="w-3 h-3 mr-1" />
            Counterfeit
          </Badge>
        );
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getResultColor = (result: string) => {
    switch (result) {
      case "authentic":
        return "text-success";
      case "suspicious":
        return "text-warning";
      case "counterfeit":
        return "text-danger";
      default:
        return "text-muted-foreground";
    }
  };

  const handleStartScan = () => {
    setIsScanning(true);
    setCameraActive(true);
    // In a real app, this would activate the camera
    console.log("Starting QR code scan...");
  };

  const handleStopScan = () => {
    setIsScanning(false);
    setCameraActive(false);
    // In a real app, this would deactivate the camera
    console.log("Stopping QR code scan...");
  };

  const handleManualScan = () => {
    if (manualCode.trim()) {
      // Simulate scan result
      const mockResult = {
        id: "SCAN" + Date.now(),
        drugName: "Manual Scan Drug",
        batchId: "MANUAL-" + manualCode.substring(0, 8),
        qrCode: manualCode,
        result: "authentic",
        timestamp: new Date().toISOString(),
        location: "Lagos, Nigeria",
        pharmacist: userEmail,
        pharmacy: "MedPlus Pharmacy",
        verificationDetails: {
          manufacturer: "Unknown Manufacturer",
          expiryDate: "2025-12-31",
          quantity: 100,
          blockchainTx:
            "0x" + Math.random().toString(16).substring(2, 10) + "...",
          verificationCount: Math.floor(Math.random() * 1000),
          firstVerified: "2024-01-01",
          lastVerified: new Date().toISOString().split("T")[0],
        },
      };
      setScanResult(mockResult);
      setScanHistory([mockResult, ...scanHistoryData]);
      setManualCode("");
    }
  };

  const handleViewHistory = () => {
    setShowHistory(true);
    // In a real app, this would open history modal
    console.log("Opening scan history...");
  };

  const handleViewAnalytics = () => {
    setShowAnalytics(true);
    router.push("/pharmacist/analytics");
  };

  const handleScanSettings = () => {
    setShowSettings(true);
    // In a real app, this would open scan settings
    console.log("Opening scan settings...");
  };

  const handleExportHistory = () => {
    // Export scan history as CSV
    const csvData = scanHistoryData.map((scan) => ({
      id: scan.id,
      drugName: scan.drugName,
      batchId: scan.batchId,
      qrCode: scan.qrCode,
      result: scan.result,
      timestamp: scan.timestamp,
      location: scan.location,
      pharmacist: scan.pharmacist,
      pharmacy: scan.pharmacy,
      manufacturer: scan.verificationDetails.manufacturer,
      expiryDate: scan.verificationDetails.expiryDate,
      blockchainTx: scan.verificationDetails.blockchainTx,
    }));

    const csv = [
      Object.keys(csvData[0]).join(","),
      ...csvData.map((row) => Object.values(row).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `scan-history-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleShareResult = (scanId: string) => {
    // In a real app, this would share the scan result
    console.log(`Sharing scan result ${scanId}...`);
  };

  const handleCopyResult = (scanId: string) => {
    // Copy scan result to clipboard
    const scan = scanHistoryData.find((s) => s.id === scanId);
    if (scan) {
      const resultText = `Drug: ${scan.drugName}\nBatch: ${scan.batchId}\nResult: ${scan.result}\nVerified: ${scan.timestamp}`;
      navigator.clipboard.writeText(resultText).then(() => {
        console.log("Scan result copied to clipboard");
      });
    }
  };

  const handleViewDetails = (scanId: string) => {
    // Navigate to scan details page
    router.push(`/pharmacist/scan/${scanId}`);
  };

  const handleDeleteScan = (scanId: string) => {
    // In a real app, this would show confirmation dialog
    console.log(`Deleting scan ${scanId}...`);
  };

  if (!isClient) {
    return null;
  }

  return (
    <DashboardLayout userRole="pharmacist" userName={userEmail}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              QR Code Scanner
            </h1>
            <p className="text-muted-foreground">
              Verify drug authenticity using blockchain-powered QR code scanning
            </p>
          </div>
          <Button variant="hero" size="xl" onClick={handleStartScan}>
            <ScanLine className="mr-2 h-5 w-5" />
            Start Scan
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="shadow-soft hover:shadow-medium transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Scans</CardTitle>
              <ScanLine className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.totalScans.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">+156 this week</p>
            </CardContent>
          </Card>

          <Card className="shadow-soft hover:shadow-medium transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Authentic</CardTitle>
              <CheckCircle className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">
                {stats.authenticScans}
              </div>
              <p className="text-xs text-muted-foreground">
                {((stats.authenticScans / stats.totalScans) * 100).toFixed(1)}%
                success
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-soft hover:shadow-medium transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Suspicious</CardTitle>
              <AlertTriangle className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">
                {stats.suspiciousScans}
              </div>
              <p className="text-xs text-muted-foreground">Requires review</p>
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
                {stats.successRate}%
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.averageScanTime}s avg time
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-soft hover:shadow-medium transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.todayScans}</div>
              <p className="text-xs text-muted-foreground">Scans today</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* QR Scanner Interface */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                QR Code Scanner
              </CardTitle>
              <CardDescription>
                Scan drug QR codes for authenticity verification
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Scanner View */}
              <div className="relative aspect-square bg-black rounded-lg overflow-hidden">
                {isScanning ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center text-white">
                      <div className="w-64 h-64 border-2 border-white rounded-lg relative">
                        <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary"></div>
                        <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary"></div>
                        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary"></div>
                        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <ScanLine className="h-12 w-12 text-primary animate-pulse" />
                        </div>
                      </div>
                      <p className="mt-4 text-sm">
                        Position QR code within frame
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center text-white">
                      <Camera className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-lg font-medium">Camera Ready</p>
                      <p className="text-sm text-muted-foreground">
                        Click Start Scan to begin
                      </p>
                    </div>
                  </div>
                )}

                {/* Camera Controls */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setFlashActive(!flashActive)}
                    className="rounded-full w-10 h-10 p-0"
                  >
                    {flashActive ? (
                      <FlashlightOff className="h-4 w-4" />
                    ) : (
                      <Flashlight className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setCameraActive(!cameraActive)}
                    className="rounded-full w-10 h-10 p-0"
                  >
                    {cameraActive ? (
                      <CameraOff className="h-4 w-4" />
                    ) : (
                      <Camera className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="rounded-full w-10 h-10 p-0"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Manual Entry */}
              <div className="space-y-2">
                <Label htmlFor="manual-code">Manual QR Code Entry</Label>
                <div className="flex gap-2">
                  <Input
                    id="manual-code"
                    placeholder="Enter QR code manually..."
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                  />
                  <Button
                    onClick={handleManualScan}
                    disabled={!manualCode.trim()}
                  >
                    Scan
                  </Button>
                </div>
              </div>

              {/* Scan Controls */}
              <div className="flex gap-2">
                {isScanning ? (
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={handleStopScan}
                  >
                    <CameraOff className="mr-2 h-4 w-4" />
                    Stop Scan
                  </Button>
                ) : (
                  <Button
                    variant="default"
                    className="flex-1"
                    onClick={handleStartScan}
                  >
                    <Camera className="mr-2 h-4 w-4" />
                    Start Scan
                  </Button>
                )}
                <Button variant="outline" onClick={handleViewHistory}>
                  <History className="mr-2 h-4 w-4" />
                  History
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Scan Results */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Latest Scan Result
              </CardTitle>
              <CardDescription>
                Most recent drug verification result
              </CardDescription>
            </CardHeader>
            <CardContent>
              {scanResult ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-lg">
                        {scanResult.drugName}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Batch: {scanResult.batchId}
                      </p>
                    </div>
                    {getResultBadge(scanResult.result)}
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">QR Code</p>
                      <p className="font-medium font-mono">
                        {scanResult.qrCode}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Timestamp</p>
                      <p className="font-medium">{scanResult.timestamp}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Manufacturer</p>
                      <p className="font-medium">
                        {scanResult.verificationDetails.manufacturer}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Expiry Date</p>
                      <p className="font-medium">
                        {scanResult.verificationDetails.expiryDate}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Blockchain Transaction</span>
                      <span className="font-mono text-xs">
                        {scanResult.verificationDetails.blockchainTx}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Verification Count</span>
                      <span className="font-medium">
                        {scanResult.verificationDetails.verificationCount}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Share className="w-3 h-3 mr-1" />
                      Share
                    </Button>
                    <Button variant="outline" size="sm">
                      <Copy className="w-3 h-3 mr-1" />
                      Copy
                    </Button>
                    <Button variant="outline" size="sm">
                      <ExternalLink className="w-3 h-3 mr-1" />
                      Details
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <ScanLine className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No scan results yet</p>
                  <p className="text-sm text-muted-foreground">
                    Scan a QR code to see results here
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Scan History */}
        <Card className="shadow-soft">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Recent Scan History
                </CardTitle>
                <CardDescription>
                  Track your recent drug verification scans
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Search scans..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64"
                />
                <Select value={filterResult} onValueChange={setFilterResult}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Results</SelectItem>
                    <SelectItem value="authentic">Authentic</SelectItem>
                    <SelectItem value="suspicious">Suspicious</SelectItem>
                    <SelectItem value="counterfeit">Counterfeit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {scanHistoryData
                .filter(
                  (scan) =>
                    (filterResult === "all" || scan.result === filterResult) &&
                    (scan.drugName
                      .toLowerCase()
                      .includes(searchTerm.toLowerCase()) ||
                      scan.batchId
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase()) ||
                      scan.qrCode
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase()))
                )
                .map((scan) => (
                  <div
                    key={scan.id}
                    className="p-4 border border-border rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-medium">{scan.drugName}</p>
                        <p className="text-sm text-muted-foreground">
                          Batch: {scan.batchId} | QR: {scan.qrCode}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getResultBadge(scan.result)}
                        <p className="text-xs text-muted-foreground">
                          {scan.timestamp}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                      <div>
                        <p className="text-muted-foreground">Manufacturer</p>
                        <p className="font-medium">
                          {scan.verificationDetails.manufacturer}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Expiry Date</p>
                        <p className="font-medium">
                          {scan.verificationDetails.expiryDate}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Verifications</p>
                        <p className="font-medium">
                          {scan.verificationDetails.verificationCount}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Blockchain TX</p>
                        <p className="font-medium font-mono text-xs">
                          {scan.verificationDetails.blockchainTx}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(scan.id)}
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        View Details
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleShareResult(scan.id)}
                      >
                        <Share className="w-3 h-3 mr-1" />
                        Share
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopyResult(scan.id)}
                      >
                        <Copy className="w-3 h-3 mr-1" />
                        Copy
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-danger hover:text-danger"
                        onClick={() => handleDeleteScan(scan.id)}
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

        {/* Blockchain Integration Status */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Blockchain Integration Status
            </CardTitle>
            <CardDescription>
              QR code verification blockchain transaction monitoring
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
                    <span>Verification Success Rate</span>
                    <span className="font-medium">95.0%</span>
                  </div>
                  <Progress value={95.0} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Average Response Time</span>
                    <span className="font-medium">2.3s</span>
                  </div>
                  <Progress value={85} className="h-2" />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Recent Verifications</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>CT2024001</span>
                    <Badge className="bg-success text-success-foreground text-xs">
                      Success
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>AX2024002</span>
                    <Badge className="bg-success text-success-foreground text-xs">
                      Success
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>PD2024003</span>
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
                    <p className="text-muted-foreground">Daily Verifications</p>
                    <p className="font-medium">156</p>
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
            <CardDescription>
              Common scanning and verification tasks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Button
                variant="default"
                size="lg"
                className="h-20 flex-col"
                onClick={handleStartScan}
              >
                <ScanLine className="h-6 w-6 mb-2" />
                Start Scan
              </Button>
              <Button
                variant="secondary"
                size="lg"
                className="h-20 flex-col"
                onClick={handleExportHistory}
              >
                <Download className="h-6 w-6 mb-2" />
                Export History
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="h-20 flex-col"
                onClick={handleViewAnalytics}
              >
                <BarChart3 className="h-6 w-6 mb-2" />
                Analytics
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="h-20 flex-col"
                onClick={handleScanSettings}
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
