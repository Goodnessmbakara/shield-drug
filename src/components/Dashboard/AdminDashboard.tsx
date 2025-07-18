import { useState } from "react";
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
} from "lucide-react";

export default function AdminDashboard() {
  const [users] = useState([
    {
      id: "USR001",
      name: "John Doe",
      role: "manufacturer",
      status: "active",
      lastLogin: "2 hours ago",
    },
    {
      id: "USR002",
      name: "Jane Smith",
      role: "pharmacist",
      status: "active",
      lastLogin: "1 hour ago",
    },
    {
      id: "USR003",
      name: "Bob Wilson",
      role: "regulatory",
      status: "inactive",
      lastLogin: "3 days ago",
    },
  ]);

  const [systemHealth] = useState({
    uptime: "99.98%",
    responseTime: "45ms",
    activeUsers: 1247,
    totalUsers: 8923,
    storageUsed: 67,
    memoryUsage: 78,
    cpuUsage: 45,
    networkStatus: "optimal",
  });

  const stats = {
    totalUsers: 8923,
    activeUsers: 1247,
    systemUptime: 99.98,
    securityIncidents: 0,
    auditLogs: 45670,
    apiCalls: 234000,
  };

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
        <Button variant="hero" size="xl">
          <Settings className="mr-2 h-5 w-5" />
          System Settings
        </Button>
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
              Latest user registrations and activity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {users.map((user) => (
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
              ))}
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
                  <span className="font-medium">89%</span>
                </div>
                <Progress value={89} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Strong Passwords</span>
                  <span className="font-medium">94%</span>
                </div>
                <Progress value={94} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Session Security</span>
                  <span className="font-medium">100%</span>
                </div>
                <Progress value={100} className="h-2" />
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">Network Security</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>SSL/TLS Active</span>
                  <span className="font-medium">100%</span>
                </div>
                <Progress value={100} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>DDoS Protection</span>
                  <span className="font-medium">Active</span>
                </div>
                <Progress value={100} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Firewall Status</span>
                  <span className="font-medium">Protected</span>
                </div>
                <Progress value={100} className="h-2" />
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">Data Protection</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Encryption</span>
                  <span className="font-medium">AES-256</span>
                </div>
                <Progress value={100} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Backup Status</span>
                  <span className="font-medium">Daily</span>
                </div>
                <Progress value={100} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Compliance</span>
                  <span className="font-medium">GDPR Ready</span>
                </div>
                <Progress value={100} className="h-2" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
