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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  Info,
  AlertTriangle,
  CheckCircle,
  Clock,
  Search,
  Download,
  Eye,
} from "lucide-react";

export default function AdminLogsPage() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string>("");
  const [isClient, setIsClient] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterLevel, setFilterLevel] = useState("all");
  const [filterType, setFilterType] = useState("all");

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

  const logs = [
    {
      id: 1,
      timestamp: "2024-06-01 15:30:22",
      level: "info",
      type: "user_activity",
      message: "User login successful",
      user: "john.smith@pfizer.com",
      ip: "192.168.1.100",
      details: "Manufacturer user logged in successfully",
    },
    {
      id: 2,
      timestamp: "2024-06-01 15:25:15",
      level: "warning",
      type: "security",
      message: "Suspicious login attempt",
      user: "unknown@example.com",
      ip: "203.0.113.45",
      details: "Multiple failed login attempts from suspicious IP",
    },
    {
      id: 3,
      timestamp: "2024-06-01 15:20:08",
      level: "error",
      type: "system",
      message: "Database connection timeout",
      user: "system",
      ip: "127.0.0.1",
      details: "Database connection failed after 30 seconds",
    },
    {
      id: 4,
      timestamp: "2024-06-01 15:15:42",
      level: "info",
      type: "audit",
      message: "Drug verification completed",
      user: "sarah.johnson@medplus.com",
      ip: "192.168.1.101",
      details: "QR code scan for batch ABX202405D verified successfully",
    },
    {
      id: 5,
      timestamp: "2024-06-01 15:10:33",
      level: "info",
      type: "blockchain",
      message: "Transaction recorded",
      user: "system",
      ip: "127.0.0.1",
      details: "Blockchain transaction 0x1234abcd...5678 confirmed",
    },
  ];

  const getLevelBadge = (level: string) => {
    switch (level) {
      case "info":
        return (
          <Badge className="bg-info text-info-foreground">
            <Info className="w-3 h-3 mr-1" />
            Info
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
            <AlertTriangle className="w-3 h-3 mr-1" />
            Error
          </Badge>
        );
      case "success":
        return (
          <Badge className="bg-success text-success-foreground">
            <CheckCircle className="w-3 h-3 mr-1" />
            Success
          </Badge>
        );
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "user_activity":
        return (
          <Badge className="bg-primary text-primary-foreground">
            User Activity
          </Badge>
        );
      case "security":
        return (
          <Badge className="bg-danger text-danger-foreground">Security</Badge>
        );
      case "system":
        return (
          <Badge className="bg-secondary text-secondary-foreground">
            System
          </Badge>
        );
      case "audit":
        return (
          <Badge className="bg-warning text-warning-foreground">Audit</Badge>
        );
      case "blockchain":
        return (
          <Badge className="bg-success text-success-foreground">
            Blockchain
          </Badge>
        );
      default:
        return <Badge variant="outline">Other</Badge>;
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case "info":
        return <Info className="h-4 w-4 text-info" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      case "error":
        return <AlertTriangle className="h-4 w-4 text-danger" />;
      case "success":
        return <CheckCircle className="h-4 w-4 text-success" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = filterLevel === "all" || log.level === filterLevel;
    const matchesType = filterType === "all" || log.type === filterType;
    return matchesSearch && matchesLevel && matchesType;
  });

  const handleViewDetails = (id: number) => {
    // In a real app, show detailed log information
    alert(`View details for log ID: ${id}`);
  };

  const handleExport = () => {
    // Export logs as CSV
    const csvData = logs.map((log) => ({
      id: log.id,
      timestamp: log.timestamp,
      level: log.level,
      type: log.type,
      message: log.message,
      user: log.user,
      ip: log.ip,
      details: log.details,
    }));
    const csv = [
      Object.keys(csvData[0]).join(","),
      ...csvData.map((row) => Object.values(row).join(",")),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `system-logs-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (!isClient) return null;

  return (
    <DashboardLayout userRole="admin" userName={userEmail}>
      <div className="space-y-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">System Logs</h1>
            <p className="text-muted-foreground">
              Monitor system activity, security events, and audit trails
            </p>
          </div>
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export Logs
          </Button>
        </div>

        <Card className="shadow-soft">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Log Entries</CardTitle>
              <div className="flex gap-2">
                <Input
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-56"
                />
                <Select value={filterLevel} onValueChange={setFilterLevel}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="All Levels" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="user_activity">User Activity</SelectItem>
                    <SelectItem value="security">Security</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                    <SelectItem value="audit">Audit</SelectItem>
                    <SelectItem value="blockchain">Blockchain</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <CardDescription>
              Click on a log entry to view more details
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredLogs.length > 0 ? (
              <div className="space-y-4">
                {filteredLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {getLevelIcon(log.level)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium">{log.message}</p>
                          {getLevelBadge(log.level)}
                          {getTypeBadge(log.type)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {log.details}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          User: {log.user} | IP: {log.ip} | {log.timestamp}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewDetails(log.id)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <FileText className="mx-auto mb-2 h-8 w-8" />
                No logs found matching the current filters.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
