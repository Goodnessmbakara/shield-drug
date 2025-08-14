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
  Building,
  CheckCircle,
  AlertTriangle,
  Clock,
  Info,
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Users,
  Activity,
} from "lucide-react";

interface Manufacturer {
  id: string;
  name: string;
  email: string;
  status: string;
  registeredDrugs: number;
  successfulUploads: number;
  failedUploads: number;
  totalReports: number;
  openReports: number;
  resolvedReports: number;
  lastAudit: string;
  lastLogin: string;
  location: string;
  contact: string;
  phone: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ManufacturersData {
  manufacturers: Manufacturer[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalManufacturers: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  statistics: {
    total: number;
    active: number;
    inactive: number;
  };
  recentActivity: number;
}

export default function RegulatoryManufacturersPage() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string>("");
  const [isClient, setIsClient] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [manufacturersData, setManufacturersData] = useState<ManufacturersData | null>(null);
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
      fetchManufacturers();
    }
  }, [userEmail, currentPage, searchTerm, filterStatus]);

  const fetchManufacturers = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        ...(filterStatus !== 'all' && { status: filterStatus }),
        ...(searchTerm && { search: searchTerm })
      });

      const response = await fetch(`/api/regulatory/manufacturers?${params}`, {
        headers: {
          'x-user-role': 'regulatory',
          'x-user-email': userEmail
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch manufacturers');
      }

      const data = await response.json();
      setManufacturersData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch manufacturers');
      console.error('Error fetching manufacturers:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "compliant":
        return (
          <Badge className="bg-success text-success-foreground">
            <CheckCircle className="w-3 h-3 mr-1" />
            Compliant
          </Badge>
        );
      case "violation":
        return (
          <Badge className="bg-danger text-danger-foreground">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Violation
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-warning text-warning-foreground">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getActivityBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge className="bg-success text-success-foreground">Active</Badge>
    ) : (
      <Badge className="bg-muted text-muted-foreground">Inactive</Badge>
    );
  };

  const handleViewDetails = (id: string) => {
    // Navigate to manufacturer details page
    router.push(`/regulatory/manufacturers/${id}`);
  };

  const handleExport = () => {
    if (!manufacturersData?.manufacturers) return;
    
    // Export manufacturers as CSV
    const csvData = manufacturersData.manufacturers.map((manufacturer) => ({
      id: manufacturer.id,
      name: manufacturer.name,
      email: manufacturer.email,
      status: manufacturer.status,
      registeredDrugs: manufacturer.registeredDrugs,
      successfulUploads: manufacturer.successfulUploads,
      failedUploads: manufacturer.failedUploads,
      totalReports: manufacturer.totalReports,
      openReports: manufacturer.openReports,
      lastAudit: new Date(manufacturer.lastAudit).toLocaleDateString(),
      lastLogin: new Date(manufacturer.lastLogin).toLocaleDateString(),
      location: manufacturer.location,
      contact: manufacturer.contact,
      phone: manufacturer.phone,
      isActive: manufacturer.isActive ? 'Yes' : 'No'
    }));
    
    const csv = [
      Object.keys(csvData[0]).join(","),
      ...csvData.map((row) => Object.values(row).map(v => `"${v}"`).join(",")),
    ].join("\n");
    
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `manufacturers-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleStatusFilter = (value: string) => {
    setFilterStatus(value);
    setCurrentPage(1);
  };

  if (!isClient) return null;

  return (
    <DashboardLayout userRole="regulatory" userName={userEmail}>
      <div className="space-y-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Manufacturers
            </h1>
            <p className="text-muted-foreground">
              Live manufacturers from the database - {manufacturersData?.statistics.total || 0} total registered
            </p>
          </div>
          <Button variant="outline" onClick={handleExport} disabled={!manufacturersData?.manufacturers.length}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>

        {/* Statistics Cards */}
        {manufacturersData && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="shadow-soft">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Manufacturers</p>
                    <p className="text-2xl font-bold">{manufacturersData.statistics.total}</p>
                  </div>
                  <Building className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="shadow-soft">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Active</p>
                    <p className="text-2xl font-bold text-success">{manufacturersData.statistics.active}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-success" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="shadow-soft">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Inactive</p>
                    <p className="text-2xl font-bold text-muted">{manufacturersData.statistics.inactive}</p>
                  </div>
                  <Clock className="h-8 w-8 text-muted" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="shadow-soft">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Recent Activity</p>
                    <p className="text-2xl font-bold text-secondary">{manufacturersData.recentActivity}</p>
                  </div>
                  <Activity className="h-8 w-8 text-secondary" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Card className="shadow-soft">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Manufacturers List</CardTitle>
              <div className="flex gap-2">
                <Input
                  placeholder="Search manufacturers..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-56"
                />
                <Select value={filterStatus} onValueChange={handleStatusFilter}>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="compliant">Compliant</SelectItem>
                    <SelectItem value="violation">Violation</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <CardDescription>
              Click on a manufacturer to view more details • {manufacturersData?.recentActivity || 0} active in last 30 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Loading manufacturers...</span>
              </div>
            ) : error ? (
              <div className="text-center text-red-500 py-8">
                <AlertTriangle className="mx-auto mb-2 h-8 w-8" />
                <p>Error loading manufacturers: {error}</p>
                <Button variant="outline" onClick={fetchManufacturers} className="mt-2">
                  Try Again
                </Button>
              </div>
            ) : manufacturersData?.manufacturers.length ? (
              <div className="space-y-4">
                {manufacturersData.manufacturers.map((manufacturer) => (
                  <div
                    key={manufacturer.id}
                    className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                    onClick={() => handleViewDetails(manufacturer.id)}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <Building className="h-5 w-5 text-primary" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium">{manufacturer.name}</p>
                          {getActivityBadge(manufacturer.isActive)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {manufacturer.location} &bull; {manufacturer.registeredDrugs} drugs registered
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {manufacturer.contact} &bull; {manufacturer.phone}
                        </p>
                        <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                          <span>Success: {manufacturer.successfulUploads}</span>
                          <span>Failed: {manufacturer.failedUploads}</span>
                          <span>Reports: {manufacturer.totalReports}</span>
                          {manufacturer.openReports > 0 && (
                            <span className="text-warning">Open: {manufacturer.openReports}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {getStatusBadge(manufacturer.status)}
                      <p className="text-xs text-muted-foreground ml-2">
                        Last activity: {new Date(manufacturer.lastLogin).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
                
                {/* Pagination */}
                {manufacturersData.pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between pt-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      Showing {((manufacturersData.pagination.currentPage - 1) * 20) + 1} to {Math.min(manufacturersData.pagination.currentPage * 20, manufacturersData.pagination.totalManufacturers)} of {manufacturersData.pagination.totalManufacturers} manufacturers
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={!manufacturersData.pagination.hasPrevPage}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={!manufacturersData.pagination.hasNextPage}
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
                No manufacturers found matching your criteria.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
