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
import {
  Activity,
  Server,
  Database,
  Wifi,
  CheckCircle,
  AlertTriangle,
  Clock,
  Info,
} from "lucide-react";

export default function AdminHealthPage() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string>("");
  const [isClient, setIsClient] = useState(false);

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

  const systemHealth = {
    overallStatus: "healthy",
    uptime: "99.9%",
    lastCheck: "2024-06-01 15:00",
    services: [
      {
        name: "Web Server",
        status: "healthy",
        uptime: "99.9%",
        responseTime: "45ms",
        lastCheck: "2024-06-01 15:00",
      },
      {
        name: "Database",
        status: "healthy",
        uptime: "99.8%",
        responseTime: "12ms",
        lastCheck: "2024-06-01 15:00",
      },
      {
        name: "Blockchain Network",
        status: "healthy",
        uptime: "99.7%",
        responseTime: "2.3s",
        lastCheck: "2024-06-01 15:00",
      },
      {
        name: "NAFDAC API",
        status: "warning",
        uptime: "95.2%",
        responseTime: "1.8s",
        lastCheck: "2024-06-01 15:00",
      },
    ],
    metrics: {
      cpuUsage: 23,
      memoryUsage: 67,
      diskUsage: 45,
      networkLatency: 45,
      activeConnections: 1247,
      totalTransactions: 2847,
    },
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

  return (
    <DashboardLayout userRole="admin" userName={userEmail}>
      <div className="space-y-6 max-w-5xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold text-foreground">System Health</h1>
          <p className="text-muted-foreground">
            Monitor system performance and service status
          </p>
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
                  {systemHealth.uptime}
                </div>
                <p className="text-sm text-muted-foreground">System Uptime</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {systemHealth.metrics.activeConnections}
                </div>
                <p className="text-sm text-muted-foreground">
                  Active Connections
                </p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {systemHealth.metrics.totalTransactions}
                </div>
                <p className="text-sm text-muted-foreground">
                  Total Transactions
                </p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {systemHealth.metrics.networkLatency}ms
                </div>
                <p className="text-sm text-muted-foreground">Network Latency</p>
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
              {systemHealth.services.map((service, index) => (
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
                    value={systemHealth.metrics.cpuUsage}
                    className="h-2"
                  />
                  <span className="font-bold">
                    {systemHealth.metrics.cpuUsage}%
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
                    value={systemHealth.metrics.memoryUsage}
                    className="h-2"
                  />
                  <span className="font-bold">
                    {systemHealth.metrics.memoryUsage}%
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">RAM utilization</p>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Disk Usage</h4>
                <div className="flex items-center gap-2">
                  <Progress
                    value={systemHealth.metrics.diskUsage}
                    className="h-2"
                  />
                  <span className="font-bold">
                    {systemHealth.metrics.diskUsage}%
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
        <div className="text-right text-xs text-muted-foreground">
          Last updated: {systemHealth.lastCheck}
        </div>
      </div>
    </DashboardLayout>
  );
}
