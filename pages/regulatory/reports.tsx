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
  AlertTriangle,
  CheckCircle,
  Clock,
  Download,
  Info,
  Shield,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";

interface Report {
  id: string;
  type: string;
  title: string;
  status: string;
  submitted: string;
  location: string;
  reporter: string;
  description: string;
  drugName?: string;
  manufacturer?: string;
  batchNumber?: string;
  evidence?: string[];
  priority?: string;
  assignedTo?: string;
  updatedAt: string;
}

interface ReportsData {
  reports: Report[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalReports: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  statistics: {
    total: number;
    open: number;
    investigating: number;
    resolved: number;
    counterfeit: number;
    quality: number;
    compliance: number;
  };
  recentActivity: number;
}

export default function RegulatoryReportsPage() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string>("");
  const [isClient, setIsClient] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [reportsData, setReportsData] = useState<ReportsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsClient(true);
    if (typeof window !== "undefined") {
      const role = localStorage.getItem("userRole");
      const email = localStorage.getItem("userEmail");
      if (role !== "regulatory") {
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
      fetchReports();
    }
  }, [userEmail, currentPage, searchTerm, filterStatus, filterType]);

  const fetchReports = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        ...(filterStatus !== 'all' && { status: filterStatus }),
        ...(filterType !== 'all' && { type: filterType }),
        ...(searchTerm && { search: searchTerm })
      });

      const response = await fetch(`/api/regulatory/reports?${params}`, {
        headers: {
          'x-user-role': 'regulatory',
          'x-user-email': userEmail
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch reports');
      }

      const data = await response.json();
      setReportsData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch reports');
      console.error('Error fetching reports:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return (
          <Badge className="bg-warning text-warning-foreground">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Open
          </Badge>
        );
      case "investigating":
        return (
          <Badge className="bg-secondary text-secondary-foreground">
            <Clock className="w-3 h-3 mr-1" />
            Investigating
          </Badge>
        );
      case "resolved":
        return (
          <Badge className="bg-success text-success-foreground">
            <CheckCircle className="w-3 h-3 mr-1" />
            Resolved
          </Badge>
        );
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "counterfeit":
        return (
          <Badge className="bg-danger text-danger-foreground">
            Counterfeit
          </Badge>
        );
      case "quality":
        return (
          <Badge className="bg-warning text-warning-foreground">
            Quality Issue
          </Badge>
        );
      case "compliance":
        return (
          <Badge className="bg-primary text-primary-foreground">
            Compliance
          </Badge>
        );
      case "safety":
        return (
          <Badge className="bg-destructive text-destructive-foreground">
            Safety Issue
          </Badge>
        );
      default:
        return <Badge variant="outline">Other</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "critical":
        return <Badge className="bg-destructive text-destructive-foreground">Critical</Badge>;
      case "high":
        return <Badge className="bg-warning text-warning-foreground">High</Badge>;
      case "medium":
        return <Badge className="bg-secondary text-secondary-foreground">Medium</Badge>;
      case "low":
        return <Badge className="bg-muted text-muted-foreground">Low</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const handleViewDetails = (id: string) => {
    // Navigate to report details page
    router.push(`/regulatory/reports/${id}`);
  };

  const handleExport = () => {
    if (!reportsData?.reports) return;
    
    // Export reports as CSV
    const csvData = reportsData.reports.map((report) => ({
      id: report.id,
      type: report.type,
      title: report.title,
      status: report.status,
      submitted: new Date(report.submitted).toLocaleString(),
      location: report.location,
      reporter: report.reporter,
      description: report.description,
      drugName: report.drugName || '',
      manufacturer: report.manufacturer || '',
      batchNumber: report.batchNumber || '',
      priority: report.priority || ''
    }));
    
    const csv = [
      Object.keys(csvData[0]).join(","),
      ...csvData.map((row) => Object.values(row).map(v => `"${v}"`).join(",")),
    ].join("\n");
    
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `regulatory-reports-${
      new Date().toISOString().split("T")[0]
    }.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleStatusFilter = (value: string) => {
    setFilterStatus(value);
    setCurrentPage(1);
  };

  const handleTypeFilter = (value: string) => {
    setFilterType(value);
    setCurrentPage(1);
  };

  if (!isClient) return null;

  return (
    <DashboardLayout userRole="regulatory" userName={userEmail}>
      <div className="space-y-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Reports</h1>
            <p className="text-muted-foreground">
              Live reports from pharmacies and consumers - {reportsData?.statistics.total || 0} total reports
            </p>
          </div>
          <Button variant="outline" onClick={handleExport} disabled={!reportsData?.reports.length}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>

        {/* Statistics Cards */}
        {reportsData && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="shadow-soft">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Reports</p>
                    <p className="text-2xl font-bold">{reportsData.statistics.total}</p>
                  </div>
                  <FileText className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="shadow-soft">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Open</p>
                    <p className="text-2xl font-bold text-warning">{reportsData.statistics.open}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-warning" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="shadow-soft">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Investigating</p>
                    <p className="text-2xl font-bold text-secondary">{reportsData.statistics.investigating}</p>
                  </div>
                  <Clock className="h-8 w-8 text-secondary" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="shadow-soft">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Resolved</p>
                    <p className="text-2xl font-bold text-success">{reportsData.statistics.resolved}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-success" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Card className="shadow-soft">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Reports List</CardTitle>
              <div className="flex gap-2">
                <Input
                  placeholder="Search reports..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-56"
                />
                <Select value={filterType} onValueChange={handleTypeFilter}>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="counterfeit">Counterfeit</SelectItem>
                    <SelectItem value="quality">Quality</SelectItem>
                    <SelectItem value="compliance">Compliance</SelectItem>
                    <SelectItem value="safety">Safety</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={handleStatusFilter}>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="investigating">Investigating</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <CardDescription>
              Click on a report to view more details • {reportsData?.recentActivity || 0} new reports in the last 7 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Loading reports...</span>
              </div>
            ) : error ? (
              <div className="text-center text-red-500 py-8">
                <AlertTriangle className="mx-auto mb-2 h-8 w-8" />
                <p>Error loading reports: {error}</p>
                <Button variant="outline" onClick={fetchReports} className="mt-2">
                  Try Again
                </Button>
              </div>
            ) : reportsData?.reports.length ? (
              <div className="space-y-4">
                {reportsData.reports.map((report) => (
                  <div
                    key={report.id}
                    className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                    onClick={() => handleViewDetails(report.id)}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <FileText className="h-5 w-5 text-primary" />
                      <div className="flex-1">
                        <p className="font-medium">{report.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {report.reporter} &bull; {report.location}
                          {report.drugName && ` &bull; ${report.drugName}`}
                          {report.manufacturer && ` &bull; ${report.manufacturer}`}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {report.description.length > 100 
                            ? `${report.description.substring(0, 100)}...` 
                            : report.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {getTypeBadge(report.type)}
                      {getStatusBadge(report.status)}
                      {report.priority && getPriorityBadge(report.priority)}
                      <p className="text-xs text-muted-foreground ml-2">
                        {new Date(report.submitted).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
                
                {/* Pagination */}
                {reportsData.pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between pt-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      Showing {((reportsData.pagination.currentPage - 1) * 20) + 1} to {Math.min(reportsData.pagination.currentPage * 20, reportsData.pagination.totalReports)} of {reportsData.pagination.totalReports} reports
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={!reportsData.pagination.hasPrevPage}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={!reportsData.pagination.hasNextPage}
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <Info className="mx-auto mb-2 h-8 w-8" />
                No reports found matching your criteria.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
