import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  Database
} from "lucide-react";

export default function ManufacturerDashboard() {
  const [batches] = useState([
    { id: "CT2024001", drug: "Coartem", quantity: 10000, status: "active", qrGenerated: true, verifications: 1250 },
    { id: "AX2024002", drug: "Amoxil", quantity: 5000, status: "pending", qrGenerated: false, verifications: 0 },
    { id: "PD2024003", drug: "Panadol", quantity: 15000, status: "active", qrGenerated: true, verifications: 3420 },
  ]);

  const stats = {
    totalBatches: 247,
    activeBatches: 156,
    totalQRCodes: 2890000,
    verifications: 145670,
    authenticityRate: 98.7
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-success text-success-foreground">Active</Badge>;
      case 'pending':
        return <Badge className="bg-warning text-warning-foreground">Pending</Badge>;
      case 'expired':
        return <Badge className="bg-danger text-danger-foreground">Expired</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Manufacturer Dashboard</h1>
          <p className="text-muted-foreground">Manage drug batches, generate QR codes, and monitor verification analytics</p>
        </div>
        <Button variant="hero" size="xl">
          <Upload className="mr-2 h-5 w-5" />
          Upload New Batch
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="shadow-soft hover:shadow-medium transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Batches</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBatches}</div>
            <p className="text-xs text-muted-foreground">+23 this month</p>
          </CardContent>
        </Card>

        <Card className="shadow-soft hover:shadow-medium transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Batches</CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{stats.activeBatches}</div>
            <p className="text-xs text-muted-foreground">Currently in market</p>
          </CardContent>
        </Card>

        <Card className="shadow-soft hover:shadow-medium transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">QR Codes</CardTitle>
            <QrCode className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(stats.totalQRCodes / 1000000).toFixed(1)}M</div>
            <p className="text-xs text-muted-foreground">Generated total</p>
          </CardContent>
        </Card>

        <Card className="shadow-soft hover:shadow-medium transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verifications</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.verifications.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">+8.2% this week</p>
          </CardContent>
        </Card>

        <Card className="shadow-soft hover:shadow-medium transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Authenticity Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{stats.authenticityRate}%</div>
            <p className="text-xs text-muted-foreground">Above industry average</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
              {batches.map((batch) => (
                <div key={batch.id} className="p-4 border border-border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-medium">{batch.drug}</p>
                      <p className="text-sm text-muted-foreground">Batch ID: {batch.id}</p>
                    </div>
                    {getStatusBadge(batch.status)}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Quantity</p>
                      <p className="font-medium">{batch.quantity.toLocaleString()} units</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Verifications</p>
                      <p className="font-medium">{batch.verifications.toLocaleString()}</p>
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
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4">
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
            <CardDescription>Network health and transaction status</CardDescription>
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
                  <span>Transaction Success Rate</span>
                  <span className="font-medium">99.8%</span>
                </div>
                <Progress value={99.8} className="h-2" />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Gas Optimization</span>
                  <span className="font-medium">87%</span>
                </div>
                <Progress value={87} className="h-2" />
              </div>
              
              <div className="pt-4 border-t">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Pending Txns</p>
                    <p className="font-medium">3</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Daily Volume</p>
                    <p className="font-medium">12,847</p>
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Button variant="default" size="lg" className="h-20 flex-col">
              <Upload className="h-6 w-6 mb-2" />
              Upload Batch
            </Button>
            <Button variant="secondary" size="lg" className="h-20 flex-col">
              <QrCode className="h-6 w-6 mb-2" />
              Generate QR Codes
            </Button>
            <Button variant="outline" size="lg" className="h-20 flex-col">
              <BarChart3 className="h-6 w-6 mb-2" />
              View Analytics
            </Button>
            <Button variant="outline" size="lg" className="h-20 flex-col">
              <Database className="h-6 w-6 mb-2" />
              Blockchain Query
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}