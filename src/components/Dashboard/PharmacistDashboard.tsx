import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  ScanLine, 
  Package, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Calendar,
  TrendingUp,
  Shield,
  Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function PharmacistDashboard() {
  const router = useRouter();
  const { toast } = useToast();
  const [userEmail, setUserEmail] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [recentScans, setRecentScans] = useState<any[]>([]);
  const [inventoryAlerts, setInventoryAlerts] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalScans: 0,
    authenticDrugs: 0,
    suspiciousDrugs: 0,
    counterfeitDrugs: 0,
    inventoryItems: 0,
    authenticityRate: 0,
    scanRate: 0,
    totalReports: 0
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const email = localStorage.getItem("userEmail");
      if (email) {
        setUserEmail(email);
        fetchDashboardData(email);
      }
    }
  }, []);

  // Listen for storage events to refresh data when scans are completed
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'dashboardRefresh' && e.newValue) {
        if (userEmail) {
          fetchDashboardData(userEmail);
        }
        // Clear the refresh trigger
        localStorage.removeItem('dashboardRefresh');
      }
    };

    // Listen for custom refresh events
    const handleRefreshEvent = () => {
      if (userEmail) {
        fetchDashboardData(userEmail, true);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('dashboardRefresh', handleRefreshEvent);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('dashboardRefresh', handleRefreshEvent);
    };
  }, [userEmail]);

  // Periodic refresh to ensure data stays current
  useEffect(() => {
    if (!userEmail) return;

    const interval = setInterval(() => {
      fetchDashboardData(userEmail, true);
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [userEmail]);

  const fetchDashboardData = async (email: string, isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      
      const response = await fetch('/api/pharmacist/dashboard', {
        headers: {
          'x-user-role': 'pharmacist',
          'x-user-email': email
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setStats(data.stats);
        setRecentScans(data.recentVerifications);
        setInventoryAlerts(data.inventoryAlerts);
      } else {
        throw new Error(data.error || 'Failed to fetch dashboard data');
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      toast({
        title: "Error",
        description: "Failed to load dashboard data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleQuickScan = () => {
    router.push("/pharmacist/scan");
  };

  const handleViewAllScans = () => {
    router.push("/pharmacist/history");
  };

  const handleManageInventory = () => {
    router.push("/pharmacist/inventory");
  };

  const handleVerifyDrug = () => {
    router.push("/pharmacist/scan");
  };

  const handleAddToInventory = () => {
    router.push("/pharmacist/inventory");
  };

  const handleReportCounterfeit = () => {
    router.push("/pharmacist/reports");
  };

  const handleRefresh = () => {
    if (userEmail) {
      fetchDashboardData(userEmail, true);
    }
  };

  const getResultBadge = (result: string) => {
    switch (result) {
      case 'authentic':
        return <Badge variant="default" className="bg-success text-success-foreground">Authentic</Badge>;
      case 'suspicious':
        return <Badge variant="default" className="bg-warning text-warning-foreground">Suspicious</Badge>;
      case 'counterfeit':
        return <Badge variant="default" className="bg-danger text-danger-foreground">Counterfeit</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin" />
          <p className="text-muted-foreground">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="mx-auto mb-4 h-8 w-8 text-warning" />
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={handleRefresh} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Pharmacist Dashboard</h1>
          <p className="text-muted-foreground">Manage your pharmacy inventory and verify drug authenticity</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={loading || refreshing}
          >
            {loading || refreshing ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <TrendingUp className="h-4 w-4 mr-2" />
            )}
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button variant="scan" size="touch" className="shadow-glow" onClick={handleQuickScan}>
            <ScanLine className="mr-2 h-5 w-5" />
            Quick Scan
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-soft hover:shadow-medium transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Scans</CardTitle>
            <ScanLine className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalScans.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalScans > 0 ? `${stats.authenticityRate}% authentic` : 'No scans yet'}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-soft hover:shadow-medium transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Authentic Drugs</CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{stats.authenticDrugs}</div>
            <p className="text-xs text-muted-foreground">
              {stats.authenticDrugs > 0 ? 'Verified authentic' : 'No authentic drugs yet'}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-soft hover:shadow-medium transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suspicious</CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{stats.suspiciousDrugs}</div>
            <p className="text-xs text-muted-foreground">
              {stats.suspiciousDrugs > 0 ? 'Requires investigation' : 'No suspicious drugs'}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-soft hover:shadow-medium transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inventory Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inventoryItems}</div>
            <p className="text-xs text-muted-foreground">
              {stats.inventoryItems > 0 ? `${stats.scanRate}% scanned` : 'No inventory items yet'}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Scans */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Recent Verifications
            </CardTitle>
            <CardDescription>
              Latest drug authenticity checks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentScans.length > 0 ? (
                recentScans.map((scan) => (
                  <div key={scan.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Package className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{scan.drugName}</p>
                        <p className="text-sm text-muted-foreground">Batch: {scan.batchId}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      {getResultBadge(scan.result)}
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(scan.time).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Shield className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                  <p className="text-muted-foreground">No recent verifications</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Start scanning drugs to see verification history.
                  </p>
                </div>
              )}
            </div>
            <Button variant="outline" size="touch" className="w-full mt-4" onClick={handleViewAllScans}>
              View All Scans
            </Button>
          </CardContent>
        </Card>

        {/* Inventory Alerts */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Inventory Alerts
            </CardTitle>
            <CardDescription>
              Items requiring attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {inventoryAlerts.length > 0 ? (
                inventoryAlerts.map((alert, index) => (
                  <div key={index} className="p-3 border border-warning/20 bg-warning-light rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{alert.drug}</p>
                        <p className="text-sm text-muted-foreground">
                          {alert.status === 'expiring' 
                            ? `Expires in ${alert.days} days` 
                            : alert.status === 'low-stock'
                            ? 'Low stock level'
                            : 'Requires attention'
                          }
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{alert.quantity} units</p>
                        <Badge variant="outline" className="text-xs">
                          {alert.status === 'expiring' ? 'Expiring Soon' : 
                           alert.status === 'low-stock' ? 'Low Stock' : 'Alert'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="mx-auto mb-2 h-8 w-8 text-success" />
                  <p className="text-muted-foreground">No inventory alerts</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    All inventory items are in good condition.
                  </p>
                </div>
              )}
            </div>
            <Button variant="outline" size="touch" className="w-full mt-4" onClick={handleManageInventory}>
              Manage Inventory
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common tasks for pharmacists
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <Button 
              variant="default" 
              size="touch" 
              className="h-20 flex-col"
              onClick={handleVerifyDrug}
            >
              <ScanLine className="h-6 w-6 mb-2" />
              Verify Drug
            </Button>
            <Button 
              variant="secondary" 
              size="touch" 
              className="h-20 flex-col"
              onClick={handleAddToInventory}
            >
              <Package className="h-6 w-6 mb-2" />
              Add to Inventory
            </Button>
            <Button 
              variant="outline" 
              size="touch" 
              className="h-20 flex-col"
              onClick={handleReportCounterfeit}
            >
              <AlertTriangle className="h-6 w-6 mb-2" />
              Report Counterfeit
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}