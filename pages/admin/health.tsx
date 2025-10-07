import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import DashboardLayout from "@/components/Layout/DashboardLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Activity,
  Server,
  Database,
  Wifi,
  CheckCircle,
  AlertTriangle,
  Clock,
  Info,
  RefreshCw,
  Users,
  Upload,
  QrCode,
  Shield,
  FileWarning,
  AlertCircle,
} from "lucide-react";

type HealthStatus = "healthy" | "warning" | "critical";

interface ServiceHealth {
  name: string;
  status: HealthStatus;
  uptime: string;
  responseTime: string;
  lastCheck: string;
  details?: string;
}

interface SystemMetrics {
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkLatency: number;
  activeConnections: number;
  totalTransactions: number;
}

interface DatabaseStats {
  totalUsers: number;
  activeUsers: number;
  totalUploads: number;
  totalQRCodes: number;
  totalVerifications: number;
  totalReports: number;
  pendingReports: number;
  resolvedReports: number;
  recentReports: number;
  authenticVerifications: number;
  counterfeitVerifications: number;
}

interface HealthData {
  overallStatus: HealthStatus;
  uptime: string;
  lastCheck: string;
  services: ServiceHealth[];
  metrics: SystemMetrics;
  database: DatabaseStats;
  timestamp: string;
}

export default function AdminHealthPage() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string>("");
  const [isClient, setIsClient] = useState(false);
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    setIsClient(true);
    if (typeof window !== "undefined") {
      const role = localStorage.getItem("userRole");
      const email = localStorage.getItem("userEmail");
      if (role !== "admin") {
        router.push("/login");
        return;
      }
      if (email) {
        setUserEmail(email);
      }
    }
  }, [router]);

  const fetchHealthData = async () => {
    try {
      const response = await fetch("/api/admin/health");
      if (!response.ok) {
        throw new Error("Failed to fetch health data");
      }
      const data = await response.json();
      setHealthData(data);
      setError(null);
    } catch (err) {
      console.error("Error fetching health data:", err);
      setError("Failed to load health data. Please try again.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (isClient) {
      fetchHealthData();
    }
  }, [isClient]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh || !isClient) return;

    const interval = setInterval(() => {
      fetchHealthData();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, isClient]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchHealthData();
  };

  const toggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "healthy":
        return (
          <Badge className="bg-success text-success-foreground">
            <CheckCircle className="w-3 h-3 mr-1" />
            Healthy
          </Badge>
        );
      case "warning":
        return (
          <Badge className="bg-warning text-warning-foreground">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Warning
          </Badge>
        );
      case "critical":
        return (
          <Badge className="bg-danger text-danger-foreground">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Critical
          </Badge>
        );
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
        return <CheckCircle className="h-5 w-5 text-success" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-warning" />;
      case "critical":
        return <AlertTriangle className="h-5 w-5 text-danger" />;
      default:
        return <Clock className="h-5 w-5 text-muted-foreground" />;
    }
  };

  if (!isClient) return null;

  if (isLoading) {
    return (
      <DashboardLayout userRole="admin" userName={userEmail}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading health data...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !healthData) {
    return (
      <DashboardLayout userRole="admin" userName={userEmail}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <AlertTriangle className="h-8 w-8 mx-auto mb-4 text-destructive" />
            <p className="text-muted-foreground mb-4">
              {error || "Failed to load health data"}
            </p>
            <Button onClick={handleRefresh}>Try Again</Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userRole="admin" userName={userEmail}>
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">System Health</h1>
            <p className="text-muted-foreground">
              Monitor system performance and service status in real-time
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={autoRefresh ? "default" : "outline"}
              size="sm"
              onClick={toggleAutoRefresh}
            >
              {autoRefresh ? "Auto-refresh ON" : "Auto-refresh OFF"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>
        </div>

        {/* Overall Status */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Overall System Status
            </CardTitle>
            <CardDescription>
              Current system health and performance metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-success">
                  {healthData.uptime}
                </div>
                <p className="text-sm text-muted-foreground">System Uptime</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {healthData.metrics.activeConnections}
                </div>
                <p className="text-sm text-muted-foreground">
                  Active Connections
                </p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {healthData.metrics.totalTransactions}
                </div>
                <p className="text-sm text-muted-foreground">
                  Total Transactions
                </p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {healthData.metrics.networkLatency}ms
                </div>
                <p className="text-sm text-muted-foreground">Network Latency</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Database Statistics */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Database Statistics
            </CardTitle>
            <CardDescription>
              Real-time database metrics and activity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <Users className="h-6 w-6 mx-auto mb-2 text-primary" />
                <div className="text-2xl font-bold">{healthData.database.totalUsers}</div>
                <p className="text-xs text-muted-foreground">Total Users</p>
                <p className="text-xs text-success mt-1">
                  {healthData.database.activeUsers} active
                </p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <Upload className="h-6 w-6 mx-auto mb-2 text-primary" />
                <div className="text-2xl font-bold">{healthData.database.totalUploads}</div>
                <p className="text-xs text-muted-foreground">Total Uploads</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <QrCode className="h-6 w-6 mx-auto mb-2 text-primary" />
                <div className="text-2xl font-bold">{healthData.database.totalQRCodes}</div>
                <p className="text-xs text-muted-foreground">QR Codes</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <Shield className="h-6 w-6 mx-auto mb-2 text-primary" />
                <div className="text-2xl font-bold">{healthData.database.totalVerifications}</div>
                <p className="text-xs text-muted-foreground">Verifications</p>
                <p className="text-xs text-success mt-1">
                  {healthData.database.authenticVerifications} authentic
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Consumer Reports Section */}
        <Card className="shadow-soft border-l-4 border-l-warning">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileWarning className="h-5 w-5 text-warning" />
              Consumer Reports
            </CardTitle>
            <CardDescription>
              Counterfeit drug reports submitted by consumers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Report Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 border rounded-lg bg-accent/5">
                  <div className="text-3xl font-bold text-foreground">
                    {healthData.database.totalReports}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">Total Reports</p>
                </div>
                <div className="text-center p-4 border rounded-lg bg-destructive/5">
                  <div className="flex items-center justify-center gap-2">
                    <AlertCircle className="h-5 w-5 text-destructive" />
                    <div className="text-3xl font-bold text-destructive">
                      {healthData.database.pendingReports}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">Pending Review</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 text-xs"
                    onClick={() => window.location.href = '/admin/logs?filter=reports'}
                  >
                    Review Now
                  </Button>
                </div>
                <div className="text-center p-4 border rounded-lg bg-success/5">
                  <div className="flex items-center justify-center gap-2">
                    <CheckCircle className="h-5 w-5 text-success" />
                    <div className="text-3xl font-bold text-success">
                      {healthData.database.resolvedReports}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">Resolved</p>
                </div>
                <div className="text-center p-4 border rounded-lg bg-warning/5">
                  <div className="flex items-center justify-center gap-2">
                    <Clock className="h-5 w-5 text-warning" />
                    <div className="text-3xl font-bold text-warning">
                      {healthData.database.recentReports}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">Last 24 Hours</p>
                </div>
              </div>

              {/* Alert if there are pending reports */}
              {healthData.database.pendingReports > 0 && (
                <div className="flex items-center gap-3 p-4 border border-warning/50 bg-warning/10 rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-warning flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-foreground">
                      Action Required: {healthData.database.pendingReports} Pending Report{healthData.database.pendingReports > 1 ? 's' : ''}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Consumer reports need administrative review to ensure drug safety
                    </p>
                  </div>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => window.location.href = '/admin/logs?filter=reports'}
                  >
                    View Reports
                  </Button>
                </div>
              )}

              {/* Resolution Rate */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Resolution Rate</span>
                  <span className="font-bold">
                    {healthData.database.totalReports > 0
                      ? Math.round((healthData.database.resolvedReports / healthData.database.totalReports) * 100)
                      : 0}%
                  </span>
                </div>
                <Progress
                  value={healthData.database.totalReports > 0
                    ? (healthData.database.resolvedReports / healthData.database.totalReports) * 100
                    : 0}
                  className="h-2"
                />
                <p className="text-xs text-muted-foreground">
                  {healthData.database.resolvedReports} of {healthData.database.totalReports} reports resolved
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Service Status */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Service Status</CardTitle>
            <CardDescription>
              Individual service health and performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {healthData.services.map((service, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 border border-border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(service.status)}
                    <div>
                      <p className="font-medium">{service.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Response: {service.responseTime}
                      </p>
                      {service.details && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {service.details}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(service.status)}
                    <div className="text-right">
                      <p className="text-sm font-medium">{service.uptime}</p>
                      <p className="text-xs text-muted-foreground">
                        Last check: {service.lastCheck}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* System Metrics */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>System Metrics</CardTitle>
            <CardDescription>Real-time system resource usage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-medium">CPU Usage</h4>
                <div className="flex items-center gap-2">
                  <Progress
                    value={healthData.metrics.cpuUsage}
                    className="h-2"
                  />
                  <span className="font-bold">
                    {Math.round(healthData.metrics.cpuUsage)}%
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Current CPU utilization
                </p>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Memory Usage</h4>
                <div className="flex items-center gap-2">
                  <Progress
                    value={healthData.metrics.memoryUsage}
                    className="h-2"
                  />
                  <span className="font-bold">
                    {Math.round(healthData.metrics.memoryUsage)}%
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">RAM utilization</p>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Disk Usage</h4>
                <div className="flex items-center gap-2">
                  <Progress
                    value={healthData.metrics.diskUsage}
                    className="h-2"
                  />
                  <span className="font-bold">
                    {Math.round(healthData.metrics.diskUsage)}%
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Storage utilization
                </p>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Network Status</h4>
                <div className="flex items-center gap-2">
                  <Wifi className="h-5 w-5 text-success" />
                  <span className="font-bold">Connected</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Network connectivity
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Last Updated */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Clock className="h-3 w-3" />
            <span>Last updated: {healthData.lastCheck}</span>
          </div>
          {autoRefresh && (
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
              <span>Auto-refreshing every 30s</span>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
