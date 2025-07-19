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
  FileText,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Database,
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
  Upload,
  QrCode,
  Shield,
  Users,
  Target,
  Award,
  Zap,
  Camera,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
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
  PieChart,
  LineChart,
  DownloadCloud,
  Share2,
  Printer,
  Mail as MailIcon,
  FileSpreadsheet,
  FileImage,
  Archive,
  Clock3,
  CalendarDays,
  FilterX,
  SortAsc,
  SortDesc,
  MoreHorizontal,
  Edit,
  Copy,
  ExternalLink,
  Info,
  AlertCircle,
  Star,
  StarOff,
  Heart,
  HeartOff,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  MessageCircle,
  Bell,
  BellOff,
  Bookmark,
  BookmarkPlus,
  Tag,
  Tags,
  History,
  RotateCcw,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  FastForward,
  Rewind,
  Timer,
  TimerOff,
  Calendar as CalendarIcon,
  Clock as ClockIcon,
  UserCheck,
  UserX,
  ShieldCheck,
  ShieldX,
  Database as DatabaseIcon,
  Server,
  Network,
  Wifi as WifiIcon,
  WifiOff as WifiOffIcon,
  Signal,
  SignalHigh,
  SignalMedium,
  SignalLow,
  SignalZero,
  Battery,
  BatteryCharging,
  BatteryFull,
  BatteryMedium,
  BatteryLow,
  Power,
  PowerOff,
  Zap as ZapIcon,
  Sparkles,
  Star as StarIcon,
  Heart as HeartIcon,
  ThumbsUp as ThumbsUpIcon,
  ThumbsDown as ThumbsDownIcon,
  MessageSquare as MessageSquareIcon,
  MessageCircle as MessageCircleIcon,
  Bell as BellIcon,
  BellOff as BellOffIcon,
  Bookmark as BookmarkIcon,
  BookmarkPlus as BookmarkPlusIcon,
  Tag as TagIcon,
  Tags as TagsIcon,
} from "lucide-react";

export default function PharmacistHistoryPage() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string>("");
  const [isClient, setIsClient] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [dateRange, setDateRange] = useState("30d");
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

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

  const historyData = [
    {
      id: "HST001",
      type: "scan",
      action: "QR Code Scan",
      description: "Scanned Coartem 20/120mg tablet",
      status: "success",
      timestamp: "2024-01-25 14:30:22",
      user: "Dr. Sarah Johnson",
      pharmacy: "MedPlus Pharmacy",
      details: {
        drugName: "Coartem 20/120mg",
        batchNumber: "CTM2024001",
        manufacturer: "Novartis",
        expiryDate: "2025-12-31",
        scanResult: "Authentic",
        blockchainTx: "0x1234...5678",
        location: "Lagos, Nigeria",
        device: "iPhone 15 Pro",
        scanDuration: "1.2s",
      },
      metadata: {
        ipAddress: "192.168.1.100",
        userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",
        sessionId: "sess_abc123",
        scanCount: 1247,
      },
    },
    {
      id: "HST002",
      type: "verification",
      action: "Drug Verification",
      description: "Verified Amoxil 500mg capsule authenticity",
      status: "success",
      timestamp: "2024-01-25 14:25:15",
      user: "Dr. Sarah Johnson",
      pharmacy: "MedPlus Pharmacy",
      details: {
        drugName: "Amoxil 500mg",
        batchNumber: "AMX2024005",
        manufacturer: "GlaxoSmithKline",
        expiryDate: "2026-03-15",
        verificationResult: "Authentic",
        blockchainTx: "0x9876...4321",
        verificationMethod: "QR Code + Blockchain",
        confidence: "99.8%",
        location: "Lagos, Nigeria",
      },
      metadata: {
        ipAddress: "192.168.1.100",
        userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",
        sessionId: "sess_abc123",
        verificationCount: 892,
      },
    },
    {
      id: "HST003",
      type: "inventory",
      action: "Stock Update",
      description: "Updated Coartem stock levels",
      status: "success",
      timestamp: "2024-01-25 14:20:08",
      user: "Dr. Sarah Johnson",
      pharmacy: "MedPlus Pharmacy",
      details: {
        drugName: "Coartem 20/120mg",
        previousStock: 150,
        newStock: 125,
        change: -25,
        reason: "Sales",
        batchNumber: "CTM2024001",
        expiryDate: "2025-12-31",
        value: 125000,
        location: "Main Store",
      },
      metadata: {
        ipAddress: "192.168.1.100",
        userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",
        sessionId: "sess_abc123",
        inventoryCount: 856,
      },
    },
    {
      id: "HST004",
      type: "security",
      action: "Counterfeit Alert",
      description: "Detected suspicious Panadol tablets",
      status: "warning",
      timestamp: "2024-01-25 14:15:42",
      user: "System Alert",
      pharmacy: "MedPlus Pharmacy",
      details: {
        drugName: "Panadol 500mg",
        batchNumber: "PND2024003",
        manufacturer: "GSK",
        alertType: "Suspicious Packaging",
        alertLevel: "Medium",
        blockchainTx: "0xabcd...efgh",
        location: "Lagos, Nigeria",
        actionTaken: "Quarantined",
        investigationStatus: "Pending",
      },
      metadata: {
        ipAddress: "192.168.1.100",
        userAgent: "System Alert Service",
        sessionId: "sess_sys456",
        alertCount: 7,
      },
    },
    {
      id: "HST005",
      type: "blockchain",
      action: "Blockchain Transaction",
      description: "Recorded drug verification on blockchain",
      status: "success",
      timestamp: "2024-01-25 14:10:33",
      user: "System",
      pharmacy: "MedPlus Pharmacy",
      details: {
        transactionHash: "0x1234567890abcdef",
        blockNumber: 18472947,
        gasUsed: 45000,
        gasPrice: "25 gwei",
        status: "Confirmed",
        confirmations: 12,
        drugName: "Coartem 20/120mg",
        batchNumber: "CTM2024001",
        action: "Verification",
        network: "Ethereum Mainnet",
      },
      metadata: {
        ipAddress: "192.168.1.100",
        userAgent: "Blockchain Service",
        sessionId: "sess_bc789",
        transactionCount: 2847,
      },
    },
    {
      id: "HST006",
      type: "compliance",
      action: "NAFDAC Compliance Check",
      description: "Performed regulatory compliance verification",
      status: "success",
      timestamp: "2024-01-25 14:05:18",
      user: "Dr. Sarah Johnson",
      pharmacy: "MedPlus Pharmacy",
      details: {
        drugName: "Amoxil 500mg",
        batchNumber: "AMX2024005",
        manufacturer: "GlaxoSmithKline",
        complianceStatus: "Compliant",
        registrationNumber: "NAFDAC/REG/2024/001",
        expiryDate: "2026-03-15",
        verificationDate: "2024-01-25",
        inspector: "NAFDAC Inspector",
        score: "98.5%",
      },
      metadata: {
        ipAddress: "192.168.1.100",
        userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",
        sessionId: "sess_abc123",
        complianceCount: 156,
      },
    },
    {
      id: "HST007",
      type: "user",
      action: "User Login",
      description: "User logged into system",
      status: "success",
      timestamp: "2024-01-25 14:00:00",
      user: "Dr. Sarah Johnson",
      pharmacy: "MedPlus Pharmacy",
      details: {
        loginMethod: "Email/Password",
        device: "iPhone 15 Pro",
        location: "Lagos, Nigeria",
        ipAddress: "192.168.1.100",
        sessionDuration: "2h 30m",
        lastLogin: "2024-01-24 16:45:22",
        failedAttempts: 0,
      },
      metadata: {
        ipAddress: "192.168.1.100",
        userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",
        sessionId: "sess_abc123",
        loginCount: 45,
      },
    },
    {
      id: "HST008",
      type: "system",
      action: "System Maintenance",
      description: "Performed database backup",
      status: "success",
      timestamp: "2024-01-25 13:55:12",
      user: "System",
      pharmacy: "MedPlus Pharmacy",
      details: {
        maintenanceType: "Database Backup",
        duration: "15m 30s",
        backupSize: "2.4 GB",
        backupLocation: "AWS S3",
        status: "Completed",
        nextBackup: "2024-01-26 02:00:00",
        retention: "30 days",
      },
      metadata: {
        ipAddress: "192.168.1.100",
        userAgent: "System Maintenance Service",
        sessionId: "sess_sys789",
        maintenanceCount: 12,
      },
    },
  ];

  const stats = {
    totalEntries: 2847,
    todayEntries: 156,
    thisWeekEntries: 892,
    thisMonthEntries: 2847,
    successRate: 94.8,
    averageResponseTime: "1.2s",
    uniqueUsers: 8,
    activeSessions: 3,
    systemUptime: "99.9%",
    lastBackup: "2024-01-25 13:55:12",
  };

  const categories = [
    {
      value: "scan",
      label: "Scan History",
      icon: QrCode,
      color: "text-blue-500",
    },
    {
      value: "verification",
      label: "Verification History",
      icon: Shield,
      color: "text-green-500",
    },
    {
      value: "inventory",
      label: "Inventory History",
      icon: Package,
      color: "text-purple-500",
    },
    {
      value: "security",
      label: "Security History",
      icon: AlertTriangle,
      color: "text-red-500",
    },
    {
      value: "blockchain",
      label: "Blockchain History",
      icon: Database,
      color: "text-orange-500",
    },
    {
      value: "compliance",
      label: "Compliance History",
      icon: FileText,
      color: "text-indigo-500",
    },
    {
      value: "user",
      label: "User History",
      icon: User,
      color: "text-cyan-500",
    },
    {
      value: "system",
      label: "System History",
      icon: Server,
      color: "text-gray-500",
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return (
          <Badge className="bg-success text-success-foreground">
            <CheckCircle className="w-3 h-3 mr-1" />
            Success
          </Badge>
        );
      case "warning":
        return (
          <Badge className="bg-warning text-warning-foreground">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Warning
          </Badge>
        );
      case "error":
        return (
          <Badge className="bg-danger text-danger-foreground">
            <XCircle className="w-3 h-3 mr-1" />
            Error
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-warning text-warning-foreground">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getCategoryIcon = (type: string) => {
    const category = categories.find((cat) => cat.value === type);
    if (category) {
      const Icon = category.icon;
      return <Icon className={`w-4 h-4 ${category.color}`} />;
    }
    return <Activity className="w-4 h-4 text-gray-500" />;
  };

  const handleViewDetails = (entryId: string) => {
    // Navigate to detailed view
    router.push(`/pharmacist/history/${entryId}`);
  };

  const handleExportHistory = () => {
    // Export history as CSV
    const csvData = historyData.map((entry) => ({
      id: entry.id,
      type: entry.type,
      action: entry.action,
      description: entry.description,
      status: entry.status,
      timestamp: entry.timestamp,
      user: entry.user,
      pharmacy: entry.pharmacy,
    }));

    const csv = [
      Object.keys(csvData[0]).join(","),
      ...csvData.map((row) => Object.values(row).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pharmacist-history-${
      new Date().toISOString().split("T")[0]
    }.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleRefreshHistory = () => {
    // Refresh history data
    console.log("Refreshing history data...");
  };

  const handleHistorySettings = () => {
    setShowSettings(true);
    console.log("Opening history settings...");
  };

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    console.log("Copied to clipboard:", text);
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
              Activity History
            </h1>
            <p className="text-muted-foreground">
              Complete audit trail of all pharmacy activities and transactions
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleRefreshHistory}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button variant="outline" onClick={handleExportHistory}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button variant="outline" onClick={handleHistorySettings}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="shadow-soft hover:shadow-medium transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Entries
              </CardTitle>
              <History className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.totalEntries.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">+156 today</p>
            </CardContent>
          </Card>

          <Card className="shadow-soft hover:shadow-medium transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Success Rate
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">
                {stats.successRate}%
              </div>
              <p className="text-xs text-muted-foreground">
                Successful actions
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-soft hover:shadow-medium transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Users
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.uniqueUsers}</div>
              <p className="text-xs text-muted-foreground">
                {stats.activeSessions} active sessions
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-soft hover:shadow-medium transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Response Time
              </CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.averageResponseTime}
              </div>
              <p className="text-xs text-muted-foreground">Average response</p>
            </CardContent>
          </Card>

          <Card className="shadow-soft hover:shadow-medium transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                System Uptime
              </CardTitle>
              <Server className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">
                {stats.systemUptime}
              </div>
              <p className="text-xs text-muted-foreground">
                Last backup: {stats.lastBackup}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Category Overview */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Activity Categories</CardTitle>
            <CardDescription>
              Overview of different types of activities recorded
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {categories.map((category) => {
                const Icon = category.icon;
                const count = historyData.filter(
                  (entry) => entry.type === category.value
                ).length;
                return (
                  <div
                    key={category.value}
                    className="p-4 border border-border rounded-lg hover:bg-accent/50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Icon className={`h-5 w-5 ${category.color}`} />
                      </div>
                      <div>
                        <h3 className="font-medium">{category.label}</h3>
                        <p className="text-sm text-muted-foreground">
                          {count} entries
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* History Management */}
        <Card className="shadow-soft">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Activity History</CardTitle>
                <CardDescription>
                  Detailed log of all pharmacy activities and transactions
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Search activities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64"
                />
                <Select
                  value={selectedCategory}
                  onValueChange={setSelectedCategory}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1d">Today</SelectItem>
                    <SelectItem value="7d">Last 7 days</SelectItem>
                    <SelectItem value="30d">Last 30 days</SelectItem>
                    <SelectItem value="90d">Last 90 days</SelectItem>
                    <SelectItem value="1y">Last year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {historyData
                .filter(
                  (entry) =>
                    (selectedCategory === "all" ||
                      entry.type === selectedCategory) &&
                    (entry.action
                      .toLowerCase()
                      .includes(searchTerm.toLowerCase()) ||
                      entry.description
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase()) ||
                      entry.user
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase()))
                )
                .map((entry) => (
                  <div
                    key={entry.id}
                    className="p-4 border border-border rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {getCategoryIcon(entry.type)}
                        <div>
                          <p className="font-medium">{entry.action}</p>
                          <p className="text-sm text-muted-foreground">
                            {entry.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(entry.status)}
                        <Badge variant="outline">{entry.type}</Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                      <div>
                        <p className="text-muted-foreground">Timestamp</p>
                        <p className="font-medium">{entry.timestamp}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">User</p>
                        <p className="font-medium">{entry.user}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Pharmacy</p>
                        <p className="font-medium">{entry.pharmacy}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">ID</p>
                        <p className="font-medium font-mono">{entry.id}</p>
                      </div>
                    </div>

                    {/* Entry Details */}
                    <div className="mb-3 p-3 bg-accent/30 rounded-lg">
                      <h4 className="font-medium mb-2">Details</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                        {Object.entries(entry.details).map(([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <span className="text-muted-foreground capitalize">
                              {key.replace(/([A-Z])/g, " $1").trim()}:
                            </span>
                            <span className="font-medium font-mono">
                              {typeof value === "string" && value.length > 20
                                ? `${value.substring(0, 20)}...`
                                : value}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Metadata */}
                    <div className="mb-3 p-3 bg-muted/30 rounded-lg">
                      <h4 className="font-medium mb-2">Metadata</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                        {Object.entries(entry.metadata).map(([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <span className="text-muted-foreground capitalize">
                              {key.replace(/([A-Z])/g, " $1").trim()}:
                            </span>
                            <span className="font-medium font-mono">
                              {typeof value === "string" && value.length > 25
                                ? `${value.substring(0, 25)}...`
                                : value}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(entry.id)}
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        View Details
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopyToClipboard(entry.id)}
                      >
                        <Copy className="w-3 h-3 mr-1" />
                        Copy ID
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleCopyToClipboard(JSON.stringify(entry, null, 2))
                        }
                      >
                        <FileText className="w-3 h-3 mr-1" />
                        Export JSON
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* Activity Analytics */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Activity Analytics
            </CardTitle>
            <CardDescription>
              Insights and trends from activity history
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-4">
                <h4 className="font-medium">Activity Distribution</h4>
                <div className="space-y-3">
                  {categories.map((category) => {
                    const count = historyData.filter(
                      (entry) => entry.type === category.value
                    ).length;
                    const percentage = (
                      (count / historyData.length) *
                      100
                    ).toFixed(1);
                    return (
                      <div key={category.value}>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">{category.label}</span>
                          <span className="font-medium">{percentage}%</span>
                        </div>
                        <Progress
                          value={parseFloat(percentage)}
                          className="h-2"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Time-based Activity</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Today</span>
                    <span className="font-medium">{stats.todayEntries}</span>
                  </div>
                  <Progress
                    value={(stats.todayEntries / stats.totalEntries) * 100}
                    className="h-2"
                  />

                  <div className="flex justify-between text-sm">
                    <span>This Week</span>
                    <span className="font-medium">{stats.thisWeekEntries}</span>
                  </div>
                  <Progress
                    value={(stats.thisWeekEntries / stats.totalEntries) * 100}
                    className="h-2"
                  />

                  <div className="flex justify-between text-sm">
                    <span>This Month</span>
                    <span className="font-medium">
                      {stats.thisMonthEntries}
                    </span>
                  </div>
                  <Progress
                    value={(stats.thisMonthEntries / stats.totalEntries) * 100}
                    className="h-2"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">System Performance</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Success Rate</p>
                    <p className="font-medium">{stats.successRate}%</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Response Time</p>
                    <p className="font-medium">{stats.averageResponseTime}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">System Uptime</p>
                    <p className="font-medium">{stats.systemUptime}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Active Sessions</p>
                    <p className="font-medium">{stats.activeSessions}</p>
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
            <CardDescription>Common history management tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Button
                variant="default"
                size="lg"
                className="h-20 flex-col"
                onClick={handleRefreshHistory}
              >
                <RefreshCw className="h-6 w-6 mb-2" />
                Refresh History
              </Button>
              <Button
                variant="secondary"
                size="lg"
                className="h-20 flex-col"
                onClick={handleExportHistory}
              >
                <Download className="h-6 w-6 mb-2" />
                Export Data
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="h-20 flex-col"
                onClick={() => setShowFilters(true)}
              >
                <Filter className="h-6 w-6 mb-2" />
                Advanced Filters
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="h-20 flex-col"
                onClick={handleHistorySettings}
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
