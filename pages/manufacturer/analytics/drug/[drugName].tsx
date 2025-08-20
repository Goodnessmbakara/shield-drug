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
  ArrowLeft,
  MapPin,
  Building,
  Pill,
  AlertCircle,
  CheckSquare,
  XSquare,
  Clock3,
  DollarSign,
  BarChart,
  Minus,
  UploadCloud,
} from "lucide-react";

interface DrugAnalyticsData {
  drugName: string;
  overview: {
    totalBatches: number;
    totalQRCodes: number;
    totalVerifications: number;
    authenticityRate: number;
    complianceRate: number;
    blockchainSuccess: number;
    totalRevenue: number;
    averageBatchSize: number;
    lastUploadDate: string;
    firstUploadDate: string;
  };
  trends: {
    verifications: Array<{ date: string; count: number }>;
    qrGenerations: Array<{ date: string; count: number }>;
    uploads: Array<{ date: string; count: number }>;
    counterfeits: Array<{ date: string; count: number }>;
  };
  batches: Array<{
    batchId: string;
    uploadDate: string;
    quantity: number;
    qrCodesGenerated: number;
    verifications: number;
    authenticityRate: number;
    status: string;
  }>;
  regionalData: Array<{
    region: string;
    verifications: number;
    counterfeits: number;
    authenticityRate: number;
  }>;
  monthlyStats: Array<{
    month: string;
    batches: number;
    qrCodes: number;
    verifications: number;
    revenue: number;
  }>;
  recentActivity: Array<{
    type: string;
    description: string;
    timestamp: string;
    status: string;
  }>;
  blockchainAnalytics: {
    totalTransactions: number;
    successfulTransactions: number;
    failedTransactions: number;
    averageConfirmationTime: number;
    recentTransactions: Array<{
      hash: string;
      status: string;
      timestamp: string;
      batchId: string;
    }>;
  };
}

export default function DrugAnalyticsPage() {
  const router = useRouter();
  const { drugName } = router.query;
  const [userEmail, setUserEmail] = useState<string>("");
  const [isClient, setIsClient] = useState(false);
  const [timeRange, setTimeRange] = useState("30d");
  const [analyticsData, setAnalyticsData] = useState<DrugAnalyticsData | null>(null);
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

  // Fetch drug-specific analytics data
  useEffect(() => {
    if (!userEmail || !drugName) return;

    const fetchDrugAnalyticsData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`/api/manufacturer/analytics/drug/${encodeURIComponent(drugName as string)}?timeRange=${timeRange}`, {
          headers: {
            'x-user-role': 'manufacturer',
            'x-user-email': userEmail
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch drug analytics data');
        }

        const data = await response.json();
        setAnalyticsData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load drug analytics');
        console.error('Error fetching drug analytics:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDrugAnalyticsData();
  }, [userEmail, drugName, timeRange]);

  // Show loading state
  if (isLoading) {
    return (
      <DashboardLayout userRole="manufacturer" userName={userEmail}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Activity className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Loading drug analytics data...</p>
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
            <p className="text-danger">Failed to load drug analytics: {error}</p>
            <Button onClick={() => window.location.reload()} size="sm" className="mt-4">
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
    drugName: drugName as string,
    overview: {
      totalBatches: 0,
      totalQRCodes: 0,
      totalVerifications: 0,
      authenticityRate: 0,
      complianceRate: 0,
      blockchainSuccess: 0,
      totalRevenue: 0,
      averageBatchSize: 0,
      lastUploadDate: '',
      firstUploadDate: '',
    },
    trends: {
      verifications: [],
      qrGenerations: [],
      uploads: [],
      counterfeits: [],
    },
    batches: [],
    regionalData: [],
    monthlyStats: [],
    recentActivity: [],
    blockchainAnalytics: {
      totalTransactions: 0,
      successfulTransactions: 0,
      failedTransactions: 0,
      averageConfirmationTime: 0,
      recentTransactions: [],
    },
  };

  const getTrendIcon = (current: number, previous: number) => {
    if (previous === 0) return <Minus className="h-4 w-4 text-muted-foreground" />;
    const change = ((current - previous) / previous) * 100;
    if (change > 0) {
      return <TrendingUp className="h-4 w-4 text-success" />;
    } else if (change < 0) {
      return <TrendingDown className="h-4 w-4 text-danger" />;
    } else {
      return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getTrendValue = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? "+100%" : "0%";
    const change = ((current - previous) / previous) * 100;
    return `${change > 0 ? "+" : ""}${change.toFixed(1)}%`;
  };

  const getTrendColor = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? "text-success" : "text-muted-foreground";
    const change = ((current - previous) / previous) * 100;
    if (change > 0) return "text-success";
    if (change < 0) return "text-danger";
    return "text-muted-foreground";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-success text-success-foreground"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case 'processing':
        return <Badge className="bg-warning text-warning-foreground"><Clock className="w-3 h-3 mr-1" />Processing</Badge>;
      case 'failed':
        return <Badge className="bg-destructive text-destructive-foreground"><XSquare className="w-3 h-3 mr-1" />Failed</Badge>;
      default:
        return <Badge className="bg-muted text-muted-foreground"><Activity className="w-3 h-3 mr-1" />Unknown</Badge>;
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'upload':
        return <UploadCloud className="w-4 h-4" />;
      case 'verification':
        return <CheckCircle className="w-4 h-4" />;
      case 'counterfeit':
        return <AlertTriangle className="w-4 h-4" />;
      case 'blockchain':
        return <Hash className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  return (
    <DashboardLayout userRole="manufacturer" userName={userEmail}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/manufacturer/analytics')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Analytics
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Pill className="w-8 h-8 mr-3 text-blue-600" />
                {data.drugName} Analytics
              </h1>
              <p className="text-muted-foreground">Detailed performance metrics for {data.drugName}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <Select value={timeRange} onValueChange={setTimeRange}>
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
            
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Batches</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.overview.totalBatches.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Average batch size: {data.overview.averageBatchSize.toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">QR Codes Generated</CardTitle>
              <QrCode className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.overview.totalQRCodes.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {data.overview.totalVerifications.toLocaleString()} verifications
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Authenticity Rate</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.overview.authenticityRate.toFixed(1)}%</div>
              <Progress value={data.overview.authenticityRate} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${data.overview.totalRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Blockchain success: {data.overview.blockchainSuccess.toFixed(1)}%
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts and Detailed Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Trends Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="w-5 h-5 mr-2" />
                Verification Trends
              </CardTitle>
              <CardDescription>
                Daily verification activity for {data.drugName}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data.trends.verifications.length > 0 ? (
                <div className="space-y-4">
                  {data.trends.verifications.slice(-7).map((item, index) => (
                    <div key={item.date} className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        {new Date(item.date).toLocaleDateString()}
                      </span>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">{item.count}</span>
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${(item.count / Math.max(...data.trends.verifications.map(v => v.count))) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <BarChart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No verification data available</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Regional Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Globe className="w-5 h-5 mr-2" />
                Regional Distribution
              </CardTitle>
              <CardDescription>
                Verification activity by region
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data.regionalData.length > 0 ? (
                <div className="space-y-4">
                  {data.regionalData.map((region) => (
                    <div key={region.region} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{region.region}</span>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="text-sm text-muted-foreground">
                          {region.verifications} verifications
                        </span>
                        <Badge variant={region.authenticityRate >= 95 ? "default" : "secondary"}>
                          {region.authenticityRate.toFixed(1)}%
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Globe className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No regional data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Batches Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Database className="w-5 h-5 mr-2" />
              Batch Performance
            </CardTitle>
            <CardDescription>
              Detailed performance metrics for each batch
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data.batches.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium">Batch ID</th>
                      <th className="text-left py-3 px-4 font-medium">Upload Date</th>
                      <th className="text-left py-3 px-4 font-medium">Quantity</th>
                      <th className="text-left py-3 px-4 font-medium">QR Codes</th>
                      <th className="text-left py-3 px-4 font-medium">Verifications</th>
                      <th className="text-left py-3 px-4 font-medium">Authenticity Rate</th>
                      <th className="text-left py-3 px-4 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.batches.map((batch) => (
                      <tr key={batch.batchId} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 font-mono text-sm">{batch.batchId}</td>
                        <td className="py-3 px-4 text-sm">
                          {new Date(batch.uploadDate).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-sm">{batch.quantity.toLocaleString()}</td>
                        <td className="py-3 px-4 text-sm">{batch.qrCodesGenerated.toLocaleString()}</td>
                        <td className="py-3 px-4 text-sm">{batch.verifications.toLocaleString()}</td>
                        <td className="py-3 px-4 text-sm">
                          <Badge variant={batch.authenticityRate >= 95 ? "default" : "secondary"}>
                            {batch.authenticityRate.toFixed(1)}%
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-sm">
                          {getStatusBadge(batch.status)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Database className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No batch data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity and Blockchain Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="w-5 h-5 mr-2" />
                Recent Activity
              </CardTitle>
              <CardDescription>
                Latest events and activities for {data.drugName}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data.recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {data.recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{activity.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(activity.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <Badge variant={activity.status === 'success' ? "default" : "secondary"}>
                        {activity.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No recent activity</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Blockchain Analytics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Hash className="w-5 h-5 mr-2" />
                Blockchain Analytics
              </CardTitle>
              <CardDescription>
                Blockchain transaction performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-success">
                      {data.blockchainAnalytics.successfulTransactions}
                    </div>
                    <p className="text-xs text-muted-foreground">Successful</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-destructive">
                      {data.blockchainAnalytics.failedTransactions}
                    </div>
                    <p className="text-xs text-muted-foreground">Failed</p>
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-lg font-semibold">
                    {data.blockchainAnalytics.averageConfirmationTime.toFixed(2)}s
                  </div>
                  <p className="text-xs text-muted-foreground">Avg. Confirmation Time</p>
                </div>

                {data.blockchainAnalytics.recentTransactions.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Recent Transactions</p>
                    {data.blockchainAnalytics.recentTransactions.slice(0, 3).map((tx, index) => (
                      <div key={index} className="flex items-center justify-between text-xs">
                        <span className="font-mono truncate max-w-24">
                          {tx.hash.substring(0, 8)}...
                        </span>
                        <Badge variant={tx.status === 'confirmed' ? "default" : "secondary"}>
                          {tx.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
