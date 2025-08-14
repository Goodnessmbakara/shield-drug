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
import { useToast } from "@/hooks/use-toast";

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>({
    totalScans: 0,
    authenticScans: 0,
    suspiciousScans: 0,
    counterfeitScans: 0,
    successRate: 0,
    averageScanTime: 0,
    todayScans: 0,
    weeklyScans: 0,
    monthlyScans: 0,
  });
  const { toast } = useToast();

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
        fetchScanData(email);
      }
    }
  }, [router]);

  const fetchScanData = async (email: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/pharmacist/scan?userEmail=${encodeURIComponent(email)}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch scan data');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setStats(data.data.stats);
        setScanResult(data.data.latestScanResult);
        setScanHistory(data.data.scanHistory);
      } else {
        throw new Error(data.error || 'Failed to fetch scan data');
      }
    } catch (err) {
      console.error('Error fetching scan data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch scan data');
      toast({
        title: "Error",
        description: "Failed to load scan data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshData = () => {
    if (userEmail) {
      fetchScanData(userEmail);
    }
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

  const handleManualScan = async () => {
    if (manualCode.trim()) {
      try {
        // In a real app, this would verify the QR code against the database
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
            blockchainTx: "0x" + Math.random().toString(16).substring(2, 10) + "...",
            verificationCount: Math.floor(Math.random() * 1000),
            firstVerified: "2024-01-01",
            lastVerified: new Date().toISOString().split("T")[0],
          },
        };
        setScanResult(mockResult);
        setScanHistory([mockResult, ...scanHistory]);
        setManualCode("");
        
        toast({
          title: "Scan Complete",
          description: "Manual scan completed successfully.",
        });
      } catch (error) {
        toast({
          title: "Scan Error",
          description: "Failed to process manual scan.",
          variant: "destructive",
        });
      }
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
    const csvData = scanHistory.map((scan) => ({
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
    
    toast({
      title: "Export Complete",
      description: "Scan history exported successfully.",
    });
  };

  const handleShareResult = (scanId: string) => {
    // In a real app, this would share the scan result
    console.log(`Sharing scan result ${scanId}...`);
    toast({
      title: "Share",
      description: "Share functionality would be implemented here.",
    });
  };

  const handleCopyResult = (scanId: string) => {
    // Copy scan result to clipboard
    const scan = scanHistory.find((s) => s.id === scanId);
    if (scan) {
      const resultText = `Drug: ${scan.drugName}\nBatch: ${scan.batchId}\nResult: ${scan.result}\nVerified: ${scan.timestamp}`;
      navigator.clipboard.writeText(resultText).then(() => {
        toast({
          title: "Copied",
          description: "Scan result copied to clipboard.",
        });
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
    toast({
      title: "Delete",
      description: "Delete functionality would be implemented here.",
    });
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
          <div className="flex items-center gap-2">
            <Button variant="outline" size="touch" onClick={handleRefreshData} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="hero" size="touch" onClick={handleStartScan}>
              <ScanLine className="mr-2 h-5 w-5" />
              Start Scan
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="shadow-soft hover:shadow-medium transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Scans</CardTitle>
              <ScanLine className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? "..." : stats.totalScans.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">+{stats.todayScans} today</p>
            </CardContent>
          </Card>

          <Card className="shadow-soft hover:shadow-medium transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Authentic</CardTitle>
              <CheckCircle className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">
                {loading ? "..." : stats.authenticScans}
              </div>
              <p className="text-xs text-muted-foreground">
                {loading ? "..." : `${((stats.authenticScans / stats.totalScans) * 100).toFixed(1)}% success`}
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
                {loading ? "..." : stats.suspiciousScans}
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
                {loading ? "..." : `${stats.successRate}%`}
              </div>
              <p className="text-xs text-muted-foreground">
                {loading ? "..." : `${stats.averageScanTime}s avg time`}
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-soft hover:shadow-medium transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? "..." : stats.todayScans}</div>
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
                    size="touch"
                    className="rounded-full w-12 h-12 p-0 md:w-10 md:h-10"
                    onClick={() => setFlashActive(!flashActive)}
                  >
                    {flashActive ? (
                      <FlashlightOff className="h-4 w-4" />
                    ) : (
                      <Flashlight className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="secondary"
                    size="touch"
                    className="rounded-full w-12 h-12 p-0 md:w-10 md:h-10"
                    onClick={() => setCameraActive(!cameraActive)}
                  >
                    {cameraActive ? (
                      <CameraOff className="h-4 w-4" />
                    ) : (
                      <Camera className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="secondary"
                    size="touch"
                    className="rounded-full w-12 h-12 p-0 md:w-10 md:h-10"
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
                    size="touch"
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
                    size="touch"
                    className="flex-1"
                    onClick={handleStopScan}
                  >
                    <CameraOff className="mr-2 h-4 w-4" />
                    Stop Scan
                  </Button>
                ) : (
                  <Button
                    variant="default"
                    size="touch"
                    className="flex-1"
                    onClick={handleStartScan}
                  >
                    <Camera className="mr-2 h-4 w-4" />
                    Start Scan
                  </Button>
                )}
                <Button variant="outline" size="touch" onClick={handleViewHistory}>
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
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading scan data...</p>
                </div>
              ) : scanResult ? (
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
                      <p className="font-medium">{new Date(scanResult.timestamp).toLocaleString()}</p>
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
                      <a
                        href={`https://testnet.snowtrace.io/tx/${scanResult.verificationDetails.blockchainTx}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-xs hover:text-blue-600 transition-colors cursor-pointer"
                        title="View on Snowtrace"
                      >
                        {scanResult.verificationDetails.blockchainTx}
                      </a>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Verification Count</span>
                      <span className="font-medium">
                        {scanResult.verificationDetails.verificationCount}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="touch" className="md:h-9 md:px-3 md:text-sm">
                      <Share className="w-3 h-3 mr-1" />
                      Share
                    </Button>
                    <Button variant="outline" size="touch" className="md:h-9 md:px-3 md:text-sm">
                      <Copy className="w-3 h-3 mr-1" />
                      Copy
                    </Button>
                    <Button variant="outline" size="touch" className="md:h-9 md:px-3 md:text-sm">
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
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading scan history...</p>
              </div>
            ) : scanHistory.length > 0 ? (
              <div className="space-y-4">
                {scanHistory
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
                            {new Date(scan.timestamp).toLocaleString()}
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
                          <a
                            href={`https://testnet.snowtrace.io/tx/${scan.verificationDetails.blockchainTx}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium font-mono text-xs hover:text-blue-600 transition-colors cursor-pointer"
                            title="View on Snowtrace"
                          >
                            {scan.verificationDetails.blockchainTx}
                          </a>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="touch"
                          className="md:h-9 md:px-3 md:text-sm"
                          onClick={() => handleViewDetails(scan.id)}
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          View Details
                        </Button>
                        <Button
                          variant="outline"
                          size="touch"
                          className="md:h-9 md:px-3 md:text-sm"
                          onClick={() => handleShareResult(scan.id)}
                        >
                          <Share className="w-3 h-3 mr-1" />
                          Share
                        </Button>
                        <Button
                          variant="outline"
                          size="touch"
                          className="md:h-9 md:px-3 md:text-sm"
                          onClick={() => handleCopyResult(scan.id)}
                        >
                          <Copy className="w-3 h-3 mr-1" />
                          Copy
                        </Button>
                        <Button
                          variant="outline"
                          size="touch"
                          className="text-danger hover:text-danger md:h-9 md:px-3 md:text-sm"
                          onClick={() => handleDeleteScan(scan.id)}
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <History className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No scan history available</p>
                <p className="text-sm text-muted-foreground">
                  Start scanning to build your history
                </p>
              </div>
            )}
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
                    <span className="font-medium">{stats.successRate}%</span>
                  </div>
                  <Progress value={stats.successRate} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Average Response Time</span>
                    <span className="font-medium">{stats.averageScanTime}s</span>
                  </div>
                  <Progress value={85} className="h-2" />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Recent Verifications</h4>
                <div className="space-y-2">
                  {scanHistory.slice(0, 3).map((scan) => (
                    <div key={scan.id} className="flex items-center justify-between text-sm">
                      <span>{scan.batchId}</span>
                      <Badge className={`text-xs ${
                        scan.result === 'authentic' ? 'bg-success text-success-foreground' :
                        scan.result === 'suspicious' ? 'bg-warning text-warning-foreground' :
                        'bg-danger text-danger-foreground'
                      }`}>
                        {scan.result === 'authentic' ? 'Success' : 
                         scan.result === 'suspicious' ? 'Pending' : 'Failed'}
                      </Badge>
                    </div>
                  ))}
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
                    <p className="font-medium">{stats.todayScans}</p>
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
