import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Camera,
  Upload,
  FileImage,
  Loader2,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Info,
  Shield,
  Zap,
  Target,
  BarChart3,
  History,
  Download,
  Share2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DrugAnalysisResult {
  drugName: string;
  strength: string;
  confidence: number;
  status: 'authentic' | 'suspicious' | 'counterfeit' | 'not_a_drug';
  issues: string[];
  extractedText: string[];
  visualFeatures: {
    color: string;
    shape: string;
    markings: string[];
    objectDetections: any[];
  };
  isDrugImage: boolean;
  imageClassification: {
    isPharmaceutical: boolean;
    detectedObjects: string[];
    confidence: number;
    detectionMethod: string;
    boundingBoxCount: number;
  };
  processingTime?: number;
  modelStatus?: any;
}

interface AnalysisHistory {
  id: string;
  timestamp: Date;
  imageUrl: string;
  result: DrugAnalysisResult;
  status: string;
}

export default function ConsumerDrugDetectionPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [userEmail, setUserEmail] = useState<string>("");
  const [isClient, setIsClient] = useState(false);
  
  // Analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<DrugAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [analysisHistory, setAnalysisHistory] = useState<AnalysisHistory[]>([]);
  
  // Camera state
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Initialize component
  useState(() => {
    setIsClient(true);
    if (typeof window !== "undefined") {
      const role = localStorage.getItem("userRole");
      const email = localStorage.getItem("userEmail");
      if (role !== "consumer") {
        router.push("/login");
        return;
      }
      if (email) {
        setUserEmail(email);
        loadAnalysisHistory(email);
      }
    }
  });

  const loadAnalysisHistory = async (email: string) => {
    try {
      const response = await fetch(`/api/consumer/analysis-history?userEmail=${encodeURIComponent(email)}`);
      if (response.ok) {
        const history = await response.json();
        setAnalysisHistory(history);
      }
    } catch (error) {
      console.error('Failed to load analysis history:', error);
    }
  };

  // File upload handling
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select a valid image file",
        variant: "destructive"
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Image file size must be less than 10MB",
        variant: "destructive"
      });
      return;
    }

    // Display image
    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadedImage(e.target?.result as string);
      setAnalysisResult(null);
      setError(null);
    };
    reader.readAsDataURL(file);

    // Analyze image
    await analyzeImage(file);
  };

  // Camera handling
  const startCamera = useCallback(async () => {
    setCameraLoading(true);
    setCameraError(null);
    
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported in this browser');
      }

      // Stop existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }

      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      setCameraActive(true);
      setCameraLoading(false);
      
    } catch (error) {
      console.error("Error starting camera:", error);
      let errorMessage = "Failed to start camera";
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage = 'Camera access denied. Please allow camera permissions.';
        } else if (error.name === 'NotFoundError') {
          errorMessage = 'No camera found on this device.';
        } else if (error.name === 'NotSupportedError') {
          errorMessage = 'Camera access is not supported in this browser.';
        }
      }
      
      setCameraError(errorMessage);
      setCameraLoading(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0);

    // Convert to data URL
    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    setUploadedImage(imageData);
    setAnalysisResult(null);
    setError(null);

    // Stop camera after capture
    stopCamera();

    // Analyze captured image
    canvas.toBlob(async (blob) => {
      if (blob) {
        const file = new File([blob], 'captured-photo.jpg', { type: 'image/jpeg' });
        await analyzeImage(file);
      }
    }, 'image/jpeg', 0.8);
  }, [stopCamera]);

  // Image analysis
  const analyzeImage = async (file: File) => {
    setIsAnalyzing(true);
    setError(null);
    setAnalysisResult(null);

    try {
      const formData = new FormData();
      formData.append('drugImage', file);

      const response = await fetch('/api/ai/enhanced-drug-detection', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to analyze drug image');
      }

      const result = await response.json();
      const analysis = result.data.analysis;
      
      setAnalysisResult(analysis);
      
      // Save to history
      if (analysis) {
        const historyItem: AnalysisHistory = {
          id: Date.now().toString(),
          timestamp: new Date(),
          imageUrl: uploadedImage || '',
          result: analysis,
          status: analysis.status
        };
        setAnalysisHistory(prev => [historyItem, ...prev.slice(0, 9)]);
      }

      toast({
        title: "Analysis Complete",
        description: `Drug identified: ${analysis.drugName}`,
        variant: analysis.status === 'authentic' ? 'default' : 'destructive'
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred during analysis';
      setError(errorMessage);
      toast({
        title: "Analysis Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Utility functions
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "authentic":
        return <Badge className="bg-green-100 text-green-800 border-green-200">Authentic</Badge>;
      case "suspicious":
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Suspicious</Badge>;
      case "counterfeit":
        return <Badge className="bg-red-100 text-red-800 border-red-200">Counterfeit</Badge>;
      case "not_a_drug":
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Not a Drug</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "authentic":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "suspicious":
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case "counterfeit":
        return <XCircle className="h-5 w-5 text-red-600" />;
      case "not_a_drug":
        return <XCircle className="h-5 w-5 text-gray-600" />;
      default:
        return <Info className="h-5 w-5 text-gray-600" />;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (!isClient) return null;

  return (
    <DashboardLayout userRole="consumer" userName={userEmail}>
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Drug Detection</h1>
            <p className="text-muted-foreground">
              Upload or capture an image to analyze pharmaceutical authenticity
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => router.push('/consumer/history')}>
              <History className="h-4 w-4 mr-2" />
              History
            </Button>
            <Button variant="outline" size="sm" onClick={() => router.push('/consumer/drugs')}>
              <BarChart3 className="h-4 w-4 mr-2" />
              My Drugs
            </Button>
          </div>
        </div>

        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upload">Upload Image</TabsTrigger>
            <TabsTrigger value="camera">Camera Capture</TabsTrigger>
            <TabsTrigger value="results">Analysis Results</TabsTrigger>
          </TabsList>

          {/* Upload Tab */}
          <TabsContent value="upload" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Upload Drug Image
                </CardTitle>
                <CardDescription>
                  Select an image file from your device for analysis
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isAnalyzing}
                    className="flex-1"
                  >
                    <FileImage className="h-4 w-4 mr-2" />
                    Choose Image File
                  </Button>
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  {uploadedImage && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setUploadedImage(null);
                        setAnalysisResult(null);
                        setError(null);
                      }}
                    >
                      Clear
                    </Button>
                  )}
                </div>

                {uploadedImage && (
                  <div className="flex justify-center">
                    <img
                      src={uploadedImage}
                      alt="Uploaded drug"
                      className="max-w-md max-h-96 rounded-lg border shadow-sm"
                    />
                  </div>
                )}

                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-800">{error}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Camera Tab */}
          <TabsContent value="camera" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  Camera Capture
                </CardTitle>
                <CardDescription>
                  Use your device camera to capture a drug image
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!cameraActive ? (
                  <div className="flex flex-col items-center gap-4">
                    <Button
                      onClick={startCamera}
                      disabled={cameraLoading}
                      className="w-full max-w-xs"
                    >
                      {cameraLoading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Camera className="h-4 w-4 mr-2" />
                      )}
                      {cameraLoading ? 'Starting Camera...' : 'Start Camera'}
                    </Button>
                    
                    {cameraError && (
                      <div className="p-4 bg-red-50 border border-red-200 rounded-lg w-full">
                        <p className="text-red-800 text-center">{cameraError}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="relative">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full max-w-md mx-auto rounded-lg border shadow-sm"
                      />
                      <canvas ref={canvasRef} className="hidden" />
                    </div>
                    
                    <div className="flex justify-center gap-2">
                      <Button onClick={capturePhoto} className="bg-green-600 hover:bg-green-700">
                        <Target className="h-4 w-4 mr-2" />
                        Capture Photo
                      </Button>
                      <Button variant="outline" onClick={stopCamera}>
                        Stop Camera
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Results Tab */}
          <TabsContent value="results" className="space-y-4">
            {isAnalyzing ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Analyzing Image...</h3>
                  <p className="text-muted-foreground text-center">
                    Our AI is analyzing your drug image for authenticity and identification
                  </p>
                </CardContent>
              </Card>
            ) : analysisResult ? (
              <div className="space-y-4">
                {/* Main Result Card */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        {getStatusIcon(analysisResult.status)}
                        Drug Analysis Results
                      </CardTitle>
                      {getStatusBadge(analysisResult.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Drug Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <h4 className="font-semibold text-lg">Drug Identification</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Name:</span>
                            <span className="font-medium">{analysisResult.drugName}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Strength:</span>
                            <span className="font-medium">{analysisResult.strength}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Confidence:</span>
                            <span className={`font-medium ${getConfidenceColor(analysisResult.confidence)}`}>
                              {(analysisResult.confidence * 100).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h4 className="font-semibold text-lg">Visual Analysis</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Color:</span>
                            <span className="font-medium capitalize">{analysisResult.visualFeatures.color}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Shape:</span>
                            <span className="font-medium capitalize">{analysisResult.visualFeatures.shape}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Markings:</span>
                            <span className="font-medium">
                              {analysisResult.visualFeatures.markings.length > 0 
                                ? analysisResult.visualFeatures.markings.join(', ')
                                : 'None detected'
                              }
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Issues and Recommendations */}
                    {analysisResult.issues.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="font-semibold text-lg">Issues & Recommendations</h4>
                        <div className="space-y-2">
                          {analysisResult.issues.map((issue, index) => (
                            <div key={index} className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                              <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                              <span className="text-yellow-800">{issue}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Extracted Text */}
                    {analysisResult.extractedText.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="font-semibold text-lg">Extracted Text</h4>
                        <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                          <div className="space-y-1">
                            {analysisResult.extractedText.map((text, index) => (
                              <p key={index} className="text-sm text-gray-700">{text}</p>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Technical Details */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-lg">Technical Details</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                          <div className="font-medium">Detection Method</div>
                          <div className="text-muted-foreground capitalize">
                            {analysisResult.imageClassification.detectionMethod.replace('-', ' ')}
                          </div>
                        </div>
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                          <div className="font-medium">Objects Detected</div>
                          <div className="text-muted-foreground">
                            {analysisResult.imageClassification.boundingBoxCount}
                          </div>
                        </div>
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                          <div className="font-medium">Processing Time</div>
                          <div className="text-muted-foreground">
                            {analysisResult.processingTime ? `${analysisResult.processingTime}ms` : 'N/A'}
                          </div>
                        </div>
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                          <div className="font-medium">AI Confidence</div>
                          <div className="text-muted-foreground">
                            {(analysisResult.imageClassification.confidence * 100).toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2 pt-4 border-t">
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Download Report
                      </Button>
                      <Button variant="outline" size="sm">
                        <Share2 className="h-4 w-4 mr-2" />
                        Share Results
                      </Button>
                      <Button 
                        onClick={() => {
                          setUploadedImage(null);
                          setAnalysisResult(null);
                          setError(null);
                        }}
                        variant="outline" 
                        size="sm"
                      >
                        Analyze Another Image
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileImage className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Analysis Results</h3>
                  <p className="text-muted-foreground text-center">
                    Upload an image or capture a photo to see analysis results here
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Recent Analysis History */}
        {analysisHistory.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Recent Analysis History
              </CardTitle>
              <CardDescription>
                Your last 10 drug analysis results
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analysisHistory.slice(0, 5).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={item.imageUrl}
                        alt="Drug analysis"
                        className="w-12 h-12 object-cover rounded border"
                      />
                      <div>
                        <p className="font-medium">{item.result.drugName}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.timestamp.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(item.result.status)}
                      <Button variant="ghost" size="sm">
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
