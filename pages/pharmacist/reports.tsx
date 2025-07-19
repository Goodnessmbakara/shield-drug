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
} from "lucide-react";

export default function PharmacistReportsPage() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string>("");
  const [isClient, setIsClient] = useState(false);
  const [selectedReport, setSelectedReport] = useState("all");
  const [dateRange, setDateRange] = useState("30d");
  const [searchTerm, setSearchTerm] = useState("");
  const [showGenerateReport, setShowGenerateReport] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
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

  const reportsData = [
    {
      id: "RPT001",
      title: "Monthly Verification Report",
      type: "verification",
      status: "completed",
      dateCreated: "2024-01-25",
      dateRange: "2024-01-01 to 2024-01-31",
      generatedBy: "Dr. Sarah Johnson",
      pharmacy: "MedPlus Pharmacy",
      summary: {
        totalScans: 1247,
        authenticScans: 1185,
        suspiciousScans: 42,
        counterfeitScans: 20,
        successRate: 95.0,
        averageScanTime: 2.3,
      },
      fileSize: "2.4 MB",
      format: "PDF",
      downloads: 15,
      lastAccessed: "2024-01-25 14:30:22",
    },
    {
      id: "RPT002",
      title: "Inventory Status Report",
      type: "inventory",
      status: "completed",
      dateCreated: "2024-01-24",
      dateRange: "2024-01-01 to 2024-01-31",
      generatedBy: "Dr. Sarah Johnson",
      pharmacy: "MedPlus Pharmacy",
      summary: {
        totalItems: 856,
        activeItems: 789,
        lowStockItems: 45,
        outOfStockItems: 22,
        expiringItems: 18,
        totalValue: 2847000,
      },
      fileSize: "1.8 MB",
      format: "Excel",
      downloads: 8,
      lastAccessed: "2024-01-24 16:45:12",
    },
    {
      id: "RPT003",
      title: "Counterfeit Detection Alert",
      type: "security",
      status: "urgent",
      dateCreated: "2024-01-23",
      dateRange: "2024-01-20 to 2024-01-23",
      generatedBy: "System Alert",
      pharmacy: "MedPlus Pharmacy",
      summary: {
        suspiciousItems: 5,
        counterfeitItems: 2,
        alertsGenerated: 7,
        investigations: 3,
        resolvedCases: 2,
        pendingCases: 1,
      },
      fileSize: "856 KB",
      format: "PDF",
      downloads: 23,
      lastAccessed: "2024-01-23 09:15:45",
    },
    {
      id: "RPT004",
      title: "NAFDAC Compliance Report",
      type: "compliance",
      status: "completed",
      dateCreated: "2024-01-22",
      dateRange: "2024-01-01 to 2024-01-31",
      generatedBy: "Dr. Sarah Johnson",
      pharmacy: "MedPlus Pharmacy",
      summary: {
        complianceRate: 98.5,
        verifiedItems: 812,
        pendingVerification: 44,
        violations: 0,
        recommendations: 3,
        auditScore: 95.2,
      },
      fileSize: "3.2 MB",
      format: "PDF",
      downloads: 12,
      lastAccessed: "2024-01-22 11:20:33",
    },
    {
      id: "RPT005",
      title: "Weekly Analytics Summary",
      type: "analytics",
      status: "completed",
      dateCreated: "2024-01-21",
      dateRange: "2024-01-15 to 2024-01-21",
      generatedBy: "Dr. Sarah Johnson",
      pharmacy: "MedPlus Pharmacy",
      summary: {
        weeklyScans: 892,
        weeklyGrowth: 12.5,
        topDrugs: ["Coartem", "Amoxil", "Panadol"],
        regionalData: "Lagos, Abuja, Port Harcourt",
        blockchainTxns: 1247,
        successRate: 94.8,
      },
      fileSize: "1.5 MB",
      format: "Excel",
      downloads: 6,
      lastAccessed: "2024-01-21 17:30:18",
    },
    {
      id: "RPT006",
      title: "Blockchain Transaction Log",
      type: "blockchain",
      status: "completed",
      dateCreated: "2024-01-20",
      dateRange: "2024-01-01 to 2024-01-31",
      generatedBy: "System",
      pharmacy: "MedPlus Pharmacy",
      summary: {
        totalTransactions: 2847,
        successfulTxns: 2832,
        failedTxns: 15,
        successRate: 99.5,
        averageGasUsed: 45000,
        totalGasCost: 125000,
      },
      fileSize: "4.1 MB",
      format: "CSV",
      downloads: 4,
      lastAccessed: "2024-01-20 13:45:27",
    },
  ];

  const stats = {
    totalReports: 156,
    completedReports: 142,
    pendingReports: 8,
    urgentReports: 6,
    totalDownloads: 2847,
    averageReportSize: "2.1 MB",
    reportSuccessRate: 91.0,
    monthlyReports: 24,
    weeklyReports: 6,
    dailyReports: 1,
  };

  const reportTypes = [
    { value: "verification", label: "Verification Reports", icon: CheckCircle },
    { value: "inventory", label: "Inventory Reports", icon: Package },
    { value: "security", label: "Security Reports", icon: Shield },
    { value: "compliance", label: "Compliance Reports", icon: FileText },
    { value: "analytics", label: "Analytics Reports", icon: BarChart3 },
    { value: "blockchain", label: "Blockchain Reports", icon: Database },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-success text-success-foreground">
            <CheckCircle className="w-3 h-3 mr-1" />
            Completed
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-warning text-warning-foreground">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case "urgent":
        return (
          <Badge className="bg-danger text-danger-foreground">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Urgent
          </Badge>
        );
      case "failed":
        return (
          <Badge className="bg-danger text-danger-foreground">
            <XCircle className="w-3 h-3 mr-1" />
            Failed
          </Badge>
        );
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    const reportType = reportTypes.find((rt) => rt.value === type);
    if (reportType) {
      const Icon = reportType.icon;
      return (
        <Badge variant="outline" className="flex items-center gap-1">
          <Icon className="w-3 h-3" />
          {reportType.label}
        </Badge>
      );
    }
    return <Badge variant="outline">{type}</Badge>;
  };

  const getFormatIcon = (format: string) => {
    switch (format.toLowerCase()) {
      case "pdf":
        return <FileText className="h-4 w-4 text-red-500" />;
      case "excel":
        return <FileSpreadsheet className="h-4 w-4 text-green-500" />;
      case "csv":
        return <FileText className="h-4 w-4 text-blue-500" />;
      case "image":
        return <FileImage className="h-4 w-4 text-purple-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const handleGenerateReport = () => {
    setShowGenerateReport(true);
    // In a real app, this would open report generation modal
    console.log("Opening report generation modal...");
  };

  const handleViewAnalytics = () => {
    setShowAnalytics(true);
    router.push("/pharmacist/analytics");
  };

  const handleReportSettings = () => {
    setShowSettings(true);
    // In a real app, this would open report settings
    console.log("Opening report settings...");
  };

  const handleViewReport = (reportId: string) => {
    // Navigate to report details page
    router.push(`/pharmacist/reports/${reportId}`);
  };

  const handleDownloadReport = (reportId: string) => {
    // In a real app, this would download the report
    console.log(`Downloading report ${reportId}...`);
  };

  const handleShareReport = (reportId: string) => {
    // In a real app, this would share the report
    console.log(`Sharing report ${reportId}...`);
  };

  const handleDeleteReport = (reportId: string) => {
    // In a real app, this would show confirmation dialog
    console.log(`Deleting report ${reportId}...`);
  };

  const handleExportAllReports = () => {
    // Export all reports as CSV
    const csvData = reportsData.map((report) => ({
      id: report.id,
      title: report.title,
      type: report.type,
      status: report.status,
      dateCreated: report.dateCreated,
      dateRange: report.dateRange,
      generatedBy: report.generatedBy,
      pharmacy: report.pharmacy,
      fileSize: report.fileSize,
      format: report.format,
      downloads: report.downloads,
      lastAccessed: report.lastAccessed,
    }));

    const csv = [
      Object.keys(csvData[0]).join(","),
      ...csvData.map((row) => Object.values(row).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `all-reports-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handlePrintReport = (reportId: string) => {
    // In a real app, this would print the report
    console.log(`Printing report ${reportId}...`);
  };

  const handleEmailReport = (reportId: string) => {
    // In a real app, this would email the report
    console.log(`Emailing report ${reportId}...`);
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
              Reports & Analytics
            </h1>
            <p className="text-muted-foreground">
              Generate, manage, and analyze comprehensive pharmacy reports
            </p>
          </div>
          <Button variant="hero" size="xl" onClick={handleGenerateReport}>
            <Plus className="mr-2 h-5 w-5" />
            Generate Report
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="shadow-soft hover:shadow-medium transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Reports
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.totalReports.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">+24 this month</p>
            </CardContent>
          </Card>

          <Card className="shadow-soft hover:shadow-medium transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">
                {stats.completedReports}
              </div>
              <p className="text-xs text-muted-foreground">
                {((stats.completedReports / stats.totalReports) * 100).toFixed(
                  1
                )}
                % success
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-soft hover:shadow-medium transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Urgent</CardTitle>
              <AlertTriangle className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">
                {stats.urgentReports}
              </div>
              <p className="text-xs text-muted-foreground">
                Requires attention
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-soft hover:shadow-medium transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Downloads</CardTitle>
              <Download className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.totalDownloads.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">Total downloads</p>
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
                {stats.reportSuccessRate}%
              </div>
              <p className="text-xs text-muted-foreground">Report generation</p>
            </CardContent>
          </Card>
        </div>

        {/* Report Types Overview */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Report Types Overview</CardTitle>
            <CardDescription>
              Different types of reports available for generation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {reportTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <div
                    key={type.value}
                    className="p-4 border border-border rounded-lg hover:bg-accent/50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium">{type.label}</h3>
                        <p className="text-sm text-muted-foreground">
                          Generate {type.label.toLowerCase()}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Reports Management */}
        <Card className="shadow-soft">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Reports Management</CardTitle>
                <CardDescription>
                  View, download, and manage generated reports
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Search reports..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64"
                />
                <Select
                  value={selectedReport}
                  onValueChange={setSelectedReport}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {reportTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
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
              {reportsData
                .filter(
                  (report) =>
                    (selectedReport === "all" ||
                      report.type === selectedReport) &&
                    (report.title
                      .toLowerCase()
                      .includes(searchTerm.toLowerCase()) ||
                      report.generatedBy
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase()) ||
                      report.pharmacy
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase()))
                )
                .map((report) => (
                  <div
                    key={report.id}
                    className="p-4 border border-border rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {getFormatIcon(report.format)}
                        <div>
                          <p className="font-medium">{report.title}</p>
                          <p className="text-sm text-muted-foreground">
                            Generated by {report.generatedBy} on{" "}
                            {report.dateCreated}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(report.status)}
                        {getTypeBadge(report.type)}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                      <div>
                        <p className="text-muted-foreground">Date Range</p>
                        <p className="font-medium">{report.dateRange}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">File Size</p>
                        <p className="font-medium">{report.fileSize}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Downloads</p>
                        <p className="font-medium">{report.downloads}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Last Accessed</p>
                        <p className="font-medium">{report.lastAccessed}</p>
                      </div>
                    </div>

                    {/* Report Summary */}
                    <div className="mb-3 p-3 bg-accent/30 rounded-lg">
                      <h4 className="font-medium mb-2">Summary</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                        {Object.entries(report.summary).map(([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <span className="text-muted-foreground capitalize">
                              {key.replace(/([A-Z])/g, " $1").trim()}:
                            </span>
                            <span className="font-medium">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewReport(report.id)}
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadReport(report.id)}
                      >
                        <Download className="w-3 h-3 mr-1" />
                        Download
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleShareReport(report.id)}
                      >
                        <Share2 className="w-3 h-3 mr-1" />
                        Share
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePrintReport(report.id)}
                      >
                        <Printer className="w-3 h-3 mr-1" />
                        Print
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEmailReport(report.id)}
                      >
                        <MailIcon className="w-3 h-3 mr-1" />
                        Email
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-danger hover:text-danger"
                        onClick={() => handleDeleteReport(report.id)}
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

        {/* Report Analytics */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Report Analytics
            </CardTitle>
            <CardDescription>
              Insights and trends from report generation and usage
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-4">
                <h4 className="font-medium">Report Generation Trends</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Daily Reports</span>
                    <span className="font-medium">{stats.dailyReports}</span>
                  </div>
                  <Progress value={20} className="h-2" />

                  <div className="flex justify-between items-center">
                    <span className="text-sm">Weekly Reports</span>
                    <span className="font-medium">{stats.weeklyReports}</span>
                  </div>
                  <Progress value={40} className="h-2" />

                  <div className="flex justify-between items-center">
                    <span className="text-sm">Monthly Reports</span>
                    <span className="font-medium">{stats.monthlyReports}</span>
                  </div>
                  <Progress value={80} className="h-2" />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Report Types Distribution</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Verification Reports</span>
                    <span className="font-medium">45%</span>
                  </div>
                  <Progress value={45} className="h-2" />

                  <div className="flex justify-between text-sm">
                    <span>Inventory Reports</span>
                    <span className="font-medium">25%</span>
                  </div>
                  <Progress value={25} className="h-2" />

                  <div className="flex justify-between text-sm">
                    <span>Security Reports</span>
                    <span className="font-medium">15%</span>
                  </div>
                  <Progress value={15} className="h-2" />

                  <div className="flex justify-between text-sm">
                    <span>Other Reports</span>
                    <span className="font-medium">15%</span>
                  </div>
                  <Progress value={15} className="h-2" />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Performance Metrics</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Avg Report Size</p>
                    <p className="font-medium">{stats.averageReportSize}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Success Rate</p>
                    <p className="font-medium">{stats.reportSuccessRate}%</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Pending Reports</p>
                    <p className="font-medium">{stats.pendingReports}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Total Downloads</p>
                    <p className="font-medium">{stats.totalDownloads}</p>
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
            <CardDescription>Common report management tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Button
                variant="default"
                size="lg"
                className="h-20 flex-col"
                onClick={handleGenerateReport}
              >
                <Plus className="h-6 w-6 mb-2" />
                Generate Report
              </Button>
              <Button
                variant="secondary"
                size="lg"
                className="h-20 flex-col"
                onClick={handleExportAllReports}
              >
                <Download className="h-6 w-6 mb-2" />
                Export All
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
                onClick={handleReportSettings}
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
