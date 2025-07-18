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
} from "lucide-react";

const Index = () => {
  const router = useRouter();

  const features = [
    {
      icon: Shield,
      title: "Blockchain Verification",
      description: "Immutable drug authenticity records on Polygon network",
      color: "text-primary",
    },
    {
      icon: ScanLine,
      title: "QR Code Scanning",
      description: "Instant verification with smartphone cameras",
      color: "text-success",
    },
    {
      icon: Eye,
      title: "AI Visual Analysis",
      description: "Computer vision detects visual anomalies in medications",
      color: "text-warning",
    },
    {
      icon: Database,
      title: "NAFDAC Integration",
      description:
        "Full compliance with Nigeria's Mobile Authentication Service",
      color: "text-danger",
    },
  ];

  const userTypes = [
    {
      title: "Manufacturers",
      description: "Upload batch data, generate QR codes, monitor distribution",
      icon: Database,
      role: "manufacturer",
    },
    {
      title: "Pharmacists",
      description: "Verify drugs, manage inventory, report counterfeits",
      icon: ScanLine,
      role: "pharmacist",
    },
    {
      title: "Consumers",
      description: "Scan medications for instant authenticity verification",
      icon: Smartphone,
      role: "consumer",
    },
    {
      title: "Regulators",
      description: "Monitor supply chain, access reports, ensure compliance",
      icon: Shield,
      role: "regulatory",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">DrugShield</h1>
              <p className="text-xs text-muted-foreground">
                Pharmaceutical Authentication
              </p>
            </div>
          </div>

          <Button onClick={() => router.push("/login")} variant="hero">
            Sign In
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 text-center">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="w-20 h-20 bg-gradient-hero rounded-full flex items-center justify-center mx-auto mb-8 shadow-glow">
            <Shield className="h-10 w-10 text-white" />
          </div>

          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-success bg-clip-text text-transparent">
            Secure Nigeria's Drug Supply Chain
          </h1>

          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            AI-powered counterfeit drug detection using blockchain technology,
            compliant with NAFDAC regulations and EU Falsified Medicines
            Directive.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button
              onClick={() => router.push("/login")}
              variant="hero"
              size="xl"
            >
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button variant="outline" size="xl">
              Learn More
            </Button>
          </div>

          <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
            <Badge variant="outline">NAFDAC MAS Compliant</Badge>
            <Badge variant="outline">EU FMD Compatible</Badge>
            <Badge variant="outline">Blockchain Secured</Badge>
            <Badge variant="outline">AI-Powered</Badge>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-card/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">
              Advanced Anti-Counterfeit Technology
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Combining blockchain immutability, AI analysis, and regulatory
              compliance to protect Nigeria's pharmaceutical supply chain.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="shadow-soft hover:shadow-medium transition-all hover:-translate-y-1"
              >
                <CardHeader className="text-center">
                  <div
                    className={`w-12 h-12 rounded-lg bg-accent flex items-center justify-center mx-auto mb-4`}
                  >
                    <feature.icon className={`h-6 w-6 ${feature.color}`} />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground text-center">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* User Types Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">
              Built for Every Stakeholder
            </h2>
            <p className="text-muted-foreground">
              Tailored interfaces for manufacturers, pharmacists, consumers, and
              regulators
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {userTypes.map((type, index) => (
              <Card
                key={index}
                className="shadow-soft hover:shadow-medium transition-all cursor-pointer group"
              >
                <CardHeader className="text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                    <type.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{type.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground text-center mb-4">
                    {type.description}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => router.push("/login")}
                  >
                    Access Dashboard
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-card/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-primary mb-2">
                20,000+
              </div>
              <p className="text-muted-foreground">Pharmacies Supported</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-success mb-2">99.7%</div>
              <p className="text-muted-foreground">Accuracy Rate</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-warning mb-2">2.8M</div>
              <p className="text-muted-foreground">Drugs Verified</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-danger mb-2">50,000+</div>
              <p className="text-muted-foreground">Counterfeits Detected</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Shield className="h-5 w-5 text-white" />
              </div>
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

export default Index;
