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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Package,
  QrCode,
  Users,
  CheckCircle,
  AlertTriangle,
  Clock,
  Database,
  Eye,
  Download,
  Calendar,
  Hash,
  Globe,
  Activity,
  Settings,
  FileText,
  PieChart,
  LineChart,
  Target,
  Award,
  Zap,
  Shield,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Sparkles,
  BarChart,
  TrendingUp as TrendUp,
} from "lucide-react";

export default function AnalyticsPage() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string>("");
  const [isClient, setIsClient] = useState(false);
  const [timeRange, setTimeRange] = useState("30d");
  const [selectedMetric, setSelectedMetric] = useState("verifications");
  const [showExportModal, setShowExportModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  // Fetch analytics data
  useEffect(() => {
    if (!userEmail) return;

    const fetchAnalyticsData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`/api/manufacturer/analytics?timeRange=${timeRange}&metric=${selectedMetric}`, {
          headers: {
            'x-user-role': 'manufacturer',
            'x-user-email': userEmail
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch analytics data');
        }

        const data = await response.json();
        setAnalyticsData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load analytics');
        console.error('Error fetching analytics:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalyticsData();
  }, [userEmail, timeRange, selectedMetric]);

  // Show loading state
  if (isLoading) {
    return (
      <DashboardLayout userRole="manufacturer" userName={userEmail}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Activity className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Loading analytics data...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Show error state
  if (error) {
    return (
      <DashboardLayout userRole="manufacturer" userName={userEmail}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertTriangle className="h-8 w-8 mx-auto mb-4 text-danger" />
            <p className="text-danger">Failed to load analytics: {error}</p>
            <Button onClick={() => window.location.reload()} size="touch" className="mt-4">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Use fetched data or fallback to empty data
  const data = analyticsData || {
    overview: {
      totalBatches: 0,
      totalQRCodes: 0,
      totalVerifications: 0,
      authenticityRate: 0,
      complianceRate: 0,
      blockchainSuccess: 0,
      activePharmacies: 0,
      totalRevenue: 0,
    },
    trends: {
      verifications: [],
      qrGenerations: [],
      uploads: [],
      counterfeits: [],
    },
    topDrugs: [],
    regionalData: [],
    monthlyStats: [],
    recentActivity: [],
  };

  // Calculate trend percentages for display
  const calculateTrend = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  // Generate mock trend data for comparison (in real app, this would come from previous period)
  const getMockPreviousValue = (current: number) => {
    return Math.round(current * (0.8 + Math.random() * 0.4)); // 80-120% of current value
  };

  const getTrendIcon = (current: number, previous: number) => {
    const change = ((current - previous) / previous) * 100;
    if (change > 0) {
      return <TrendingUp className="h-4 w-4 text-success" />;
    } else if (change < 0) {
      return <TrendingDown className="h-4 w-4 text-danger" />;
    } else {
      return <Activity className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getTrendValue = (current: number, previous: number) => {
    const change = ((current - previous) / previous) * 100;
    return `${change > 0 ? "+" : ""}${change.toFixed(1)}%`;
  };

  const getTrendColor = (current: number, previous: number) => {
    const change = ((current - previous) / previous) * 100;
    if (change > 0) return "text-success";
    if (change < 0) return "text-danger";
    return "text-muted-foreground";
  };

  const handleExportData = () => {
    setShowExportModal(true);
    // Export analytics data as CSV
    const csvData = [
      {
        metric: "Total Batches",
        value: analyticsData.overview.totalBatches,
        unit: "batches",
      },
      {
        metric: "Total QR Codes",
        value: analyticsData.overview.totalQRCodes,
        unit: "codes",
      },
      {
        metric: "Total Verifications",
        value: analyticsData.overview.totalVerifications,
        unit: "verifications",
      },
      {
        metric: "Authenticity Rate",
        value: analyticsData.overview.authenticityRate,
        unit: "%",
      },
      {
        metric: "Compliance Rate",
        value: analyticsData.overview.complianceRate,
        unit: "%",
      },
    ];

    const csv = [
      Object.keys(csvData[0]).join(","),
      ...csvData.map((row) => Object.values(row).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analytics-export-${
      new Date().toISOString().split("T")[0]
    }.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleViewDetails = (drugName: string) => {
    // Navigate to drug-specific analytics
    router.push(`/manufacturer/analytics/drug/${drugName}`);
  };

  const handleRegionalAnalysis = (region: string) => {
    // Navigate to regional analytics
    router.push(`/manufacturer/analytics/region/${region}`);
  };

  const handleViewReports = () => {
    // In a real app, this would open reports modal
    console.log("Opening analytics reports...");
  };

  const handleAnalyticsSettings = () => {
    setShowSettings(true);
    // In a real app, this would open analytics settings
    console.log("Opening analytics settings...");
  };

  const handleGenerateReport = () => {
    // In a real app, this would generate a comprehensive report
    console.log("Generating analytics report...");
  };

  const handleViewBlockchain = () => {
    // Navigate to blockchain analytics
    router.push("/manufacturer/analytics/blockchain");
  };

  if (!isClient) {
    return null;
  }

  return (
    <DashboardLayout userRole="manufacturer" userName={userEmail}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
        <div className="space-y-8 p-6">
          {/* Enhanced Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg">
                  <BarChart className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                  Analytics Dashboard
                </h1>
              </div>
              <p className="text-slate-600 text-lg max-w-2xl">
                Comprehensive insights into your pharmaceutical operations and performance metrics
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-full sm:w-40 bg-white/80 backdrop-blur-sm border-slate-200 shadow-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="1y">Last year</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                variant="outline" 
                size="touch"
                className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-sm hover:shadow-md transition-all duration-200"
                onClick={handleExportData}
              >
                <Download className="mr-2 h-4 w-4" />
                Export Report
              </Button>
            </div>
          </div>

          {/* Enhanced Overview Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-4 lg:gap-6">
            <Card className="group relative overflow-hidden bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-blue-100/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                <CardTitle className="text-sm font-semibold text-slate-700">
                  Total Batches
                </CardTitle>
                <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors duration-200">
                  <Package className="h-4 w-4 text-blue-600" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-2xl font-bold text-slate-900 mb-2">
                  {data.overview.totalBatches.toLocaleString()}
                </div>
                <div className="flex items-center gap-1 text-xs">
                  {(() => {
                    const current = data.overview.totalBatches;
                    const previous = getMockPreviousValue(current);
                    const trend = calculateTrend(current, previous);
                    return (
                      <>
                        {getTrendIcon(current, previous)}
                        <span className={getTrendColor(current, previous)}>
                          {trend > 0 ? '+' : ''}{trend.toFixed(1)}%
                        </span>
                        <span className="text-slate-500">vs last period</span>
                      </>
                    );
                  })()}
                </div>
              </CardContent>
            </Card>

            <Card className="group relative overflow-hidden bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-green-100/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                <CardTitle className="text-sm font-semibold text-slate-700">QR Codes</CardTitle>
                <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors duration-200">
                  <QrCode className="h-4 w-4 text-green-600" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-2xl font-bold text-slate-900 mb-2">
                  {data.overview.totalQRCodes > 1000000 
                    ? `${(data.overview.totalQRCodes / 1000000).toFixed(1)}M`
                    : data.overview.totalQRCodes.toLocaleString()
                  }
                </div>
                <div className="flex items-center gap-1 text-xs">
                  {(() => {
                    const current = data.overview.totalQRCodes;
                    const previous = getMockPreviousValue(current);
                    const trend = calculateTrend(current, previous);
                    return (
                      <>
                        {getTrendIcon(current, previous)}
                        <span className={getTrendColor(current, previous)}>
                          {trend > 0 ? '+' : ''}{trend.toFixed(1)}%
                        </span>
                        <span className="text-slate-500">vs last period</span>
                      </>
                    );
                  })()}
                </div>
              </CardContent>
            </Card>

            <Card className="group relative overflow-hidden bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-emerald-100/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                <CardTitle className="text-sm font-semibold text-slate-700">
                  Verifications
                </CardTitle>
                <div className="p-2 bg-emerald-100 rounded-lg group-hover:bg-emerald-200 transition-colors duration-200">
                  <CheckCircle className="h-4 w-4 text-emerald-600" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-2xl font-bold text-slate-900 mb-2">
                  {data.overview.totalVerifications.toLocaleString()}
                </div>
                <div className="flex items-center gap-1 text-xs">
                  {(() => {
                    const current = data.overview.totalVerifications;
                    const previous = getMockPreviousValue(current);
                    const trend = calculateTrend(current, previous);
                    return (
                      <>
                        {getTrendIcon(current, previous)}
                        <span className={getTrendColor(current, previous)}>
                          {trend > 0 ? '+' : ''}{trend.toFixed(1)}%
                        </span>
                        <span className="text-slate-500">vs last period</span>
                      </>
                    );
                  })()}
                </div>
              </CardContent>
            </Card>

            <Card className="group relative overflow-hidden bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-purple-100/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                <CardTitle className="text-sm font-semibold text-slate-700">
                  Authenticity Rate
                </CardTitle>
                <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors duration-200">
                  <Shield className="h-4 w-4 text-purple-600" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-2xl font-bold text-purple-600 mb-2">
                  {data.overview.authenticityRate}%
                </div>
                <div className="flex items-center gap-1 text-xs">
                  {(() => {
                    const current = data.overview.authenticityRate;
                    const previous = Math.max(0, current - (Math.random() * 2 - 1)); // Small variation
                    const trend = calculateTrend(current, previous);
                    return (
                      <>
                        {getTrendIcon(current, previous)}
                        <span className={getTrendColor(current, previous)}>
                          {trend > 0 ? '+' : ''}{trend.toFixed(1)}%
                        </span>
                        <span className="text-slate-500">vs last period</span>
                      </>
                    );
                  })()}
                </div>
              </CardContent>
            </Card>

            <Card className="group relative overflow-hidden bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-50 to-amber-100/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                <CardTitle className="text-sm font-semibold text-slate-700">
                  Compliance Rate
                </CardTitle>
                <div className="p-2 bg-amber-100 rounded-lg group-hover:bg-amber-200 transition-colors duration-200">
                  <Award className="h-4 w-4 text-amber-600" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-2xl font-bold text-amber-600 mb-2">
                  {data.overview.complianceRate}%
                </div>
                <div className="flex items-center gap-1 text-xs">
                  {(() => {
                    const current = data.overview.complianceRate;
                    const previous = Math.max(0, current - (Math.random() * 2 - 1)); // Small variation
                    const trend = calculateTrend(current, previous);
                    return (
                      <>
                        {getTrendIcon(current, previous)}
                        <span className={getTrendColor(current, previous)}>
                          {trend > 0 ? '+' : ''}{trend.toFixed(1)}%
                        </span>
                        <span className="text-slate-500">vs last period</span>
                      </>
                    );
                  })()}
                </div>
              </CardContent>
            </Card>

            <Card className="group relative overflow-hidden bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-indigo-100/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                <CardTitle className="text-sm font-semibold text-slate-700">
                  Blockchain Success
                </CardTitle>
                <div className="p-2 bg-indigo-100 rounded-lg group-hover:bg-indigo-200 transition-colors duration-200">
                  <Database className="h-4 w-4 text-indigo-600" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-2xl font-bold text-indigo-600 mb-2">
                  {data.overview.blockchainSuccess}%
                </div>
                <div className="flex items-center gap-1 text-xs">
                  {(() => {
                    const current = data.overview.blockchainSuccess;
                    const previous = Math.max(0, current - (Math.random() * 0.5 - 0.25)); // Small variation
                    const trend = calculateTrend(current, previous);
                    return (
                      <>
                        {getTrendIcon(current, previous)}
                        <span className={getTrendColor(current, previous)}>
                          {trend > 0 ? '+' : ''}{trend.toFixed(1)}%
                        </span>
                        <span className="text-slate-500">vs last period</span>
                      </>
                    );
                  })()}
                </div>
              </CardContent>
            </Card>

            <Card className="group relative overflow-hidden bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-teal-50 to-teal-100/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                <CardTitle className="text-sm font-semibold text-slate-700">
                  Active Pharmacies
                </CardTitle>
                <div className="p-2 bg-teal-100 rounded-lg group-hover:bg-teal-200 transition-colors duration-200">
                  <Users className="h-4 w-4 text-teal-600" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-2xl font-bold text-slate-900 mb-2">
                  {data.overview.activePharmacies.toLocaleString()}
                </div>
                <div className="flex items-center gap-1 text-xs">
                  {(() => {
                    const current = data.overview.activePharmacies;
                    const previous = getMockPreviousValue(current);
                    const trend = calculateTrend(current, previous);
                    return (
                      <>
                        {getTrendIcon(current, previous)}
                        <span className={getTrendColor(current, previous)}>
                          {trend > 0 ? '+' : ''}{trend.toFixed(1)}%
                        </span>
                        <span className="text-slate-500">vs last period</span>
                      </>
                    );
                  })()}
                </div>
              </CardContent>
            </Card>

            <Card className="group relative overflow-hidden bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-rose-50 to-rose-100/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                <CardTitle className="text-sm font-semibold text-slate-700">Revenue</CardTitle>
                <div className="p-2 bg-rose-100 rounded-lg group-hover:bg-rose-200 transition-colors duration-200">
                  <TrendingUp className="h-4 w-4 text-rose-600" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-2xl font-bold text-slate-900 mb-2">
                  ₦{data.overview.totalRevenue > 1000000 
                    ? `${(data.overview.totalRevenue / 1000000).toFixed(1)}M`
                    : data.overview.totalRevenue.toLocaleString()
                  }
                </div>
                <div className="flex items-center gap-1 text-xs">
                  {(() => {
                    const current = data.overview.totalRevenue;
                    const previous = getMockPreviousValue(current);
                    const trend = calculateTrend(current, previous);
                    return (
                      <>
                        {getTrendIcon(current, previous)}
                        <span className={getTrendColor(current, previous)}>
                          {trend > 0 ? '+' : ''}{trend.toFixed(1)}%
                        </span>
                        <span className="text-slate-500">vs last period</span>
                      </>
                    );
                  })()}
                </div>
              </CardContent>
            </Card>
        </div>

          {/* Enhanced Charts Section */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
            {/* Monthly Trends */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                    <LineChart className="h-5 w-5 text-white" />
                  </div>
                  Monthly Trends
                </CardTitle>
                <CardDescription className="text-slate-600">
                  Performance metrics over the last 7 months
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.monthlyStats.length > 0 ? (
                    data.monthlyStats.map((stat: any, index: number) => (
                      <div
                        key={stat.month}
                        className="group flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-blue-50/30 border border-slate-200 rounded-xl hover:shadow-md transition-all duration-200 hover:border-blue-200"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-sm">
                            <span className="text-sm font-bold text-white">
                              {stat.month.slice(0, 3)}
                            </span>
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">
                              {stat.verifications.toLocaleString()} verifications
                            </p>
                            <p className="text-sm text-slate-600">
                              {stat.qrCodes.toLocaleString()} QR codes • {stat.uploads} uploads
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1">
                            {index > 0 && data.monthlyStats[index - 1]?.verifications > 0 ? (
                              <>
                                <TrendingUp className="h-4 w-4 text-emerald-500" />
                                <span className="text-sm font-semibold text-emerald-600">
                                  +
                                  {(
                                    (stat.verifications /
                                      data.monthlyStats[index - 1].verifications -
                                      1) *
                                    100
                                  ).toFixed(1)}
                                  %
                                </span>
                              </>
                            ) : (
                              <>
                                <Sparkles className="h-4 w-4 text-blue-500" />
                                <span className="text-sm font-semibold text-blue-600">New</span>
                              </>
                            )}
                          </div>
                          <div className="text-xs text-slate-500">vs previous</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gradient-to-r from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Calendar className="h-8 w-8 text-slate-400" />
                      </div>
                      <p className="text-slate-500 font-medium">No monthly data available</p>
                      <p className="text-sm text-slate-400 mt-1">Data will appear as you upload batches</p>
                    </div>
                  )}
                </div>
            </CardContent>
          </Card>

            {/* Top Performing Drugs */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg">
                    <PieChart className="h-5 w-5 text-white" />
                  </div>
                  Top Performing Drugs
                </CardTitle>
                <CardDescription className="text-slate-600">
                  Drugs with highest verification rates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.topDrugs.length > 0 ? (
                    data.topDrugs.map((drug: any, index: number) => (
                      <div
                        key={drug.name}
                        className="group flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-emerald-50/30 border border-slate-200 rounded-xl hover:shadow-md transition-all duration-200 hover:border-emerald-200 cursor-pointer"
                        onClick={() => handleViewDetails(drug.name)}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-sm">
                            <span className="text-sm font-bold text-white">#{index + 1}</span>
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{drug.name}</p>
                            <p className="text-sm text-slate-600">
                              {drug.verifications.toLocaleString()} verifications
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2">
                            <div className="text-lg font-bold text-emerald-600">
                              {drug.authenticity}%
                            </div>
                            <ArrowUpRight className="h-4 w-4 text-emerald-500" />
                          </div>
                          <div className="text-xs text-slate-500">authenticity rate</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gradient-to-r from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Package className="h-8 w-8 text-slate-400" />
                      </div>
                      <p className="text-slate-500 font-medium">No drug data available</p>
                      <p className="text-sm text-slate-400 mt-1">Upload batches to see drug performance</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
        </div>

          {/* Enhanced Regional Performance */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 bg-gradient-to-r from-amber-500 to-orange-600 rounded-lg">
                  <Globe className="h-5 w-5 text-white" />
                </div>
                Regional Performance
              </CardTitle>
              <CardDescription className="text-slate-600">
                Verification activity across different regions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 lg:gap-6">
                {data.regionalData.length > 0 ? (
                  data.regionalData.map((region: any) => (
                    <div
                      key={region.region}
                      className="group p-6 bg-gradient-to-br from-slate-50 to-amber-50/30 border border-slate-200 rounded-xl text-center hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer hover:border-amber-200"
                      onClick={() => handleRegionalAnalysis(region.region)}
                    >
                      <div className="w-12 h-12 bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                        <Globe className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="font-bold text-slate-900 mb-4 text-lg">{region.region}</h3>
                      <div className="space-y-3">
                        <div className="bg-white/60 rounded-lg p-3">
                          <p className="text-2xl font-bold text-slate-900">
                            {region.verifications.toLocaleString()}
                          </p>
                          <p className="text-xs text-slate-600 font-medium">
                            Verifications
                          </p>
                        </div>
                        <div className="bg-white/60 rounded-lg p-3">
                          <p className="text-lg font-bold text-slate-900">{region.pharmacies}</p>
                          <p className="text-xs text-slate-600 font-medium">
                            Active Pharmacies
                          </p>
                        </div>
                        <div className="bg-white/60 rounded-lg p-3">
                          <p className="text-lg font-bold text-red-600">
                            {region.counterfeits}
                          </p>
                          <p className="text-xs text-slate-600 font-medium">
                            Counterfeits Detected
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full text-center py-12">
                    <div className="w-20 h-20 bg-gradient-to-r from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Globe className="h-10 w-10 text-slate-400" />
                    </div>
                    <p className="text-slate-500 font-medium text-lg">No regional data available</p>
                    <p className="text-sm text-slate-400 mt-2">Regional data will appear as verifications occur</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Performance Metrics */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
            {/* Verification Trends */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-lg">
                    <BarChart3 className="h-5 w-5 text-white" />
                  </div>
                  Verification Trends
                </CardTitle>
                <CardDescription className="text-slate-600">Daily verification patterns</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.trends.verifications.map((value: number, index: number) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gradient-to-r from-slate-50 to-blue-50/30 rounded-lg border border-slate-200"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center">
                          <span className="text-xs font-bold text-white">{index + 1}</span>
                        </div>
                        <span className="text-sm font-medium text-slate-700">Day {index + 1}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-24 bg-slate-200 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-cyan-600 h-2 rounded-full transition-all duration-500"
                            style={{
                              width: `${
                                (value /
                                  Math.max(
                                    ...analyticsData.trends.verifications
                                  )) *
                                100
                              }%`,
                            }}
                          ></div>
                        </div>
                        <span className="text-sm font-bold text-slate-900 w-16 text-right">
                          {value.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
            </CardContent>
          </Card>

            {/* QR Code Generation Trends */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg">
                    <QrCode className="h-5 w-5 text-white" />
                  </div>
                  QR Code Generation
                </CardTitle>
                <CardDescription className="text-slate-600">
                  Daily QR code generation patterns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.trends.qrGenerations.map((value: number, index: number) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gradient-to-r from-slate-50 to-green-50/30 rounded-lg border border-slate-200"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                          <span className="text-xs font-bold text-white">{index + 1}</span>
                        </div>
                        <span className="text-sm font-medium text-slate-700">Day {index + 1}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-24 bg-slate-200 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full transition-all duration-500"
                            style={{
                              width: `${
                                (value /
                                  Math.max(
                                    ...analyticsData.trends.qrGenerations
                                  )) *
                                100
                              }%`,
                            }}
                          ></div>
                        </div>
                        <span className="text-sm font-bold text-slate-900 w-16 text-right">
                          {value.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
        </div>

          {/* Enhanced Blockchain Analytics */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg">
                  <Database className="h-5 w-5 text-white" />
                </div>
                Blockchain Analytics
              </CardTitle>
              <CardDescription className="text-slate-600">
                Blockchain transaction performance and network health
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                <div className="bg-gradient-to-br from-slate-50 to-indigo-50/30 p-6 rounded-xl border border-slate-200">
                  <h4 className="font-bold text-lg text-slate-900 mb-4 flex items-center gap-2">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                    Transaction Performance
                  </h4>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-white/60 rounded-lg">
                      <span className="text-sm font-medium text-slate-700">Success Rate</span>
                      <span className="font-bold text-emerald-600">99.8%</span>
                    </div>
                    <Progress value={99.8} className="h-3 bg-slate-200" />

                    <div className="flex justify-between items-center p-3 bg-white/60 rounded-lg">
                      <span className="text-sm font-medium text-slate-700">Average Gas Used</span>
                      <span className="font-bold text-slate-900">45,000</span>
                    </div>
                    <Progress value={75} className="h-3 bg-slate-200" />

                    <div className="flex justify-between items-center p-3 bg-white/60 rounded-lg">
                      <span className="text-sm font-medium text-slate-700">Block Confirmation</span>
                      <span className="font-bold text-slate-900">2.3s</span>
                    </div>
                    <Progress value={92} className="h-3 bg-slate-200" />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-slate-50 to-purple-50/30 p-6 rounded-xl border border-slate-200">
                  <h4 className="font-bold text-lg text-slate-900 mb-4 flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    Network Stats
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/60 p-4 rounded-lg">
                      <p className="text-sm text-slate-600 font-medium">Pending Txns</p>
                      <p className="text-xl font-bold text-slate-900">3</p>
                    </div>
                    <div className="bg-white/60 p-4 rounded-lg">
                      <p className="text-sm text-slate-600 font-medium">Daily Volume</p>
                      <p className="text-xl font-bold text-slate-900">12,847</p>
                    </div>
                    <div className="bg-white/60 p-4 rounded-lg">
                      <p className="text-sm text-slate-600 font-medium">Block Height</p>
                      <p className="text-xl font-bold text-slate-900">45,892,147</p>
                    </div>
                    <div className="bg-white/60 p-4 rounded-lg">
                      <p className="text-sm text-slate-600 font-medium">Gas Price</p>
                      <p className="text-xl font-bold text-slate-900">25 Gwei</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-slate-50 to-cyan-50/30 p-6 rounded-xl border border-slate-200">
                  <h4 className="font-bold text-lg text-slate-900 mb-4 flex items-center gap-2">
                    <div className="w-2 h-2 bg-cyan-500 rounded-full"></div>
                    Recent Transactions
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-white/60 rounded-lg">
                      <span className="text-sm font-medium text-slate-700">Batch CT2024001</span>
                      <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs font-medium">
                        Success
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white/60 rounded-lg">
                      <span className="text-sm font-medium text-slate-700">QR Generation</span>
                      <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs font-medium">
                        Success
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white/60 rounded-lg">
                      <span className="text-sm font-medium text-slate-700">Verification Log</span>
                      <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs font-medium">
                        Pending
                      </Badge>
                    </div>
                  </div>
                </div>
            </div>
          </CardContent>
        </Card>

          {/* Enhanced Quick Actions */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 bg-gradient-to-r from-violet-500 to-purple-600 rounded-lg">
                  <Zap className="h-5 w-5 text-white" />
                </div>
                Analytics Actions
              </CardTitle>
              <CardDescription className="text-slate-600">Export and manage analytics data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                <Button
                  variant="default"
                  size="lg"
                  className="h-24 flex-col bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                  onClick={handleExportData}
                >
                  <Download className="h-6 w-6 mb-2" />
                  <span className="font-semibold">Export Report</span>
                </Button>
                <Button
                  variant="secondary"
                  size="lg"
                  className="h-24 flex-col bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                  onClick={handleGenerateReport}
                >
                  <FileText className="h-6 w-6 mb-2" />
                  <span className="font-semibold">Generate PDF</span>
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="h-24 flex-col bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                  onClick={handleViewReports}
                >
                  <Eye className="h-6 w-6 mb-2" />
                  <span className="font-semibold">View Details</span>
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="h-24 flex-col bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                  onClick={handleAnalyticsSettings}
                >
                  <Settings className="h-6 w-6 mb-2" />
                  <span className="font-semibold">Settings</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
