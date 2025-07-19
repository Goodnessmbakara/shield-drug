import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import DashboardLayout from "@/components/Layout/DashboardLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Database,
  Shield,
  FileText,
} from "lucide-react";

export default function RegulatoryAnalyticsPage() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string>("");
  const [isClient, setIsClient] = useState(false);

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

  const stats = {
    totalReports: 128,
    openReports: 12,
    resolvedReports: 104,
    investigatingReports: 12,
    totalBlockchainTx: 2847,
    registeredDrugs: 312,
    complianceRate: 96.2,
    violationRate: 3.8,
    lastUpdated: "2024-06-01 15:00",
  };

  return (
    <DashboardLayout userRole="regulatory" userName={userEmail}>
      <div className="space-y-6 max-w-5xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Regulatory Analytics
          </h1>
          <p className="text-muted-foreground">
            Key metrics and trends for regulatory activities
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Reports
              </CardTitle>
              <FileText className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalReports}</div>
              <p className="text-xs text-muted-foreground">+8 this week</p>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Open Reports
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">
                {stats.openReports}
              </div>
              <p className="text-xs text-muted-foreground">Needs attention</p>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resolved</CardTitle>
              <CheckCircle className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">
                {stats.resolvedReports}
              </div>
              <p className="text-xs text-muted-foreground">Reports closed</p>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Blockchain Tx
              </CardTitle>
              <Database className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.totalBlockchainTx}
              </div>
              <p className="text-xs text-muted-foreground">
                Drug verifications
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Analytics Section */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Trends & Performance
            </CardTitle>
            <CardDescription>
              Overview of regulatory performance and compliance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-4">
                <h4 className="font-medium">Compliance Rate</h4>
                <div className="flex items-center gap-2">
                  <Progress value={stats.complianceRate} className="h-2" />
                  <span className="font-bold text-success">
                    {stats.complianceRate}%
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  NAFDAC compliance across all drugs
                </p>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Violation Rate</h4>
                <div className="flex items-center gap-2">
                  <Progress
                    value={stats.violationRate}
                    className="h-2 bg-danger"
                  />
                  <span className="font-bold text-danger">
                    {stats.violationRate}%
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Non-compliant drugs detected
                </p>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Registered Drugs</h4>
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  <span className="font-bold">{stats.registeredDrugs}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Drugs registered with NAFDAC
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Last Updated */}
        <div className="text-right text-xs text-muted-foreground">
          Last updated: {stats.lastUpdated}
        </div>
      </div>
    </DashboardLayout>
  );
}
