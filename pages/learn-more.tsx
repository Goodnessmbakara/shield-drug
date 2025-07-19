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
  Shield,
  ScanLine,
  Database,
  CheckCircle,
  Globe,
  Users,
  ArrowRight,
  Smartphone,
  Eye,
  Lock,
  Zap,
  BarChart3,
  ShieldCheck,
  FileText,
  Award,
  TrendingUp,
  AlertTriangle,
  Heart,
  Cpu,
  Network,
  QrCode,
  Camera,
  Server,
  Package,
  Clock,
  Activity,
  Target,
  Star,
  Globe as WorldIcon,
  Award as ComplianceIcon,
} from "lucide-react";
import Logo from "@/components/ui/logo";

const LearnMore = () => {
  const router = useRouter();

  const technologyFeatures = [
    {
      icon: Shield,
      title: "Blockchain Security",
      description:
        "Immutable drug authenticity records stored on Polygon network ensuring tamper-proof verification",
      details:
        "Every drug verification is permanently recorded on the blockchain, creating an unbreakable chain of custody from manufacturer to consumer.",
      color: "text-primary",
    },
    {
      icon: Cpu,
      title: "AI-Powered Analysis",
      description:
        "Advanced computer vision algorithms detect visual anomalies in medications",
      details:
        "Our AI system analyzes packaging, pill appearance, and other visual indicators to identify potential counterfeits with 99.7% accuracy.",
      color: "text-success",
    },
    {
      icon: QrCode,
      title: "QR Code Technology",
      description:
        "Unique QR codes for each drug batch enabling instant verification",
      details:
        "Each medication package receives a unique QR code that contains encrypted information about the drug's authenticity and origin.",
      color: "text-warning",
    },
    {
      icon: Network,
      title: "Real-time Verification",
      description:
        "Instant verification results with comprehensive drug information",
      details:
        "Scan any drug package and receive immediate verification status, batch information, and safety alerts.",
      color: "text-danger",
    },
  ];

  const complianceFeatures = [
    {
      icon: Award,
      title: "NAFDAC MAS Compliance",
      description:
        "Full integration with Nigeria's Mobile Authentication Service",
      details:
        "Compliant with NAFDAC regulations and integrated with the official MAS system for seamless regulatory reporting.",
      color: "text-success",
    },
    {
      icon: Globe,
      title: "EU FMD Compatible",
      description: "Meets European Falsified Medicines Directive standards",
      details:
        "Our system adheres to international standards, making it compatible with global pharmaceutical regulations.",
      color: "text-primary",
    },
    {
      icon: FileText,
      title: "Regulatory Reporting",
      description: "Automated compliance reporting and audit trails",
      details:
        "Generate comprehensive reports for regulatory bodies, including counterfeit detection statistics and supply chain analytics.",
      color: "text-warning",
    },
    {
      icon: ShieldCheck,
      title: "Data Protection",
      description: "GDPR-compliant data handling and privacy protection",
      details:
        "All personal and pharmaceutical data is encrypted and handled according to international privacy standards.",
      color: "text-danger",
    },
  ];

  const benefits = [
    {
      icon: TrendingUp,
      title: "Reduced Counterfeits",
      description:
        "99.7% accuracy in counterfeit detection leading to safer medications",
      impact: "50,000+ counterfeits detected and prevented",
      color: "text-success",
    },
    {
      icon: Heart,
      title: "Patient Safety",
      description:
        "Enhanced patient safety through verified medication authenticity",
      impact: "2.8M+ drugs verified for patient safety",
      color: "text-danger",
    },
    {
      icon: BarChart3,
      title: "Supply Chain Transparency",
      description: "Complete visibility into pharmaceutical supply chain",
      impact: "20,000+ pharmacies with full supply chain visibility",
      color: "text-primary",
    },
    {
      icon: Zap,
      title: "Operational Efficiency",
      description:
        "Streamlined verification processes saving time and resources",
      impact: "60% reduction in verification time",
      color: "text-warning",
    },
  ];

  const useCases = [
    {
      title: "Manufacturers",
      description: "Upload batch data, generate QR codes, monitor distribution",
      features: [
        "Batch Registration",
        "QR Code Generation",
        "Distribution Tracking",
        "Analytics Dashboard",
      ],
      icon: Database,
      color: "text-primary",
    },
    {
      title: "Pharmacists",
      description: "Verify drugs, manage inventory, report counterfeits",
      features: [
        "Instant Verification",
        "Inventory Management",
        "Counterfeit Reporting",
        "Patient Education",
      ],
      icon: ScanLine,
      color: "text-success",
    },
    {
      title: "Consumers",
      description: "Scan medications for instant authenticity verification",
      features: [
        "Mobile App",
        "QR Scanning",
        "Safety Alerts",
        "Drug Information",
      ],
      icon: Smartphone,
      color: "text-warning",
    },
    {
      title: "Regulators",
      description: "Monitor supply chain, access reports, ensure compliance",
      features: [
        "Real-time Monitoring",
        "Compliance Reports",
        "Analytics",
        "Alert System",
      ],
      icon: Shield,
      color: "text-danger",
    },
  ];

  const statistics = [
    {
      number: "99.7%",
      label: "Detection Accuracy",
      icon: CheckCircle,
      color: "text-success",
    },
    {
      number: "2.8M+",
      label: "Drugs Verified",
      icon: Database,
      color: "text-primary",
    },
    {
      number: "50,000+",
      label: "Counterfeits Detected",
      icon: AlertTriangle,
      color: "text-danger",
    },
    {
      number: "20,000+",
      label: "Pharmacies Supported",
      icon: Users,
      color: "text-warning",
    },
    {
      number: "60%",
      label: "Faster Verification",
      icon: Zap,
      color: "text-success",
    },
    {
      number: "24/7",
      label: "System Uptime",
      icon: Server,
      color: "text-primary",
    },
  ];

  const platformStats = {
    totalBatches: 247000,
    activeBatches: 156000,
    totalQRCodes: 2890000,
    verifications: 145670,
    authenticityRate: 98.7,
    systemUptime: 99.9,
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Logo size="sm" showText={false} />
            <div>
              <h1 className="text-xl font-bold">DrugShield</h1>
              <p className="text-xs text-muted-foreground">
                Pharmaceutical Authentication
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={() => router.push("/")} variant="outline">
              Home
            </Button>
            <Button onClick={() => router.push("/login")} variant="hero">
              Sign In
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        <div className="container mx-auto max-w-7xl space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Learn About DrugShield
              </h1>
              <p className="text-muted-foreground">
                Discover how our advanced technology is revolutionizing
                pharmaceutical authentication and protecting Nigeria's drug
                supply chain
              </p>
            </div>
            <Button
              onClick={() => router.push("/login")}
              variant="hero"
              size="xl"
            >
              Get Started Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>

          {/* Platform Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <Card className="shadow-soft hover:shadow-medium transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Batches
                </CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(platformStats.totalBatches / 1000).toFixed(0)}K
                </div>
                <p className="text-xs text-muted-foreground">
                  Registered batches
                </p>
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
                  {(platformStats.activeBatches / 1000).toFixed(0)}K
                </div>
                <p className="text-xs text-muted-foreground">
                  Currently in market
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-soft hover:shadow-medium transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">QR Codes</CardTitle>
                <QrCode className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(platformStats.totalQRCodes / 1000000).toFixed(1)}M
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
                  {platformStats.verifications.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total verifications
                </p>
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
                  {platformStats.authenticityRate}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Above industry average
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-soft hover:shadow-medium transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  System Uptime
                </CardTitle>
                <Activity className="h-4 w-4 text-success" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success">
                  {platformStats.systemUptime}%
                </div>
                <p className="text-xs text-muted-foreground">
                  24/7 availability
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Technology Features */}
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cpu className="h-5 w-5" />
                  Advanced Technology Stack
                </CardTitle>
                <CardDescription>
                  Cutting-edge technologies powering our platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {technologyFeatures.map((feature, index) => (
                    <div
                      key={index}
                      className="p-4 border border-border rounded-lg"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div
                          className={`w-8 h-8 rounded-lg bg-accent flex items-center justify-center`}
                        >
                          <feature.icon
                            className={`h-4 w-4 ${feature.color}`}
                          />
                        </div>
                        <div>
                          <p className="font-medium">{feature.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {feature.description}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {feature.details}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Compliance & Standards */}
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Regulatory Compliance
                </CardTitle>
                <CardDescription>
                  Built to meet international standards
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {complianceFeatures.map((feature, index) => (
                    <div
                      key={index}
                      className="p-4 border border-border rounded-lg"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div
                          className={`w-8 h-8 rounded-lg bg-accent flex items-center justify-center`}
                        >
                          <feature.icon
                            className={`h-4 w-4 ${feature.color}`}
                          />
                        </div>
                        <div>
                          <p className="font-medium">{feature.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {feature.description}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {feature.details}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Benefits Grid */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Platform Benefits & Impact
              </CardTitle>
              <CardDescription>
                Measurable results that improve pharmaceutical safety
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {benefits.map((benefit, index) => (
                  <div
                    key={index}
                    className="p-4 border border-border rounded-lg text-center"
                  >
                    <div
                      className={`w-12 h-12 rounded-lg bg-accent flex items-center justify-center mx-auto mb-3`}
                    >
                      <benefit.icon className={`h-6 w-6 ${benefit.color}`} />
                    </div>
                    <h3 className="font-medium mb-2">{benefit.title}</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      {benefit.description}
                    </p>
                    <Badge variant="secondary" className="text-xs">
                      {benefit.impact}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Use Cases */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Tailored for Every Stakeholder
              </CardTitle>
              <CardDescription>
                Comprehensive solutions for each participant in the
                pharmaceutical supply chain
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {useCases.map((useCase, index) => (
                  <div
                    key={index}
                    className="p-4 border border-border rounded-lg"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className={`w-10 h-10 rounded-lg bg-accent flex items-center justify-center`}
                      >
                        <useCase.icon className={`h-5 w-5 ${useCase.color}`} />
                      </div>
                      <div>
                        <h3 className="font-medium">{useCase.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {useCase.description}
                        </p>
                      </div>
                    </div>
                    <ul className="space-y-1">
                      {useCase.features.map((feature, featureIndex) => (
                        <li
                          key={featureIndex}
                          className="flex items-center text-sm text-muted-foreground"
                        >
                          <CheckCircle className="h-3 w-3 text-success mr-2 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Statistics Dashboard */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Platform Statistics
              </CardTitle>
              <CardDescription>
                Real numbers showing the impact of DrugShield across Nigeria's
                pharmaceutical sector
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                {statistics.map((stat, index) => (
                  <div key={index} className="text-center">
                    <div
                      className={`w-12 h-12 bg-accent rounded-lg flex items-center justify-center mx-auto mb-3`}
                    >
                      <stat.icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                    <div className={`text-2xl font-bold ${stat.color} mb-1`}>
                      {stat.number}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Ready to Get Started?</CardTitle>
              <CardDescription>
                Join thousands of pharmacies, manufacturers, and regulators who
                trust DrugShield
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  variant="hero"
                  size="lg"
                  className="h-16 flex-col"
                  onClick={() => router.push("/login")}
                >
                  <ArrowRight className="h-6 w-6 mb-2" />
                  Sign Up Now
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="h-16 flex-col"
                  onClick={() => router.push("/")}
                >
                  <Star className="h-6 w-6 mb-2" />
                  Back to Home
                </Button>
                <Button variant="outline" size="lg" className="h-16 flex-col">
                  <FileText className="h-6 w-6 mb-2" />
                  Download Brochure
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <Logo size="sm" showText={false} />
              <div>
                <h3 className="font-bold">DrugShield</h3>
                <p className="text-xs text-muted-foreground">
                  Securing Nigeria's pharmaceutical supply chain
                </p>
              </div>
            </div>

            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <span>NAFDAC MAS Integrated</span>
              <span>EU FMD Compatible</span>
              <span>Blockchain Secured</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LearnMore;
