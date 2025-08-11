import { useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Camera, RotateCcw, CheckCircle, AlertTriangle, Upload } from 'lucide-react';
import { aiDrugAnalysis, type DrugAnalysisResult } from '@/services/aiDrugAnalysis';

interface PhotoCaptureProps {
  onResult: (imageData: string) => void;
  onClose: () => void;
}

interface AnalysisResult {
  status: 'authentic' | 'suspicious' | 'counterfeit' | 'analyzing';
  confidence: number;
  issues: string[];
  drugName?: string;
  extractedText?: string[];
  visualFeatures?: {
    color: string;
    shape: string;
    markings: string[];
  };
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

  const analyzeImage = async (imageData: string) => {
    setAnalysis({ status: 'analyzing', confidence: 0, issues: [] });
    
    try {
      // Use real AI analysis service
      const result: DrugAnalysisResult = await aiDrugAnalysis.analyzeImage(imageData);
      
      const analysisResult: AnalysisResult = {
        status: result.status,
        confidence: Math.round(result.confidence * 100),
        issues: result.issues,
        drugName: result.drugName,
        extractedText: result.extractedText,
        visualFeatures: result.visualFeatures
      };
      
      setAnalysis(analysisResult);
    } catch (error) {
      console.error('Analysis failed:', error);
      setAnalysis({
        status: 'suspicious',
        confidence: 0,
        issues: ['Analysis failed', 'Please try again with better lighting'],
        drugName: 'Unknown'
      });
    }
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
                <Card className="mt-4">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        📊 Photo Analysis
                        {analysis.status === 'authentic' && <CheckCircle className="w-5 h-5 text-green-500" />}
                        {analysis.status === 'suspicious' && <AlertTriangle className="w-5 h-5 text-yellow-500" />}
                        {analysis.status === 'counterfeit' && <AlertTriangle className="w-5 h-5 text-red-500" />}
                      </CardTitle>
                      <Badge 
                        variant={
                          analysis.status === 'authentic' ? 'default' : 
                          analysis.status === 'suspicious' ? 'secondary' : 'destructive'
                        }
                        className={
                          analysis.status === 'authentic' ? 'bg-green-500 hover:bg-green-600' :
                          analysis.status === 'suspicious' ? 'bg-yellow-500 hover:bg-yellow-600' :
                          'bg-red-500 hover:bg-red-600'
                        }
                      >
                        {analysis.status === 'authentic' && '✓ Likely Authentic'}
                        {analysis.status === 'suspicious' && '⚠ Suspicious'}
                        {analysis.status === 'counterfeit' && '✗ Likely Counterfeit'}
                        {analysis.status === 'analyzing' && '🔄 Analyzing...'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {analysis.drugName && analysis.status !== 'analyzing' && (
                      <div>
                        <p className="text-sm font-medium text-gray-600">Detected:</p>
                        <p className="text-lg font-semibold">{analysis.drugName}</p>
                      </div>
                    )}
                    
                    {analysis.confidence > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-600">Confidence:</p>
                        <p className="text-lg font-semibold">{analysis.confidence}%</p>
                      </div>
                    )}

                    {analysis.extractedText && analysis.extractedText.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-600">Extracted Text:</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {analysis.extractedText.map((text, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {text}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {analysis.visualFeatures && (
                      <div>
                        <p className="text-sm font-medium text-gray-600">Visual Features:</p>
                        <div className="grid grid-cols-2 gap-2 mt-1 text-sm">
                          <div>Color: <span className="font-medium">{analysis.visualFeatures.color}</span></div>
                          <div>Shape: <span className="font-medium">{analysis.visualFeatures.shape}</span></div>
                        </div>
                        {analysis.visualFeatures.markings.length > 0 && (
                          <div className="mt-1">
                            <span className="text-sm text-gray-600">Markings: </span>
                            {analysis.visualFeatures.markings.map((marking, index) => (
                              <Badge key={index} variant="outline" className="text-xs ml-1">
                                {marking}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {analysis.issues.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-600">Issues Detected:</p>
                        <ul className="text-sm text-gray-700 mt-1 space-y-1">
                          {analysis.issues.map((issue, index) => (
                            <li key={index} className="flex items-center gap-2">
                              <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                              {issue}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    <div className="flex gap-2 pt-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                          setCapturedImage(null);
                          setAnalysis(null);
                          startCamera();
                        }}
                      >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Retake
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={onClose}
                      >
                        Done
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}


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