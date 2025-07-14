import { useState } from "react";
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
  Shield
} from "lucide-react";

export default function PharmacistDashboard() {
  const [recentScans] = useState([
    { id: 1, drugName: "Coartem", result: "authentic", time: "2 hours ago", batchId: "CT2024001" },
    { id: 2, drugName: "Amoxil", result: "authentic", time: "4 hours ago", batchId: "AX2024002" },
    { id: 3, drugName: "Panadol", result: "suspicious", time: "1 day ago", batchId: "PD2024003" },
  ]);

  const [inventoryAlerts] = useState([
    { drug: "Coartem", status: "expiring", days: 15, quantity: 50 },
    { drug: "Augmentin", status: "low-stock", days: 0, quantity: 5 },
  ]);

  const stats = {
    totalScans: 1247,
    authenticDrugs: 1185,
    suspiciousDrugs: 42,
    counterfeitDrugs: 20,
    inventoryItems: 856
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

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Pharmacist Dashboard</h1>
          <p className="text-muted-foreground">Manage your pharmacy inventory and verify drug authenticity</p>
        </div>
        <Button variant="scan" size="xl" className="shadow-glow">
          <ScanLine className="mr-2 h-5 w-5" />
          Quick Scan
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-soft hover:shadow-medium transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Scans</CardTitle>
            <ScanLine className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalScans.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
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
              95.1% success rate
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
              Requires investigation
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
              Across all categories
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
              {recentScans.map((scan) => (
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
                    <p className="text-xs text-muted-foreground mt-1">{scan.time}</p>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4">
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
              {inventoryAlerts.map((alert, index) => (
                <div key={index} className="p-3 border border-warning/20 bg-warning-light rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{alert.drug}</p>
                      <p className="text-sm text-muted-foreground">
                        {alert.status === 'expiring' 
                          ? `Expires in ${alert.days} days` 
                          : 'Low stock level'
                        }
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{alert.quantity} units</p>
                      <Badge variant="outline" className="text-xs">
                        {alert.status === 'expiring' ? 'Expiring Soon' : 'Low Stock'}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4">
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="default" size="lg" className="h-20 flex-col">
              <ScanLine className="h-6 w-6 mb-2" />
              Verify Drug
            </Button>
            <Button variant="secondary" size="lg" className="h-20 flex-col">
              <Package className="h-6 w-6 mb-2" />
              Add to Inventory
            </Button>
            <Button variant="outline" size="lg" className="h-20 flex-col">
              <AlertTriangle className="h-6 w-6 mb-2" />
              Report Counterfeit
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}