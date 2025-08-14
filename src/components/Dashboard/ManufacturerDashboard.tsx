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
  Package,
  QrCode,
  Upload,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Database,
  Loader2,
  RefreshCw,
} from "lucide-react";

export default function ManufacturerDashboard() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<{
    batches: Array<{
      id: string;
      drug: string;
      quantity: number;
      status: string;
      qrGenerated: boolean;
      verifications: number;
    }>;
    stats: {
      totalBatches: number;
      activeBatches: number;
      totalQRCodes: number;
      verifications: number;
      authenticityRate: number;
    };
  }>({
    batches: [],
    stats: {
      totalBatches: 0,
      activeBatches: 0,
      totalQRCodes: 0,
      verifications: 0,
      authenticityRate: 0,
    },
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        const userEmail = localStorage.getItem("userEmail");
        if (!userEmail) {
          setError("User email not found");
          setLoading(false);
          return;
        }
        setUserEmail(userEmail);

        const response = await fetch(
          `/api/manufacturer/dashboard?userEmail=${encodeURIComponent(
            userEmail
          )}`
        );
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setDashboardData(data);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch dashboard data"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const { batches, stats } = dashboardData;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
      case "completed":
        return (
          <Badge className="bg-success text-success-foreground">Active</Badge>
        );
      case "pending":
      case "validating":
      case "uploading":
        return (
          <Badge className="bg-warning text-warning-foreground">Pending</Badge>
        );
      case "expired":
      case "failed":
        return (
          <Badge className="bg-danger text-danger-foreground">Failed</Badge>
        );
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              Manufacturer Dashboard
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Manage drug batches, generate QR codes, and monitor verification
              analytics
            </p>
          </div>
          <Button
            variant="hero"
            size="touch"
            className="w-full sm:w-auto"
            onClick={() => router.push("/manufacturer/upload")}
          >
            <Upload className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
            <span className="hidden sm:inline">Upload New Batch</span>
            <span className="sm:hidden">Upload Batch</span>
          </Button>
        </div>

        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading dashboard data...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              Manufacturer Dashboard
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Manage drug batches, generate QR codes, and monitor verification
              analytics
            </p>
          </div>
          <Button
            variant="hero"
            size="touch"
            className="w-full sm:w-auto"
            onClick={() => router.push("/manufacturer/upload")}
          >
            <Upload className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
            <span className="hidden sm:inline">Upload New Batch</span>
            <span className="sm:hidden">Upload Batch</span>
          </Button>
        </div>

        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-medium">Error loading dashboard data</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">{error}</p>
            <Button
              variant="outline"
              size="touch"
              className="mt-4"
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Manufacturer Dashboard
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Manage drug batches, generate QR codes, and monitor verification
            analytics
          </p>
        </div>
        <Button
          variant="hero"
          size="touch"
          className="w-full sm:w-auto"
          onClick={() => router.push("/manufacturer/upload")}
        >
          <Upload className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
          <span className="hidden sm:inline">Upload New Batch</span>
          <span className="sm:hidden">Upload Batch</span>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
        <Card className="shadow-soft hover:shadow-medium transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Batches</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBatches}</div>
            <p className="text-xs text-muted-foreground">Total uploaded</p>
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
            <p className="text-xs text-muted-foreground">Currently in market</p>
          </CardContent>
        </Card>

        <Card className="shadow-soft hover:shadow-medium transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">QR Codes</CardTitle>
            <QrCode className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalQRCodes >= 1000000
                ? (stats.totalQRCodes / 1000000).toFixed(1) + "M"
                : stats.totalQRCodes >= 1000
                ? (stats.totalQRCodes / 1000).toFixed(1) + "K"
                : stats.totalQRCodes.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Generated total</p>
          </CardContent>
        </Card>

        <Card className="shadow-soft hover:shadow-medium transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verifications</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.verifications.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Total verifications</p>
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
            <p className="text-xs text-muted-foreground">Authenticity rate</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Recent Batches */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Recent Batches
            </CardTitle>
            <CardDescription>Latest drug batch uploads</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {batches.length > 0 ? (
                batches.map((batch) => (
                  <div
                    key={batch.id}
                    className="p-4 border border-border rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-medium">{batch.drug}</p>
                        <p className="text-sm text-muted-foreground">
                          Batch ID: {batch.id}
                        </p>
                      </div>
                      {getStatusBadge(batch.status)}
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
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
                    </div>

                    <div className="flex items-center gap-2 mt-3">
                      {batch.qrGenerated ? (
                        <Badge variant="outline" className="text-xs">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          QR Generated
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          <Clock className="w-3 h-3 mr-1" />
                          Pending QR
                        </Badge>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-2">
                    No batches uploaded yet
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Upload your first drug batch to get started
                  </p>
                </div>
              )}
            </div>
            <Button
              variant="outline"
              size="touch"
              className="w-full mt-4"
              onClick={() => router.push("/manufacturer/batches")}
            >
              View All Batches
            </Button>
          </CardContent>
        </Card>

        {/* Blockchain Status */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Blockchain Status
            </CardTitle>
            <CardDescription>
              Network health and transaction status
            </CardDescription>
          </CardHeader>
          <CardContent>
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
                  <span>Connected Network</span>
                  <span className="font-medium">Avalanche C-Chain</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Contract Status</span>
                  <span className="font-medium text-success">Deployed</span>
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Total Batches</p>
                    <p className="font-medium">{stats.totalBatches}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">QR Codes</p>
                    <p className="font-medium">
                      {stats.totalQRCodes.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common manufacturing tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <Button
              variant="default"
              size="touch"
              className="h-20 flex-col"
              onClick={() => router.push("/manufacturer/upload")}
            >
              <Upload className="h-6 w-6 mb-2" />
              Upload Batch
            </Button>
            <Button
              variant="secondary"
              size="touch"
              className="h-20 flex-col"
              onClick={() => router.push("/manufacturer/qr-codes")}
            >
              <QrCode className="h-6 w-6 mb-2" />
              Generate QR Codes
            </Button>
            <Button
              variant="outline"
              size="touch"
              className="h-20 flex-col"
              onClick={() => router.push("/manufacturer/analytics")}
            >
              <BarChart3 className="h-6 w-6 mb-2" />
              View Analytics
            </Button>
            <Button
              variant="outline"
              size="touch"
              className="h-20 flex-col"
              onClick={() => router.push("/manufacturer/batches")}
            >
              <Database className="h-6 w-6 mb-2" />
              Batch Management
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
