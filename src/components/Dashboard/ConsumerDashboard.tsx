import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ScanLine, 
  Shield, 
  AlertTriangle, 
  FileText, 
  Info,
  CheckCircle,
  Camera,
  QrCode
} from "lucide-react";
import QRScanner from "@/components/Camera/QRScanner";
import PhotoCapture from "@/components/Camera/PhotoCapture";

export default function ConsumerDashboard() {
  const [recentScans, setRecentScans] = useState([
    { id: 1, drugName: "Paracetamol", result: "authentic", time: "Today, 2:30 PM", location: "Zuma Pharmacy" },
    { id: 2, drugName: "Vitamin C", result: "authentic", time: "Yesterday, 6:15 PM", location: "City Pharmacy" },
    { id: 3, drugName: "Cough Syrup", result: "verified", time: "2 days ago", location: "Health Plus" },
  ]);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showPhotoCapture, setShowPhotoCapture] = useState(false);

  const getResultIcon = (result: string) => {
    switch (result) {
      case 'authentic':
      case 'verified':
        return <CheckCircle className="h-5 w-5 text-success" />;
      case 'suspicious':
        return <AlertTriangle className="h-5 w-5 text-warning" />;
      default:
        return <Shield className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getResultBadge = (result: string) => {
    switch (result) {
      case 'authentic':
      case 'verified':
        return <Badge className="bg-success text-success-foreground">Verified</Badge>;
      case 'suspicious':
        return <Badge className="bg-warning text-warning-foreground">Suspicious</Badge>;
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
      location: "Current scan"
    };
    setRecentScans([newScan, ...recentScans]);
  };

  const handlePhotoResult = (imageData: string) => {
    const newScan = {
      id: recentScans.length + 1,
      drugName: "Analyzed Drug",
      result: "authentic",
      time: "Just now",
      location: "Photo analysis"
    };
    setRecentScans([newScan, ...recentScans]);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Welcome Section */}
      <div className="text-center space-y-4">
        <div className="w-20 h-20 bg-gradient-hero rounded-full flex items-center justify-center mx-auto shadow-glow">
          <Shield className="h-10 w-10 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Drug Verification</h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Verify the authenticity of your medications by scanning QR codes or taking photos
          </p>
        </div>
      </div>

      {/* Quick Scan Section */}
      <Card className="shadow-strong bg-gradient-subtle border-primary/20">
        <CardContent className="p-8 text-center">
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-2">Verify Your Medication</h2>
              <p className="text-muted-foreground">
                Scan the QR code on your medication package or take a photo for verification
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-md mx-auto">
              <Button 
                variant="scan" 
                size="xl" 
                className="h-20 flex-col"
                onClick={() => setShowQRScanner(true)}
              >
                <QrCode className="h-8 w-8 mb-2" />
                Scan QR Code
              </Button>
              <Button 
                variant="hero" 
                size="xl" 
                className="h-20 flex-col"
                onClick={() => setShowPhotoCapture(true)}
              >
                <Camera className="h-8 w-8 mb-2" />
                Take Photo
              </Button>
            </div>
            
            <p className="text-xs text-muted-foreground">
              Powered by blockchain verification and AI analysis
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-soft hover:shadow-medium transition-shadow">
          <CardHeader className="text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-lg">Instant Verification</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground text-center">
              Get immediate results on drug authenticity using blockchain technology
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-soft hover:shadow-medium transition-shadow">
          <CardHeader className="text-center">
            <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center mx-auto">
              <CheckCircle className="h-6 w-6 text-success" />
            </div>
            <CardTitle className="text-lg">NAFDAC Verified</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground text-center">
              All verifications comply with NAFDAC Mobile Authentication Service
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-soft hover:shadow-medium transition-shadow">
          <CardHeader className="text-center">
            <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center mx-auto">
              <AlertTriangle className="h-6 w-6 text-warning" />
            </div>
            <CardTitle className="text-lg">Report Issues</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground text-center">
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
                <div key={scan.id} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors">
                  <div className="flex items-center gap-3">
                    {getResultIcon(scan.result)}
                    <div>
                      <p className="font-medium">{scan.drugName}</p>
                      <p className="text-sm text-muted-foreground">{scan.location}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    {getResultBadge(scan.result)}
                    <p className="text-xs text-muted-foreground mt-1">{scan.time}</p>
                  </div>
                </div>
              ))}
              <Button variant="outline" className="w-full">
                View All History
              </Button>
            </div>
          ) : (
            <div className="text-center py-8">
              <ScanLine className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No verifications yet</p>
              <p className="text-sm text-muted-foreground">Start by scanning your first medication</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Help Section */}
      <Card className="shadow-soft bg-accent/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            How It Works
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">QR Code Scanning</h4>
              <p className="text-muted-foreground">
                Scan the QR code on your medication package for instant blockchain verification
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Photo Analysis</h4>
              <p className="text-muted-foreground">
                Take a photo for AI-powered visual analysis to detect counterfeits
              </p>
            </div>
          </div>
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