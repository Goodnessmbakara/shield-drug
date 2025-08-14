import { useState, useEffect } from "react";
import { useRouter } from "next/router";
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
  Users,
  Activity,
  Settings,
  FileText,
  Shield,
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  Database,
  Server,
  Globe,
  Lock,
  RefreshCw,
  QrCode,
} from "lucide-react";

interface AdminDashboardData {
  stats: {
    totalUsers: number;
    activeUsers: number;
    verifiedUsers: number;
    systemUptime: number;
    securityIncidents: number;
    auditLogs: number;
    apiCalls: number;
  };
  roleDistribution: Record<string, number>;
  recentUsers: Array<{
    id: string;
    name: string;
    role: string;
    status: string;
    lastLogin: string;
  }>;
  systemHealth: {
    uptime: string;
    responseTime: string;
    activeUsers: number;
    totalUsers: number;
    storageUsed: number;
    memoryUsage: number;
    cpuUsage: number;
    networkStatus: string;
  };
  securityOverview: {
    authentication: {
      twoFactorEnabled: number;
      strongPasswords: number;
      sessionSecurity: number;
    };
    networkSecurity: {
      sslActive: number;
      ddosProtection: number;
      firewallStatus: number;
    };
    dataProtection: {
      encryption: string;
      backupStatus: string;
      compliance: string;
    };
  };
  activityMetrics: {
    activeUsersLastHour: number;
    activeUsersLastDay: number;
    activeUsersLastWeek: number;
    newUsersLastMonth: number;
    newBatchesLastMonth: number;
    newQRCodesLastMonth: number;
  };
  uploadStats: {
    totalBatches: number;
    totalQuantity: number;
    totalQRCodesGenerated: number;
    recentBatches: Array<{
      id: string;
      drug: string;
      batchId: string;
      manufacturer: string;
      status: string;
      quantity: number;
      dateCreated: string;
    }>;
  };
  qrCodeStats: {
    totalQRCodes: number;
    totalDownloads: number;
    totalVerifications: number;
    scannedQRCodes: number;
  };
  verificationStats: {
    totalVerifications: number;
    successfulVerifications: number;
    failedVerifications: number;
    successRate: string;
  };
  reportStats: {
    totalReports: number;
  };
}

export default function AdminDashboard() {
  const router = useRouter();
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");

  useEffect(() => {
    // Get user email from localStorage
    if (typeof window !== "undefined") {
      const email = localStorage.getItem("userEmail");
      if (email) {
        setUserEmail(email);
      }
    }
  }, []);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!userEmail) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch('/api/admin/dashboard', {
          headers: {
            'x-user-role': 'admin',
            'x-user-email': userEmail
          }
        });
        
        if (response.ok) {
          const dashboardData = await response.json();
          setData(dashboardData);
        } else {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to fetch dashboard data (${response.status})`);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load dashboard data';
        setError(errorMessage);
        console.error('Error fetching admin dashboard data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [userEmail]);

  // Use data from API or fallback to empty values
  const stats = data?.stats || {
    totalUsers: 0,
    activeUsers: 0,
    systemUptime: 0,
    securityIncidents: 0,
    auditLogs: 0,
    apiCalls: 0,
  };

  const systemHealth = data?.systemHealth || {
    uptime: "0%",
    responseTime: "0ms",
    activeUsers: 0,
    totalUsers: 0,
    storageUsed: 0,
    memoryUsage: 0,
    cpuUsage: 0,
    networkStatus: "unknown",
  };

  const recentUsers = data?.recentUsers || [];
  const securityOverview = data?.securityOverview;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-success text-success-foreground">Active</Badge>
        );
      case "inactive":
        return (
          <Badge className="bg-muted text-muted-foreground">Inactive</Badge>
        );
      case "suspended":
        return (
          <Badge className="bg-danger text-danger-foreground">Suspended</Badge>
        );
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const handleSystemSettings = () => {
    router.push('/admin/settings');
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "manufacturer":
        return <Badge variant="outline">Manufacturer</Badge>;
      case "pharmacist":
        return <Badge variant="outline">Pharmacist</Badge>;
      case "consumer":
        return <Badge variant="outline">Consumer</Badge>;
      case "regulatory":
        return <Badge variant="outline">Regulatory</Badge>;
      case "admin":
        return <Badge variant="outline">Admin</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Loading admin dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center max-w-md">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-destructive" />
            <h3 className="text-lg font-semibold text-destructive mb-2">
              Error Loading Dashboard
            </h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button 
              variant="outline" 
              onClick={() => window.location.reload()} 
              className="w-full"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground">
            System administration, user management, and security monitoring
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => window.location.reload()}
            size="sm"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="hero" size="xl" onClick={handleSystemSettings}>
            <Settings className="mr-2 h-5 w-5" />
            System Settings
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card className="shadow-soft hover:shadow-medium transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalUsers.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">+156 this month</p>
          </CardContent>
        </Card>

        <Card className="shadow-soft hover:shadow-medium transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Activity className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {stats.activeUsers.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Currently online</p>
          </CardContent>
        </Card>

        <Card className="shadow-soft hover:shadow-medium transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
            <Server className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {stats.systemUptime}%
            </div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>

        <Card className="shadow-soft hover:shadow-medium transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Security Incidents
            </CardTitle>
            <Shield className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {stats.securityIncidents}
            </div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card className="shadow-soft hover:shadow-medium transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Audit Logs</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.auditLogs.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Today</p>
          </CardContent>
        </Card>

        <Card className="shadow-soft hover:shadow-medium transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Calls</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(stats.apiCalls / 1000).toFixed(1)}K
            </div>
            <p className="text-xs text-muted-foreground">This hour</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Recent Users
            </CardTitle>
            <CardDescription>
              Latest user registrations and activity ({recentUsers.length} users)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentUsers.length > 0 ? (
                recentUsers.map((user) => (
                  <div
                    key={user.id}
                    className="p-4 border border-border rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-muted-foreground">
                          ID: {user.id}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {getRoleBadge(user.role)}
                        {getStatusBadge(user.status)}
                      </div>
                    </div>

                    <div className="text-sm text-muted-foreground">
                      Last login: {user.lastLogin}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No recent users found</p>
                  <p className="text-sm">Users will appear here as they register</p>
                </div>
              )}
            </div>
            <Button variant="outline" className="w-full mt-4">
              View All Users
            </Button>
          </CardContent>
        </Card>

        {/* System Health */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              System Health
            </CardTitle>
            <CardDescription>
              Real-time system performance metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">System Status</span>
                <Badge className="bg-success text-success-foreground">
                  <div className="w-2 h-2 bg-current rounded-full mr-1 animate-pulse"></div>
                  Optimal
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Storage Usage</span>
                  <span className="font-medium">
                    {systemHealth.storageUsed}%
                  </span>
                </div>
                <Progress value={systemHealth.storageUsed} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Memory Usage</span>
                  <span className="font-medium">
                    {systemHealth.memoryUsage}%
                  </span>
                </div>
                <Progress value={systemHealth.memoryUsage} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>CPU Usage</span>
                  <span className="font-medium">{systemHealth.cpuUsage}%</span>
                </div>
                <Progress value={systemHealth.cpuUsage} className="h-2" />
              </div>

              <div className="pt-4 border-t border-border">
                <div className="flex items-center justify-between text-sm">
                  <span>Uptime</span>
                  <span className="text-muted-foreground">
                    {systemHealth.uptime}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Response Time</span>
                  <span className="text-muted-foreground">
                    {systemHealth.responseTime}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Active Users</span>
                  <span className="text-muted-foreground">
                    {systemHealth.activeUsers.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Security Overview */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Overview
          </CardTitle>
          <CardDescription>
            System security status and threat monitoring
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium">Authentication</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>2FA Enabled</span>
                  <span className="font-medium">{securityOverview?.authentication.twoFactorEnabled || 0}%</span>
                </div>
                <Progress value={securityOverview?.authentication.twoFactorEnabled || 0} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Strong Passwords</span>
                  <span className="font-medium">{securityOverview?.authentication.strongPasswords || 0}%</span>
                </div>
                <Progress value={securityOverview?.authentication.strongPasswords || 0} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Session Security</span>
                  <span className="font-medium">{securityOverview?.authentication.sessionSecurity || 0}%</span>
                </div>
                <Progress value={securityOverview?.authentication.sessionSecurity || 0} className="h-2" />
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">Network Security</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>SSL/TLS Active</span>
                  <span className="font-medium">{securityOverview?.networkSecurity.sslActive || 0}%</span>
                </div>
                <Progress value={securityOverview?.networkSecurity.sslActive || 0} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>DDoS Protection</span>
                  <span className="font-medium">{securityOverview?.networkSecurity.ddosProtection || 0}%</span>
                </div>
                <Progress value={securityOverview?.networkSecurity.ddosProtection || 0} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Firewall Status</span>
                  <span className="font-medium">{securityOverview?.networkSecurity.firewallStatus || 0}%</span>
                </div>
                <Progress value={securityOverview?.networkSecurity.firewallStatus || 0} className="h-2" />
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">Data Protection</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Encryption</span>
                  <span className="font-medium">{securityOverview?.dataProtection.encryption || 'Unknown'}</span>
                </div>
                <Progress value={100} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Backup Status</span>
                  <span className="font-medium">{securityOverview?.dataProtection.backupStatus || 'Unknown'}</span>
                </div>
                <Progress value={100} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Compliance</span>
                  <span className="font-medium">{securityOverview?.dataProtection.compliance || 'Unknown'}</span>
                </div>
                <Progress value={100} className="h-2" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Batch Statistics */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Batch Statistics
            </CardTitle>
            <CardDescription>
              Drug batch uploads and processing metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Batches</p>
                  <p className="text-2xl font-bold">{data?.uploadStats.totalBatches.toLocaleString() || '0'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Quantity</p>
                  <p className="text-2xl font-bold">{data?.uploadStats.totalQuantity.toLocaleString() || '0'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">QR Codes Generated</p>
                  <p className="text-2xl font-bold">{data?.uploadStats.totalQRCodesGenerated.toLocaleString() || '0'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">New This Month</p>
                  <p className="text-2xl font-bold text-success">{data?.activityMetrics.newBatchesLastMonth || '0'}</p>
                </div>
              </div>
              
              {data?.uploadStats.recentBatches && data.uploadStats.recentBatches.length > 0 && (
                <div className="pt-4 border-t border-border">
                  <h4 className="font-medium mb-3">Recent Batches</h4>
                  <div className="space-y-2">
                    {data.uploadStats.recentBatches.slice(0, 3).map((batch) => (
                      <div key={batch.id} className="flex items-center justify-between text-sm">
                        <div>
                          <p className="font-medium">{batch.drug}</p>
                          <p className="text-muted-foreground">{batch.batchId}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{batch.quantity} units</p>
                          <Badge variant="outline" className="text-xs">
                            {batch.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* QR Code & Verification Statistics */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              QR Code & Verification Stats
            </CardTitle>
            <CardDescription>
              QR code generation and verification metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total QR Codes</p>
                  <p className="text-2xl font-bold">{data?.qrCodeStats.totalQRCodes.toLocaleString() || '0'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Downloads</p>
                  <p className="text-2xl font-bold">{data?.qrCodeStats.totalDownloads.toLocaleString() || '0'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Verifications</p>
                  <p className="text-2xl font-bold">{data?.verificationStats.totalVerifications.toLocaleString() || '0'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Success Rate</p>
                  <p className="text-2xl font-bold text-success">{data?.verificationStats.successRate || '0'}%</p>
                </div>
              </div>
              
              <div className="pt-4 border-t border-border">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Scanned QR Codes</span>
                    <span className="font-medium">{data?.qrCodeStats.scannedQRCodes.toLocaleString() || '0'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Successful Verifications</span>
                    <span className="font-medium text-success">{data?.verificationStats.successfulVerifications.toLocaleString() || '0'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Failed Verifications</span>
                    <span className="font-medium text-destructive">{data?.verificationStats.failedVerifications.toLocaleString() || '0'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>New QR Codes This Month</span>
                    <span className="font-medium text-success">{data?.activityMetrics.newQRCodesLastMonth || '0'}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
