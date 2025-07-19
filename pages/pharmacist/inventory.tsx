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
  ScanLine,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Database,
  BarChart3,
  Eye,
  Edit,
  Download,
  Trash2,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Calendar,
  Hash,
  Globe,
  Activity,
  Settings,
  FileText,
  Upload,
  QrCode,
  Shield,
  Users,
  Target,
  Award,
  Zap,
} from "lucide-react";

export default function PharmacistInventoryPage() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string>("");
  const [isClient, setIsClient] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showAddItem, setShowAddItem] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    setIsClient(true);

    if (typeof window !== "undefined") {
      const role = localStorage.getItem("userRole");
      const email = localStorage.getItem("userEmail");

      if (role !== "pharmacist") {
        router.push("/login");
        return;
      }

      if (email) {
        setUserEmail(email);
      }
    }
  }, [router]);

  const inventoryItems = [
    {
      id: "INV001",
      drugName: "Coartem",
      genericName: "Artemether/Lumefantrine",
      category: "Antimalarial",
      quantity: 150,
      unit: "tablets",
      expiryDate: "2025-06-15",
      batchId: "CT2024001",
      manufacturer: "Novartis",
      supplier: "MedPlus Nigeria",
      purchaseDate: "2024-01-15",
      purchasePrice: 2500,
      sellingPrice: 3200,
      status: "active",
      verificationStatus: "verified",
      lastVerified: "2024-01-20",
      verificationCount: 45,
      location: "Shelf A1",
      reorderLevel: 20,
      minStock: 10,
    },
    {
      id: "INV002",
      drugName: "Amoxil",
      genericName: "Amoxicillin",
      category: "Antibiotic",
      quantity: 85,
      unit: "capsules",
      expiryDate: "2025-03-20",
      batchId: "AX2024002",
      manufacturer: "GlaxoSmithKline",
      supplier: "PharmAccess",
      purchaseDate: "2024-01-10",
      purchasePrice: 1800,
      sellingPrice: 2400,
      status: "active",
      verificationStatus: "verified",
      lastVerified: "2024-01-18",
      verificationCount: 32,
      location: "Shelf B2",
      reorderLevel: 15,
      minStock: 8,
    },
    {
      id: "INV003",
      drugName: "Panadol",
      genericName: "Paracetamol",
      category: "Analgesic",
      quantity: 300,
      unit: "tablets",
      expiryDate: "2026-01-10",
      batchId: "PD2024003",
      manufacturer: "GSK Consumer",
      supplier: "HealthPlus",
      purchaseDate: "2024-01-05",
      purchasePrice: 1200,
      sellingPrice: 1800,
      status: "active",
      verificationStatus: "pending",
      lastVerified: "2024-01-12",
      verificationCount: 28,
      location: "Shelf C1",
      reorderLevel: 50,
      minStock: 25,
    },
    {
      id: "INV004",
      drugName: "Augmentin",
      genericName: "Amoxicillin/Clavulanic Acid",
      category: "Antibiotic",
      quantity: 8,
      unit: "tablets",
      expiryDate: "2024-12-05",
      batchId: "AG2024004",
      manufacturer: "GlaxoSmithKline",
      supplier: "MedPlus Nigeria",
      purchaseDate: "2023-12-01",
      purchasePrice: 3500,
      sellingPrice: 4500,
      status: "low-stock",
      verificationStatus: "verified",
      lastVerified: "2024-01-15",
      verificationCount: 15,
      location: "Shelf B3",
      reorderLevel: 20,
      minStock: 10,
    },
    {
      id: "INV005",
      drugName: "Aspirin",
      genericName: "Acetylsalicylic Acid",
      category: "Analgesic",
      quantity: 200,
      unit: "tablets",
      expiryDate: "2025-08-20",
      batchId: "AS2024005",
      manufacturer: "Bayer",
      supplier: "PharmAccess",
      purchaseDate: "2024-01-08",
      purchasePrice: 800,
      sellingPrice: 1200,
      status: "active",
      verificationStatus: "verified",
      lastVerified: "2024-01-19",
      verificationCount: 38,
      location: "Shelf A2",
      reorderLevel: 30,
      minStock: 15,
    },
    {
      id: "INV006",
      drugName: "Malarone",
      genericName: "Atovaquone/Proguanil",
      category: "Antimalarial",
      quantity: 0,
      unit: "tablets",
      expiryDate: "2024-11-15",
      batchId: "ML2024006",
      manufacturer: "GlaxoSmithKline",
      supplier: "HealthPlus",
      purchaseDate: "2023-11-01",
      purchasePrice: 4200,
      sellingPrice: 5500,
      status: "out-of-stock",
      verificationStatus: "verified",
      lastVerified: "2024-01-10",
      verificationCount: 22,
      location: "Shelf A3",
      reorderLevel: 25,
      minStock: 12,
    },
  ];

  const stats = {
    totalItems: 856,
    activeItems: 789,
    lowStockItems: 45,
    outOfStockItems: 22,
    expiringItems: 18,
    verifiedItems: 812,
    pendingVerification: 44,
    totalValue: 2847000,
    monthlySales: 456000,
    verificationRate: 94.8,
  };

  const categories = [
    "Antimalarial",
    "Antibiotic",
    "Analgesic",
    "Antihypertensive",
    "Antidiabetic",
    "Vitamins",
    "Supplements",
    "Other",
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-success text-success-foreground">Active</Badge>
        );
      case "low-stock":
        return (
          <Badge className="bg-warning text-warning-foreground">
            Low Stock
          </Badge>
        );
      case "out-of-stock":
        return (
          <Badge className="bg-danger text-danger-foreground">
            Out of Stock
          </Badge>
        );
      case "expiring":
        return (
          <Badge className="bg-warning text-warning-foreground">
            Expiring Soon
          </Badge>
        );
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getVerificationBadge = (status: string) => {
    switch (status) {
      case "verified":
        return (
          <Badge className="bg-success text-success-foreground text-xs">
            Verified
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-warning text-warning-foreground text-xs">
            Pending
          </Badge>
        );
      case "failed":
        return (
          <Badge className="bg-danger text-danger-foreground text-xs">
            Failed
          </Badge>
        );
      default:
        return (
          <Badge className="bg-muted text-muted-foreground text-xs">
            Unknown
          </Badge>
        );
    }
  };

  const getStockLevel = (quantity: number, minStock: number) => {
    const percentage = (quantity / minStock) * 100;
    if (quantity === 0) return 0;
    if (quantity <= minStock) return 25;
    if (percentage <= 50) return 50;
    if (percentage <= 75) return 75;
    return 100;
  };

  const getStockColor = (quantity: number, minStock: number) => {
    if (quantity === 0) return "bg-danger";
    if (quantity <= minStock) return "bg-warning";
    return "bg-success";
  };

  const handleAddItem = () => {
    setShowAddItem(true);
    // In a real app, this would open add item modal
    console.log("Opening add inventory item modal...");
  };

  const handleViewAnalytics = () => {
    setShowAnalytics(true);
    router.push("/pharmacist/analytics");
  };

  const handleInventorySettings = () => {
    setShowSettings(true);
    // In a real app, this would open inventory settings
    console.log("Opening inventory settings...");
  };

  const handleViewDetails = (itemId: string) => {
    // Navigate to item details page
    router.push(`/pharmacist/inventory/${itemId}`);
  };

  const handleEditItem = (itemId: string) => {
    // In a real app, this would open edit modal
    console.log(`Editing inventory item ${itemId}...`);
  };

  const handleExportInventory = () => {
    // Export inventory data as CSV
    const csvData = inventoryItems.map((item) => ({
      id: item.id,
      drugName: item.drugName,
      genericName: item.genericName,
      category: item.category,
      quantity: item.quantity,
      unit: item.unit,
      expiryDate: item.expiryDate,
      batchId: item.batchId,
      manufacturer: item.manufacturer,
      status: item.status,
      verificationStatus: item.verificationStatus,
      location: item.location,
    }));

    const csv = [
      Object.keys(csvData[0]).join(","),
      ...csvData.map((row) => Object.values(row).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `inventory-export-${
      new Date().toISOString().split("T")[0]
    }.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleScanItem = (itemId: string) => {
    // In a real app, this would open QR scanner
    console.log(`Scanning inventory item ${itemId}...`);
  };

  const handleDeleteItem = (itemId: string) => {
    // In a real app, this would show confirmation dialog
    console.log(`Deleting inventory item ${itemId}...`);
  };

  const uniqueCategories = Array.from(
    new Set(inventoryItems.map((item) => item.category))
  );

  if (!isClient) {
    return null;
  }

  return (
    <DashboardLayout userRole="pharmacist" userName={userEmail}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Inventory Management
            </h1>
            <p className="text-muted-foreground">
              Track, verify, and manage pharmacy inventory with blockchain
              authentication
            </p>
          </div>
          <Button variant="hero" size="xl" onClick={handleAddItem}>
            <Plus className="mr-2 h-5 w-5" />
            Add Item
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="shadow-soft hover:shadow-medium transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Items</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.totalItems.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">+23 this month</p>
            </CardContent>
          </Card>

          <Card className="shadow-soft hover:shadow-medium transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Items
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">
                {stats.activeItems}
              </div>
              <p className="text-xs text-muted-foreground">In stock</p>
            </CardContent>
          </Card>

          <Card className="shadow-soft hover:shadow-medium transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
              <AlertTriangle className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">
                {stats.lowStockItems}
              </div>
              <p className="text-xs text-muted-foreground">Needs attention</p>
            </CardContent>
          </Card>

          <Card className="shadow-soft hover:shadow-medium transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Verified Items
              </CardTitle>
              <Shield className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">
                {stats.verifiedItems}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.verificationRate}% rate
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-soft hover:shadow-medium transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₦{(stats.totalValue / 1000000).toFixed(1)}M
              </div>
              <p className="text-xs text-muted-foreground">Inventory worth</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Inventory Management</CardTitle>
            <CardDescription>
              Search, filter, and manage inventory items
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Label htmlFor="search">Search Items</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search by drug name, batch ID, or manufacturer..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="w-full md:w-48">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={filterCategory}
                  onValueChange={setFilterCategory}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {uniqueCategories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="w-full md:w-48">
                <Label htmlFor="status">Status</Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="low-stock">Low Stock</SelectItem>
                    <SelectItem value="out-of-stock">Out of Stock</SelectItem>
                    <SelectItem value="expiring">Expiring Soon</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              {inventoryItems
                .filter(
                  (item) =>
                    (filterCategory === "all" ||
                      item.category === filterCategory) &&
                    (filterStatus === "all" || item.status === filterStatus) &&
                    (item.drugName
                      .toLowerCase()
                      .includes(searchTerm.toLowerCase()) ||
                      item.batchId
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase()) ||
                      item.manufacturer
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase()))
                )
                .map((item) => (
                  <div
                    key={item.id}
                    className="p-4 border border-border rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-medium">{item.drugName}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.genericName} | Batch: {item.batchId}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(item.status)}
                        {getVerificationBadge(item.verificationStatus)}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                      <div>
                        <p className="text-muted-foreground">Quantity</p>
                        <p className="font-medium">
                          {item.quantity} {item.unit}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Location</p>
                        <p className="font-medium">{item.location}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Expires</p>
                        <p className="font-medium">{item.expiryDate}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Verifications</p>
                        <p className="font-medium">{item.verificationCount}</p>
                      </div>
                    </div>

                    <div className="space-y-2 mb-3">
                      <div className="flex justify-between text-sm">
                        <span>Stock Level</span>
                        <span className="font-medium">
                          {getStockLevel(item.quantity, item.minStock)}%
                        </span>
                      </div>
                      <Progress
                        value={getStockLevel(item.quantity, item.minStock)}
                        className={`h-2 ${getStockColor(
                          item.quantity,
                          item.minStock
                        )}`}
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(item.id)}
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        View Details
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditItem(item.id)}
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleScanItem(item.id)}
                      >
                        <ScanLine className="w-3 h-3 mr-1" />
                        Scan
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleExportInventory()}
                      >
                        <Download className="w-3 h-3 mr-1" />
                        Export
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-danger hover:text-danger"
                        onClick={() => handleDeleteItem(item.id)}
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

        {/* Blockchain Integration Status */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Blockchain Integration Status
            </CardTitle>
            <CardDescription>
              Inventory verification blockchain transaction monitoring
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
                    <span>Verification Success Rate</span>
                    <span className="font-medium">94.8%</span>
                  </div>
                  <Progress value={94.8} className="h-2" />
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
                <h4 className="font-medium">Recent Verifications</h4>
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
                    <p className="text-muted-foreground">Daily Verifications</p>
                    <p className="font-medium">156</p>
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
            <CardDescription>Common inventory management tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Button
                variant="default"
                size="lg"
                className="h-20 flex-col"
                onClick={handleAddItem}
              >
                <Plus className="h-6 w-6 mb-2" />
                Add Item
              </Button>
              <Button
                variant="secondary"
                size="lg"
                className="h-20 flex-col"
                onClick={handleExportInventory}
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
                onClick={handleInventorySettings}
              >
                <Settings className="h-6 w-6 mb-2" />
                Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
