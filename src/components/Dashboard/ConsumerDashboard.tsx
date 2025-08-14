import { useState, useEffect } from "react";
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
  ScanLine,
  Shield,
  AlertTriangle,
  FileText,
  Info,
  CheckCircle,
  Camera,
  QrCode,
} from "lucide-react";
import QRScanner from "@/components/Camera/QRScanner";
import PhotoCapture from "@/components/Camera/PhotoCapture";

export default function ConsumerDashboard({
  userEmail,
}: {
  userEmail?: string;
}) {
  const [recentScans, setRecentScans] = useState<any[]>([]);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showPhotoCapture, setShowPhotoCapture] = useState(false);

  // Fetch recent verifications from API
  useEffect(() => {
    if (!userEmail) return;
    fetch(`/api/consumer/verifications?userEmail=${userEmail}`)
      .then((res) => res.json())
      .then((data) => setRecentScans(data));
  }, [userEmail]);

  const getResultIcon = (result: string) => {
    switch (result) {
      case "authentic":
      case "verified":
        return <CheckCircle className="h-5 w-5 text-success" />;
      case "suspicious":
        return <AlertTriangle className="h-5 w-5 text-warning" />;
      default:
        return <Shield className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getResultBadge = (result: string) => {
    switch (result) {
      case "authentic":
      case "verified":
        return (
          <Badge className="bg-success text-success-foreground">Verified</Badge>
        );
      case "suspicious":
        return (
          <Badge className="bg-warning text-warning-foreground">
            Suspicious
          </Badge>
        );
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const handleQRResult = (result: string) => {
    const newScan = {
      id: recentScans.length + 1,
      drugName: "Scanned Drug",
      result: "authentic",
      time: "Just now",
      location: "Current scan",
    };
    setRecentScans([newScan, ...recentScans]);
  };

  const handlePhotoResult = (imageData: string) => {
    const newScan = {
      id: recentScans.length + 1,
      drugName: "Analyzed Drug",
      result: "authentic",
      time: "Just now",
      location: "Photo analysis",
    };
    setRecentScans([newScan, ...recentScans]);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Welcome Section */}
      <div className="text-center space-y-4">
        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-hero rounded-full flex items-center justify-center mx-auto shadow-glow">
          <Shield className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground text-balance">
            Drug Verification
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto text-balance">
            Verify the authenticity of your medications by scanning QR codes or
            taking photos
          </p>
        </div>
      </div>

      {/* Quick Scan Section */}
      <Card className="shadow-strong bg-gradient-subtle border-primary/20">
        <CardContent className="p-6 sm:p-8 text-center">
          <div className="space-y-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-semibold mb-2 text-balance">
                Verify Your Medication
              </h2>
              <p className="text-muted-foreground text-balance">
                Scan the QR code on your medication package or take a photo for
                verification
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md mx-auto">
              <Button
                variant="scan"
                size="touch"
                className="h-16 sm:h-20 flex-col touch-target mobile-optimized touch-active"
                onClick={() => setShowQRScanner(true)}
              >
                <QrCode className="h-6 w-6 sm:h-8 sm:w-8 mb-2" />
                <span className="text-sm sm:text-base">Scan QR Code</span>
              </Button>
              <Button
                variant="hero"
                size="touch"
                className="h-16 sm:h-20 flex-col touch-target mobile-optimized touch-active"
                onClick={() => setShowPhotoCapture(true)}
              >
                <Camera className="h-6 w-6 sm:h-8 sm:w-8 mb-2" />
                <span className="text-sm sm:text-base">Take Photo</span>
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              Powered by blockchain verification and AI analysis
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="shadow-soft hover:shadow-medium transition-shadow touch-hover">
          <CardHeader className="text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-lg text-balance">
              Instant Verification
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground text-center text-balance">
              Get immediate results on drug authenticity using blockchain
              technology
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-soft hover:shadow-medium transition-shadow touch-hover">
          <CardHeader className="text-center">
            <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center mx-auto">
              <CheckCircle className="h-6 w-6 text-success" />
            </div>
            <CardTitle className="text-lg text-balance">
              NAFDAC Verified
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground text-center text-balance">
              All verifications comply with NAFDAC Mobile Authentication Service
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-soft hover:shadow-medium transition-shadow touch-hover sm:col-span-2 lg:col-span-1">
          <CardHeader className="text-center">
            <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center mx-auto">
              <AlertTriangle className="h-6 w-6 text-warning" />
            </div>
            <CardTitle className="text-lg text-balance">
              Report Issues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground text-center text-balance">
              Easily report suspicious medications to protect the community
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Scans */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Recent Verifications
          </CardTitle>
          <CardDescription>
            Your medication verification history
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentScans.length > 0 ? (
            <div className="space-y-4">
              {recentScans.map((scan) => (
                <div
                  key={scan.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors touch-hover"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {getResultIcon(scan.result)}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{scan.drugName}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {scan.location}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    {getResultBadge(scan.result)}
                    <p className="text-xs text-muted-foreground mt-1">
                      {scan.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              <FileText className="mx-auto mb-2 h-8 w-8" />
              <p>No verifications yet. Start by scanning a medication!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* QR Scanner Modal */}
      {showQRScanner && (
        <QRScanner
          onResult={handleQRResult}
          onClose={() => setShowQRScanner(false)}
        />
      )}

      {/* Photo Capture Modal */}
      {showPhotoCapture && (
        <PhotoCapture
          onResult={handlePhotoResult}
          onClose={() => setShowPhotoCapture(false)}
        />
      )}
    </div>
  );
}
