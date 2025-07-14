import { useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Camera, RotateCcw, CheckCircle, AlertTriangle, Upload } from 'lucide-react';

interface PhotoCaptureProps {
  onResult: (imageData: string) => void;
  onClose: () => void;
}

interface AnalysisResult {
  status: 'authentic' | 'suspicious' | 'analyzing';
  confidence: number;
  issues: string[];
  drugName?: string;
}

export default function PhotoCapture({ onResult, onClose }: PhotoCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
        setCameraActive(true);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setCameraActive(false);
    }
  }, [stream]);

  const capturePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedImage(imageData);
        stopCamera();
        analyzeImage(imageData);
        onResult(imageData);
      }
    }
  }, [stopCamera, onResult]);

  const analyzeImage = (imageData: string) => {
    setAnalysis({ status: 'analyzing', confidence: 0, issues: [] });
    
    // Simulate AI analysis
    setTimeout(() => {
      const mockAnalysis: AnalysisResult = {
        status: Math.random() > 0.4 ? 'authentic' : 'suspicious',
        confidence: Math.round((Math.random() * 30 + 70) * 100) / 100,
        issues: Math.random() > 0.5 ? [] : [
          'Inconsistent tablet color',
          'Packaging font irregularities'
        ],
        drugName: 'Paracetamol 500mg'
      };
      setAnalysis(mockAnalysis);
    }, 2000);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageData = e.target?.result as string;
        setCapturedImage(imageData);
        analyzeImage(imageData);
        onResult(imageData);
      };
      reader.readAsDataURL(file);
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    setAnalysis(null);
    startCamera();
  };

  const getStatusIcon = () => {
    if (!analysis) return null;
    switch (analysis.status) {
      case 'authentic':
        return <CheckCircle className="h-6 w-6 text-success" />;
      case 'suspicious':
        return <AlertTriangle className="h-6 w-6 text-warning" />;
      default:
        return <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />;
    }
  };

  const getStatusBadge = () => {
    if (!analysis) return null;
    switch (analysis.status) {
      case 'authentic':
        return <Badge className="bg-success text-success-foreground">Likely Authentic</Badge>;
      case 'suspicious':
        return <Badge className="bg-warning text-warning-foreground">Requires Review</Badge>;
      case 'analyzing':
        return <Badge variant="outline">Analyzing...</Badge>;
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-strong">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Photo Analysis
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {!capturedImage ? (
            <>
              {cameraActive ? (
                <div className="space-y-4">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-48 object-cover rounded-lg bg-muted"
                  />
                  <div className="flex gap-2">
                    <Button onClick={capturePhoto} className="flex-1">
                      <Camera className="mr-2 h-4 w-4" />
                      Capture
                    </Button>
                    <Button variant="outline" onClick={stopCamera}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="h-48 bg-muted rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Camera not active</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Button onClick={startCamera} className="w-full">
                      <Camera className="mr-2 h-4 w-4" />
                      Start Camera
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Photo
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-4">
              <img 
                src={capturedImage} 
                alt="Captured medication" 
                className="w-full h-48 object-cover rounded-lg"
              />
              
              {analysis && (
                <div className="space-y-3">
                  <div className="flex items-center justify-center gap-2">
                    {getStatusIcon()}
                    {getStatusBadge()}
                  </div>
                  
                  {analysis.status !== 'analyzing' && (
                    <>
                      {analysis.drugName && (
                        <div className="text-center">
                          <span className="font-medium">Detected:</span> {analysis.drugName}
                        </div>
                      )}
                      
                      <div className="text-center text-sm">
                        <span className="font-medium">Confidence:</span> {analysis.confidence}%
                      </div>
                      
                      {analysis.issues.length > 0 && (
                        <div className="space-y-1">
                          <div className="font-medium text-sm">Issues Detected:</div>
                          {analysis.issues.map((issue, index) => (
                            <div key={index} className="text-xs text-muted-foreground">
                              • {issue}
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={retakePhoto}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Retake
                </Button>
                <Button variant="default" className="flex-1" onClick={onClose}>
                  Done
                </Button>
              </div>
            </div>
          )}
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
          <canvas ref={canvasRef} className="hidden" />
        </CardContent>
      </Card>
    </div>
  );
}