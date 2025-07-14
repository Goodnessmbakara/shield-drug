import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/Layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Database, Shield, BarChart3, Building, FileText } from "lucide-react";

export default function RegulatoryDashboardPage() {
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState<string>("");

  useEffect(() => {
    const role = localStorage.getItem('userRole');
    const email = localStorage.getItem('userEmail');
    
    if (role !== 'regulatory') {
      navigate('/login');
      return;
    }
    
    if (email) {
      setUserEmail(email);
    }
  }, [navigate]);

  const reports = [
    { id: "R001", drug: "Coartem", location: "Lagos", status: "investigating", severity: "high" },
    { id: "R002", drug: "Panadol", location: "Abuja", status: "resolved", severity: "medium" },
    { id: "R003", drug: "Amoxil", location: "Port Harcourt", status: "pending", severity: "high" },
  ];

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'high':
        return <Badge className="bg-danger text-danger-foreground">High</Badge>;
      case 'medium':
        return <Badge className="bg-warning text-warning-foreground">Medium</Badge>;
      case 'low':
        return <Badge className="bg-success text-success-foreground">Low</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <DashboardLayout userRole="regulatory" userName={userEmail}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">NAFDAC Regulatory Dashboard</h1>
          <p className="text-muted-foreground">Monitor counterfeit reports and pharmaceutical supply chain integrity</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Reports</CardTitle>
              <AlertTriangle className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">247</div>
              <p className="text-xs text-muted-foreground">+12 this week</p>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Manufacturers</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,247</div>
              <p className="text-xs text-muted-foreground">Registered</p>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Blockchain Queries</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">89,432</div>
              <p className="text-xs text-muted-foreground">Today</p>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Integrity</CardTitle>
              <Shield className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">99.7%</div>
              <p className="text-xs text-muted-foreground">Operational</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Reports */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Recent Counterfeit Reports
            </CardTitle>
            <CardDescription>Latest reports requiring regulatory attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reports.map((report) => (
                <div key={report.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-danger/10 rounded-lg flex items-center justify-center">
                      <AlertTriangle className="h-5 w-5 text-danger" />
                    </div>
                    <div>
                      <p className="font-medium">{report.drug}</p>
                      <p className="text-sm text-muted-foreground">Report ID: {report.id} • {report.location}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getSeverityBadge(report.severity)}
                    <Badge variant="outline">{report.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4">
              View All Reports
            </Button>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>NAFDAC Actions</CardTitle>
            <CardDescription>Regulatory tools and integrations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button variant="default" size="lg" className="h-20 flex-col">
                <Database className="h-6 w-6 mb-2" />
                Query Blockchain
              </Button>
              <Button variant="secondary" size="lg" className="h-20 flex-col">
                <Shield className="h-6 w-6 mb-2" />
                NAFDAC MAS Sync
              </Button>
              <Button variant="outline" size="lg" className="h-20 flex-col">
                <BarChart3 className="h-6 w-6 mb-2" />
                Generate Report
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}