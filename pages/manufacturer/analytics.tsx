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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Package,
  QrCode,
  Users,
  CheckCircle,
  AlertTriangle,
  Clock,
  Database,
  Eye,
  Download,
  Calendar,
  Hash,
  Globe,
  Activity,
  Settings,
  FileText,
  PieChart,
  LineChart,
  Target,
  Award,
  Zap,
  Shield,
} from "lucide-react";

export default function AnalyticsPage() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string>("");
  const [isClient, setIsClient] = useState(false);
  const [timeRange, setTimeRange] = useState("30d");
  const [selectedMetric, setSelectedMetric] = useState("verifications");

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

  const analyticsData = {
    overview: {
      totalBatches: 247,
      totalQRCodes: 2890000,
      totalVerifications: 145670,
      authenticityRate: 98.7,
      complianceRate: 94.2,
      blockchainSuccess: 99.8,
      activePharmacies: 2047,
      totalRevenue: 2847000,
    },
    trends: {
      verifications: [1250, 1890, 2340, 3420, 2890, 4560, 5230],
      qrGenerations: [1200, 1800, 2200, 3200, 2800, 4200, 4800],
      uploads: [15, 23, 18, 31, 27, 42, 38],
      counterfeits: [3, 5, 2, 8, 4, 6, 3],
    },
    topDrugs: [
      {
        name: "Coartem",
        verifications: 45620,
        qrCodes: 120000,
        authenticity: 99.2,
      },
      {
        name: "Panadol",
        verifications: 34200,
        qrCodes: 150000,
        authenticity: 98.8,
      },
      {
        name: "Amoxil",
        verifications: 28900,
        qrCodes: 80000,
        authenticity: 97.9,
      },
      {
        name: "Aspirin",
        verifications: 21000,
        qrCodes: 60000,
        authenticity: 98.5,
      },
      {
        name: "Malarone",
        verifications: 15950,
        qrCodes: 45000,
        authenticity: 99.1,
      },
    ],
    regionalData: [
      {
        region: "Lagos",
        verifications: 45620,
        pharmacies: 450,
        counterfeits: 12,
      },
      {
        region: "Abuja",
        verifications: 34200,
        pharmacies: 320,
        counterfeits: 8,
      },
      {
        region: "Port Harcourt",
        verifications: 28900,
        pharmacies: 280,
        counterfeits: 15,
      },
      {
        region: "Kano",
        verifications: 21000,
        pharmacies: 220,
        counterfeits: 6,
      },
      {
        region: "Ibadan",
        verifications: 15950,
        pharmacies: 180,
        counterfeits: 9,
      },
    ],
    monthlyStats: [
      { month: "Jan", verifications: 12500, qrCodes: 120000, uploads: 15 },
      { month: "Feb", verifications: 18900, qrCodes: 180000, uploads: 23 },
      { month: "Mar", verifications: 23400, qrCodes: 220000, uploads: 18 },
      { month: "Apr", verifications: 34200, qrCodes: 320000, uploads: 31 },
      { month: "May", verifications: 28900, qrCodes: 280000, uploads: 27 },
      { month: "Jun", verifications: 45600, qrCodes: 420000, uploads: 42 },
      { month: "Jul", verifications: 52300, qrCodes: 480000, uploads: 38 },
    ],
  };

  const getTrendIcon = (current: number, previous: number) => {
    const change = ((current - previous) / previous) * 100;
    if (change > 0) {
      return <TrendingUp className="h-4 w-4 text-success" />;
    } else if (change < 0) {
      return <TrendingDown className="h-4 w-4 text-danger" />;
    } else {
      return <Activity className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getTrendValue = (current: number, previous: number) => {
    const change = ((current - previous) / previous) * 100;
    return `${change > 0 ? "+" : ""}${change.toFixed(1)}%`;
  };

  const getTrendColor = (current: number, previous: number) => {
    const change = ((current - previous) / previous) * 100;
    if (change > 0) return "text-success";
    if (change < 0) return "text-danger";
    return "text-muted-foreground";
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
              Analytics Dashboard
            </h1>
            <p className="text-muted-foreground">
              Comprehensive insights into your pharmaceutical operations and
              performance
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="1y">Last year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-8 gap-4">
          <Card className="shadow-soft hover:shadow-medium transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Batches
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analyticsData.overview.totalBatches}
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                {getTrendIcon(247, 220)}
                <span className={getTrendColor(247, 220)}>+12.3%</span>
                <span>vs last month</span>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft hover:shadow-medium transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">QR Codes</CardTitle>
              <QrCode className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(analyticsData.overview.totalQRCodes / 1000000).toFixed(1)}M
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                {getTrendIcon(2890000, 2600000)}
                <span className={getTrendColor(2890000, 2600000)}>+11.2%</span>
                <span>vs last month</span>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft hover:shadow-medium transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Verifications
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analyticsData.overview.totalVerifications.toLocaleString()}
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                {getTrendIcon(145670, 132000)}
                <span className={getTrendColor(145670, 132000)}>+10.4%</span>
                <span>vs last month</span>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft hover:shadow-medium transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Authenticity Rate
              </CardTitle>
              <Shield className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">
                {analyticsData.overview.authenticityRate}%
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                {getTrendIcon(98.7, 98.2)}
                <span className={getTrendColor(98.7, 98.2)}>+0.5%</span>
                <span>vs last month</span>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft hover:shadow-medium transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Compliance Rate
              </CardTitle>
              <Award className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">
                {analyticsData.overview.complianceRate}%
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                {getTrendIcon(94.2, 93.8)}
                <span className={getTrendColor(94.2, 93.8)}>+0.4%</span>
                <span>vs last month</span>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft hover:shadow-medium transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Blockchain Success
              </CardTitle>
              <Database className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">
                {analyticsData.overview.blockchainSuccess}%
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                {getTrendIcon(99.8, 99.6)}
                <span className={getTrendColor(99.8, 99.6)}>+0.2%</span>
                <span>vs last month</span>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft hover:shadow-medium transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Pharmacies
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analyticsData.overview.activePharmacies.toLocaleString()}
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                {getTrendIcon(2047, 1950)}
                <span className={getTrendColor(2047, 1950)}>+5.0%</span>
                <span>vs last month</span>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft hover:shadow-medium transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₦{(analyticsData.overview.totalRevenue / 1000000).toFixed(1)}M
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                {getTrendIcon(2847000, 2600000)}
                <span className={getTrendColor(2847000, 2600000)}>+9.5%</span>
                <span>vs last month</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Trends */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LineChart className="h-5 w-5" />
                Monthly Trends
              </CardTitle>
              <CardDescription>
                Performance metrics over the last 7 months
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.monthlyStats.map((stat, index) => (
                  <div
                    key={stat.month}
                    className="flex items-center justify-between p-3 border border-border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                        <span className="text-sm font-medium">
                          {stat.month}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">
                          {stat.verifications.toLocaleString()} verifications
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {stat.qrCodes.toLocaleString()} QR codes •{" "}
                          {stat.uploads} uploads
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-success">
                        +
                        {(
                          (stat.verifications /
                            analyticsData.monthlyStats[Math.max(0, index - 1)]
                              .verifications -
                            1) *
                          100
                        ).toFixed(1)}
                        %
                      </div>
                      <div className="text-xs text-muted-foreground">
                        vs previous
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Performing Drugs */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Top Performing Drugs
              </CardTitle>
              <CardDescription>
                Drugs with highest verification rates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.topDrugs.map((drug, index) => (
                  <div
                    key={drug.name}
                    className="flex items-center justify-between p-3 border border-border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
                        <span className="text-sm font-medium">{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium">{drug.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {drug.verifications.toLocaleString()} verifications
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-success">
                        {drug.authenticity}%
                      </div>
                      <div className="text-xs text-muted-foreground">
                        authenticity
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Regional Performance */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Regional Performance
            </CardTitle>
            <CardDescription>
              Verification activity across different regions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {analyticsData.regionalData.map((region) => (
                <div
                  key={region.region}
                  className="p-4 border border-border rounded-lg text-center"
                >
                  <h3 className="font-medium mb-2">{region.region}</h3>
                  <div className="space-y-2">
                    <div>
                      <p className="text-2xl font-bold">
                        {region.verifications.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Verifications
                      </p>
                    </div>
                    <div>
                      <p className="text-lg font-medium">{region.pharmacies}</p>
                      <p className="text-xs text-muted-foreground">
                        Pharmacies
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-danger">
                        {region.counterfeits}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Counterfeits Detected
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Verification Trends */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Verification Trends
              </CardTitle>
              <CardDescription>Daily verification patterns</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analyticsData.trends.verifications.map((value, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm">Day {index + 1}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-accent rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full"
                          style={{
                            width: `${
                              (value /
                                Math.max(
                                  ...analyticsData.trends.verifications
                                )) *
                              100
                            }%`,
                          }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium w-16 text-right">
                        {value.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* QR Code Generation Trends */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                QR Code Generation
              </CardTitle>
              <CardDescription>
                Daily QR code generation patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analyticsData.trends.qrGenerations.map((value, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm">Day {index + 1}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-accent rounded-full h-2">
                        <div
                          className="bg-success h-2 rounded-full"
                          style={{
                            width: `${
                              (value /
                                Math.max(
                                  ...analyticsData.trends.qrGenerations
                                )) *
                              100
                            }%`,
                          }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium w-16 text-right">
                        {value.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Blockchain Analytics */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Blockchain Analytics
            </CardTitle>
            <CardDescription>
              Blockchain transaction performance and network health
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-4">
                <h4 className="font-medium">Transaction Performance</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Success Rate</span>
                    <span className="font-medium text-success">99.8%</span>
                  </div>
                  <Progress value={99.8} className="h-2" />

                  <div className="flex justify-between items-center">
                    <span className="text-sm">Average Gas Used</span>
                    <span className="font-medium">45,000</span>
                  </div>
                  <Progress value={75} className="h-2" />

                  <div className="flex justify-between items-center">
                    <span className="text-sm">Block Confirmation</span>
                    <span className="font-medium">2.3s</span>
                  </div>
                  <Progress value={92} className="h-2" />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Network Stats</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Pending Txns</p>
                    <p className="font-medium">3</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Daily Volume</p>
                    <p className="font-medium">12,847</p>
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

              <div className="space-y-4">
                <h4 className="font-medium">Recent Transactions</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Batch CT2024001</span>
                    <Badge className="bg-success text-success-foreground text-xs">
                      Success
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>QR Generation</span>
                    <Badge className="bg-success text-success-foreground text-xs">
                      Success
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Verification Log</span>
                    <Badge className="bg-warning text-warning-foreground text-xs">
                      Pending
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Analytics Actions</CardTitle>
            <CardDescription>Export and manage analytics data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Button variant="default" size="lg" className="h-20 flex-col">
                <Download className="h-6 w-6 mb-2" />
                Export Report
              </Button>
              <Button variant="secondary" size="lg" className="h-20 flex-col">
                <FileText className="h-6 w-6 mb-2" />
                Generate PDF
              </Button>
              <Button variant="outline" size="lg" className="h-20 flex-col">
                <Eye className="h-6 w-6 mb-2" />
                View Details
              </Button>
              <Button variant="outline" size="lg" className="h-20 flex-col">
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
