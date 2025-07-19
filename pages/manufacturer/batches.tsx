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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Package,
  Upload,
  Search,
  Filter,
  BarChart3,
  TrendingUp,
  CheckCircle,
  Clock,
  AlertTriangle,
  Database,
  Eye,
  Edit,
  Trash2,
  Download,
  Calendar,
  Hash,
  Globe,
  Activity,
  Users,
  FileText,
} from "lucide-react";

export default function BatchesPage() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string>("");
  const [isClient, setIsClient] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterDrug, setFilterDrug] = useState("all");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showReports, setShowReports] = useState(false);

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

  const batches = [
    {
      id: "CT2024001",
      drug: "Coartem",
      quantity: 10000,
      status: "active",
      qrGenerated: true,
      verifications: 1250,
      dateCreated: "2024-01-15",
      expiryDate: "2026-01-15",
      manufacturer: "Novartis",
      location: "Lagos, Nigeria",
      compliance: "NAFDAC Approved",
    },
    {
      id: "AX2024002",
      drug: "Amoxil",
      quantity: 5000,
      status: "pending",
      qrGenerated: false,
      verifications: 0,
      dateCreated: "2024-01-20",
      expiryDate: "2025-12-20",
      manufacturer: "GlaxoSmithKline",
      location: "Abuja, Nigeria",
      compliance: "Pending Approval",
    },
    {
      id: "PD2024003",
      drug: "Panadol",
      quantity: 15000,
      status: "active",
      qrGenerated: true,
      verifications: 3420,
      dateCreated: "2024-01-25",
      expiryDate: "2026-06-25",
      manufacturer: "GSK Consumer",
      location: "Port Harcourt, Nigeria",
      compliance: "NAFDAC Approved",
    },
    {
      id: "AP2024004",
      drug: "Aspirin",
      quantity: 8000,
      status: "expired",
      qrGenerated: true,
      verifications: 2100,
      dateCreated: "2023-06-15",
      expiryDate: "2024-01-15",
      manufacturer: "Bayer",
      location: "Kano, Nigeria",
      compliance: "NAFDAC Approved",
    },
    {
      id: "MP2024005",
      drug: "Malarone",
      quantity: 3000,
      status: "active",
      qrGenerated: true,
      verifications: 890,
      dateCreated: "2024-02-01",
      expiryDate: "2027-02-01",
      manufacturer: "GlaxoSmithKline",
      location: "Ibadan, Nigeria",
      compliance: "NAFDAC Approved",
    },
  ];

  const stats = {
    totalBatches: 247,
    activeBatches: 156,
    pendingBatches: 45,
    expiredBatches: 46,
    totalQRCodes: 2890000,
    verifications: 145670,
    authenticityRate: 98.7,
    complianceRate: 94.2,
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-success text-success-foreground">Active</Badge>
        );
      case "pending":
        return (
          <Badge className="bg-warning text-warning-foreground">Pending</Badge>
        );
      case "expired":
        return (
          <Badge className="bg-danger text-danger-foreground">Expired</Badge>
        );
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getComplianceBadge = (compliance: string) => {
    if (compliance.includes("Approved")) {
      return (
        <Badge className="bg-success text-success-foreground text-xs">
          Approved
        </Badge>
      );
    } else if (compliance.includes("Pending")) {
      return (
        <Badge className="bg-warning text-warning-foreground text-xs">
          Pending
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-muted text-muted-foreground text-xs">
          Unknown
        </Badge>
      );
    }
  };

  const uniqueDrugs = Array.from(new Set(batches.map((batch) => batch.drug)));

  const handleUploadBatch = () => {
    setShowUploadModal(true);
    router.push("/manufacturer/upload");
  };

  const handleGenerateQRCodes = () => {
    router.push("/manufacturer/qr-codes");
  };

  const handleViewAnalytics = () => {
    setShowAnalytics(true);
    router.push("/manufacturer/analytics");
  };

  const handleBlockchainQuery = () => {
    // In a real app, this would open blockchain query interface
    console.log("Opening blockchain query interface...");
  };

  const handleViewDetails = (batchId: string) => {
    // Navigate to batch details page
    router.push(`/manufacturer/batches/${batchId}`);
  };

  const handleEditBatch = (batchId: string) => {
    // In a real app, this would open edit modal
    console.log(`Editing batch ${batchId}...`);
  };

  const handleExportBatch = (batchId?: string) => {
    if (batchId) {
      // Export specific batch
      const batch = batches.find((b) => b.id === batchId);
      if (batch) {
        const csvData = [
          {
            id: batch.id,
            drug: batch.drug,
            quantity: batch.quantity,
            status: batch.status,
            verifications: batch.verifications,
            manufacturer: batch.manufacturer,
            location: batch.location,
            compliance: batch.compliance,
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
        a.download = `batch-${batchId}-${
          new Date().toISOString().split("T")[0]
        }.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } else {
      // Export all batches
      const csvData = batches.map((batch) => ({
        id: batch.id,
        drug: batch.drug,
        quantity: batch.quantity,
        status: batch.status,
        verifications: batch.verifications,
        manufacturer: batch.manufacturer,
        location: batch.location,
        compliance: batch.compliance,
      }));

      const csv = [
        Object.keys(csvData[0]).join(","),
        ...csvData.map((row) => Object.values(row).join(",")),
      ].join("\n");

      const blob = new Blob([csv], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `all-batches-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }
  };

  const handleBatchAnalytics = (batchId: string) => {
    router.push(`/manufacturer/analytics?batch=${batchId}`);
  };

  const handleDeleteBatch = (batchId: string) => {
    // In a real app, this would show confirmation dialog
    console.log(`Deleting batch ${batchId}...`);
  };

  if (!isClient) {
    return null;
  }

  return (
    <DashboardLayout userRole="manufacturer" userName={userEmail}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Batch Management
            </h1>
            <p className="text-muted-foreground">
              Upload, track, and manage drug batches with QR code generation
            </p>
          </div>
          <Button variant="hero" size="xl">
            <Upload className="mr-2 h-5 w-5" />
            Upload New Batch
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-8 gap-4">
          <Card className="shadow-soft hover:shadow-medium transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Batches
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalBatches}</div>
              <p className="text-xs text-muted-foreground">+23 this month</p>
            </CardContent>
          </Card>

          <Card className="shadow-soft hover:shadow-medium transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Batches
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">
                {stats.activeBatches}
              </div>
              <p className="text-xs text-muted-foreground">
                Currently in market
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-soft hover:shadow-medium transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">
                {stats.pendingBatches}
              </div>
              <p className="text-xs text-muted-foreground">Awaiting approval</p>
            </CardContent>
          </Card>

          <Card className="shadow-soft hover:shadow-medium transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expired</CardTitle>
              <AlertTriangle className="h-4 w-4 text-danger" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-danger">
                {stats.expiredBatches}
              </div>
              <p className="text-xs text-muted-foreground">
                Requires attention
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-soft hover:shadow-medium transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">QR Codes</CardTitle>
              <Hash className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(stats.totalQRCodes / 1000000).toFixed(1)}M
              </div>
              <p className="text-xs text-muted-foreground">Generated total</p>
            </CardContent>
          </Card>

          <Card className="shadow-soft hover:shadow-medium transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Verifications
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.verifications.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">+8.2% this week</p>
            </CardContent>
          </Card>

          <Card className="shadow-soft hover:shadow-medium transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Authenticity Rate
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">
                {stats.authenticityRate}%
              </div>
              <p className="text-xs text-muted-foreground">
                Above industry average
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-soft hover:shadow-medium transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Compliance Rate
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">
                {stats.complianceRate}%
              </div>
              <p className="text-xs text-muted-foreground">NAFDAC compliant</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Batch Upload */}
          <Card className="shadow-soft lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload New Batch
              </CardTitle>
              <CardDescription>
                Register a new drug batch for QR code generation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="drug">Drug Name</Label>
                <Input id="drug" placeholder="Enter drug name" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">Batch Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  placeholder="Enter quantity"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="manufacturer">Manufacturer</Label>
                <Input id="manufacturer" placeholder="Enter manufacturer" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Production Location</Label>
                <Input id="location" placeholder="Enter location" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expiry">Expiry Date</Label>
                <Input id="expiry" type="date" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="compliance">Compliance Status</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="approved">NAFDAC Approved</SelectItem>
                    <SelectItem value="pending">Pending Approval</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button className="w-full">
                <Upload className="mr-2 h-4 w-4" />
                Upload Batch
              </Button>
            </CardContent>
          </Card>

          {/* Batches List */}
          <Card className="shadow-soft lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Batch Management
                  </CardTitle>
                  <CardDescription>
                    Track and manage all drug batches
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search batches..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterDrug} onValueChange={setFilterDrug}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Drugs</SelectItem>
                      {uniqueDrugs.map((drug) => (
                        <SelectItem key={drug} value={drug}>
                          {drug}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {batches
                  .filter(
                    (batch) =>
                      (filterStatus === "all" ||
                        batch.status === filterStatus) &&
                      (filterDrug === "all" || batch.drug === filterDrug) &&
                      (batch.id
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase()) ||
                        batch.drug
                          .toLowerCase()
                          .includes(searchTerm.toLowerCase()) ||
                        batch.manufacturer
                          .toLowerCase()
                          .includes(searchTerm.toLowerCase()))
                  )
                  .map((batch) => (
                    <div
                      key={batch.id}
                      className="p-4 border border-border rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-medium">{batch.drug}</p>
                          <p className="text-sm text-muted-foreground">
                            Batch ID: {batch.id}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(batch.status)}
                          {getComplianceBadge(batch.compliance)}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                        <div>
                          <p className="text-muted-foreground">Quantity</p>
                          <p className="font-medium">
                            {batch.quantity.toLocaleString()} units
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Verifications</p>
                          <p className="font-medium">
                            {batch.verifications.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Manufacturer</p>
                          <p className="font-medium">{batch.manufacturer}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Location</p>
                          <p className="font-medium">{batch.location}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mb-3">
                        <div>
                          <p className="text-muted-foreground">Created</p>
                          <p className="font-medium">{batch.dateCreated}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Expires</p>
                          <p className="font-medium">{batch.expiryDate}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">QR Status</p>
                          <p className="font-medium">
                            {batch.qrGenerated ? (
                              <Badge className="bg-success text-success-foreground text-xs">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Generated
                              </Badge>
                            ) : (
                              <Badge className="bg-warning text-warning-foreground text-xs">
                                <Clock className="w-3 h-3 mr-1" />
                                Pending
                              </Badge>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(batch.id)}
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          View Details
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditBatch(batch.id)}
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleExportBatch(batch.id)}
                        >
                          <Download className="w-3 h-3 mr-1" />
                          Export
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleBatchAnalytics(batch.id)}
                        >
                          <BarChart3 className="w-3 h-3 mr-1" />
                          Analytics
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-danger hover:text-danger"
                          onClick={() => handleDeleteBatch(batch.id)}
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Blockchain Status */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Blockchain Integration Status
            </CardTitle>
            <CardDescription>
              Batch data blockchain transaction monitoring
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Network Status</span>
                  <Badge className="bg-success text-success-foreground">
                    <div className="w-2 h-2 bg-current rounded-full mr-1 animate-pulse"></div>
                    Online
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Transaction Success Rate</span>
                    <span className="font-medium">99.8%</span>
                  </div>
                  <Progress value={99.8} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Data Synchronization</span>
                    <span className="font-medium">100%</span>
                  </div>
                  <Progress value={100} className="h-2" />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Recent Batch Uploads</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>CT2024001</span>
                    <Badge className="bg-success text-success-foreground text-xs">
                      Success
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>AX2024002</span>
                    <Badge className="bg-success text-success-foreground text-xs">
                      Success
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>PD2024003</span>
                    <Badge className="bg-warning text-warning-foreground text-xs">
                      Pending
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Network Stats</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Pending Txns</p>
                    <p className="font-medium">2</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Daily Uploads</p>
                    <p className="font-medium">15</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Block Height</p>
                    <p className="font-medium">45,892,147</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Gas Price</p>
                    <p className="font-medium">25 Gwei</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common batch management tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Button
                variant="default"
                size="lg"
                className="h-20 flex-col"
                onClick={handleUploadBatch}
              >
                <Upload className="h-6 w-6 mb-2" />
                Upload Batch
              </Button>
              <Button
                variant="secondary"
                size="lg"
                className="h-20 flex-col"
                onClick={() => handleExportBatch()}
              >
                <Download className="h-6 w-6 mb-2" />
                Export Data
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="h-20 flex-col"
                onClick={handleViewAnalytics}
              >
                <BarChart3 className="h-6 w-6 mb-2" />
                Analytics
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="h-20 flex-col"
                onClick={() => setShowReports(true)}
              >
                <FileText className="h-6 w-6 mb-2" />
                Reports
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
