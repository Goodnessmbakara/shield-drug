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
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalLogs: 0,
    hasNextPage: false,
    hasPrevPage: false
  });
  const [stats, setStats] = useState<any>(null);

  const fetchLogs = async () => {
    if (!userEmail) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        page: pagination.currentPage.toString(),
        limit: '50',
        level: filterLevel,
        category: filterType,
        search: searchTerm
      });

      const response = await fetch(`/api/admin/logs?${params}`, {
        headers: {
          'x-user-role': 'admin',
          'x-user-email': userEmail
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch logs');
      }

      const data = await response.json();
      setLogs(data.logs);
      setPagination(data.pagination);
      setStats(data.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch logs');
      console.error('Error fetching logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

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

  useEffect(() => {
    if (userEmail) {
      fetchLogs();
    }
  }, [userEmail, pagination.currentPage, filterLevel, filterType, searchTerm]);

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
  };

  const getLevelIcon = (level: string) => {
    switch (level.toLowerCase()) {
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />;
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const getLevelBadge = (level: string) => {
    switch (level.toLowerCase()) {
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      case 'warning':
        return <Badge variant="secondary">Warning</Badge>;
      case 'info':
        return <Badge variant="default">Info</Badge>;
      default:
        return <Badge variant="outline">{level}</Badge>;
    }
  };






  const handleViewDetails = (id: string) => {
    // In a real app, show detailed log information
    alert(`View details for log ID: ${id}`);
  };

  const handleExport = () => {
    // Export logs as CSV
    const csvData = logs.map((log) => ({
      id: log.id,
      timestamp: new Date(log.timestamp).toLocaleString(),
      level: log.level,
      category: log.category,
      action: log.action,
      description: log.description,
      userEmail: log.userEmail || 'System',
      ipAddress: log.ipAddress || 'N/A',
      endpoint: log.endpoint || 'N/A',
      method: log.method || 'N/A',
      statusCode: log.statusCode || 'N/A',
      responseTime: log.responseTime || 'N/A'
    }));
    
    if (csvData.length === 0) {
      alert('No logs to export');
      return;
    }
    
    const csv = [
      Object.keys(csvData[0]).join(","),
      ...csvData.map((row) => Object.values(row).map(value => `"${value}"`).join(",")),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split("T")[0]}.csv`;
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
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-56"
                />
                <Button onClick={handleSearch} variant="outline">
                  <Search className="h-4 w-4" />
                </Button>
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
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="API_CALL">API Calls</SelectItem>
                    <SelectItem value="USER_ACTION">User Actions</SelectItem>
                    <SelectItem value="SYSTEM_EVENT">System Events</SelectItem>
                    <SelectItem value="SECURITY">Security</SelectItem>
                    <SelectItem value="BLOCKCHAIN">Blockchain</SelectItem>
                    <SelectItem value="DATABASE">Database</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <CardDescription>
              Click on a log entry to view more details
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center text-muted-foreground py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                Loading logs...
              </div>
            ) : error ? (
              <div className="text-center text-red-500 py-8">
                <AlertTriangle className="mx-auto mb-2 h-8 w-8" />
                <p className="font-medium">Error loading logs</p>
                <p className="text-sm">{error}</p>
                <Button 
                  variant="outline" 
                  className="mt-2"
                  onClick={fetchLogs}
                >
                  Try Again
                </Button>
              </div>
            ) : logs.length > 0 ? (
              <div className="space-y-4">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {getLevelIcon(log.level)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium">{log.action}</p>
                          {getLevelBadge(log.level)}
                          <Badge variant="outline">{log.category}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {log.description}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          User: {log.userEmail || 'System'} | IP: {log.ipAddress || 'N/A'} | {new Date(log.timestamp).toLocaleString()}
                        </p>
                        {log.endpoint && (
                          <p className="text-xs text-muted-foreground">
                            {log.method} {log.endpoint} | Status: {log.statusCode} | Time: {log.responseTime}ms
                          </p>
                        )}
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
                
                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between pt-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      Showing {((pagination.currentPage - 1) * 50) + 1} to {Math.min(pagination.currentPage * 50, pagination.totalLogs)} of {pagination.totalLogs} logs
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!pagination.hasPrevPage}
                        onClick={() => handlePageChange(pagination.currentPage - 1)}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!pagination.hasNextPage}
                        onClick={() => handlePageChange(pagination.currentPage + 1)}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
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

