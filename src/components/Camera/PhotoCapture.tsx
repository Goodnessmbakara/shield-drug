import { useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  X,
  Camera,
  RotateCcw,
  CheckCircle,
  AlertTriangle,
  Upload,
  Trash2,
} from "lucide-react";
import {
  aiDrugAnalysis,
  type DrugAnalysisResult,
} from "@/services/aiDrugAnalysis";

interface PhotoCaptureProps {
  onResult: (imageData: string) => void;
  onClose: () => void;
}

interface AnalysisResult {
  status:
    | "authentic"
    | "suspicious"
    | "counterfeit"
    | "not_a_drug"
    | "analyzing";
  confidence: number;
  issues: string[];
  drugName?: string;
  extractedText?: string[];
  visualFeatures?: {
    color: string;
    shape: string;
    markings: string[];
  };
  isDrugImage?: boolean;
  imageClassification?: {
    isPharmaceutical: boolean;
    detectedObjects: string[];
    confidence: number;
  };
}

interface UploadedPhoto {
  id: string;
  imageData: string;
  fileName: string;
  analysis: AnalysisResult | null;
}

export default function PhotoCapture({ onResult, onClose }: PhotoCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [uploadedPhotos, setUploadedPhotos] = useState<UploadedPhoto[]>([]);

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
        setCameraActive(true);
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
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

      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const imageData = canvas.toDataURL("image/jpeg", 0.8);
        setCapturedImage(imageData);
        stopCamera();
        analyzeImage(imageData);
        onResult(imageData);
      }
    }
  }, [stopCamera, onResult]);

  const analyzeImage = async (imageData: string) => {
    setAnalysis({ status: "analyzing", confidence: 0, issues: [] });

    try {
      // Use real AI analysis service
      const result: DrugAnalysisResult = await aiDrugAnalysis.analyzeImage(
        imageData
      );

      const analysisResult: AnalysisResult = {
        status: result.status,
        confidence: Math.round(result.confidence * 100),
        issues: result.issues,
        drugName: result.drugName,
        extractedText: result.extractedText,
        visualFeatures: result.visualFeatures,
        isDrugImage: result.isDrugImage,
        imageClassification: result.imageClassification,
      };

      setAnalysis(analysisResult);
    } catch (error) {
      console.error("Analysis failed:", error);
      setAnalysis({
        status: "suspicious",
        confidence: 0,
        issues: ["Analysis failed", "Please try again with better lighting"],
        drugName: "Unknown",
      });
    }
  };

  const analyzeUploadedImage = async (photoId: string, imageData: string) => {
    setUploadedPhotos((prev) =>
      prev.map((photo) =>
        photo.id === photoId
          ? {
              ...photo,
              analysis: { status: "analyzing", confidence: 0, issues: [] },
            }
          : photo
      )
    );

    try {
      // Use real AI analysis service
      const result: DrugAnalysisResult = await aiDrugAnalysis.analyzeImage(
        imageData
      );

      const analysisResult: AnalysisResult = {
        status: result.status,
        confidence: Math.round(result.confidence * 100),
        issues: result.issues,
        drugName: result.drugName,
        extractedText: result.extractedText,
        visualFeatures: result.visualFeatures,
        isDrugImage: result.isDrugImage,
        imageClassification: result.imageClassification,
      };

      setUploadedPhotos((prev) =>
        prev.map((photo) =>
          photo.id === photoId ? { ...photo, analysis: analysisResult } : photo
        )
      );
    } catch (error) {
      console.error("Analysis failed:", error);
      setUploadedPhotos((prev) =>
        prev.map((photo) =>
          photo.id === photoId
            ? {
                ...photo,
                analysis: {
                  status: "suspicious",
                  confidence: 0,
                  issues: [
                    "Analysis failed",
                    "Please try again with better lighting",
                  ],
                  drugName: "Unknown",
                },
              }
            : photo
        )
      );
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      Array.from(files).forEach((file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const imageData = e.target?.result as string;
          const photoId = `photo_${Date.now()}_${Math.random()}`;
          const newPhoto: UploadedPhoto = {
            id: photoId,
            imageData,
            fileName: file.name,
            analysis: null,
          };

          setUploadedPhotos((prev) => [...prev, newPhoto]);
          analyzeUploadedImage(photoId, imageData);
          onResult(imageData);
        };
        reader.readAsDataURL(file);
      });
    }
    // Reset the input value to allow selecting the same files again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removePhoto = (photoId: string) => {
    setUploadedPhotos((prev) => prev.filter((photo) => photo.id !== photoId));
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    setAnalysis(null);
    startCamera();
  };

  const getStatusIcon = () => {
    if (!analysis) return null;
    switch (analysis.status) {
      case "authentic":
        return <CheckCircle className="h-6 w-6 text-success" />;
      case "suspicious":
        return <AlertTriangle className="h-6 w-6 text-warning" />;
      default:
        return (
          <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        );
    }
  };

  const getStatusBadge = () => {
    if (!analysis) return null;
    switch (analysis.status) {
      case "authentic":
        return (
          <Badge className="bg-success text-success-foreground">
            Likely Authentic
          </Badge>
        );
      case "suspicious":
        return (
          <Badge className="bg-warning text-warning-foreground">
            Requires Review
          </Badge>
        );
      case "counterfeit":
        return <Badge variant="destructive">Counterfeit</Badge>;
      case "not_a_drug":
        return (
          <Badge className="bg-muted text-muted-foreground">Not a Drug</Badge>
        );
      case "analyzing":
        return <Badge variant="outline">Analyzing...</Badge>;
    }
  };

  const getPhotoStatusIcon = (analysis: AnalysisResult | null) => {
    if (!analysis) return null;
    switch (analysis.status) {
      case "authentic":
        return <CheckCircle className="h-4 w-4 text-success" />;
      case "suspicious":
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      case "counterfeit":
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case "not_a_drug":
        return <X className="h-4 w-4 text-muted-foreground" />;
      default:
        return (
          <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        );
    }
  };

  const getPhotoStatusBadge = (analysis: AnalysisResult | null) => {
    if (!analysis) return null;
    switch (analysis.status) {
      case "authentic":
        return (
          <Badge className="bg-success text-success-foreground text-xs">
            Authentic
          </Badge>
        );
      case "suspicious":
        return (
          <Badge className="bg-warning text-warning-foreground text-xs">
            Suspicious
          </Badge>
        );
      case "counterfeit":
        return (
          <Badge variant="destructive" className="text-xs">
            Counterfeit
          </Badge>
        );
      case "not_a_drug":
        return (
          <Badge className="bg-muted text-muted-foreground text-xs">
            Not a Drug
          </Badge>
        );
      case "analyzing":
        return (
          <Badge variant="outline" className="text-xs">
            Analyzing...
          </Badge>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] shadow-strong overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Photo Analysis
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4 overflow-y-auto max-h-[calc(90vh-120px)]">
          {!capturedImage && uploadedPhotos.length === 0 ? (
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
                      <p className="text-sm text-muted-foreground">
                        Camera not active
                      </p>
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
                      Upload Photos
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-4">
              {/* Camera captured image */}
              {capturedImage && (
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
                            {analysis.status === "authentic" && (
                              <CheckCircle className="w-5 h-5 text-green-500" />
                            )}
                            {analysis.status === "suspicious" && (
                              <AlertTriangle className="w-5 h-5 text-yellow-500" />
                            )}
                            {analysis.status === "counterfeit" && (
                              <AlertTriangle className="w-5 h-5 text-red-500" />
                            )}
                          </CardTitle>
                          <Badge
                            variant={
                              analysis.status === "authentic"
                                ? "default"
                                : analysis.status === "suspicious"
                                ? "secondary"
                                : "destructive"
                            }
                            className={
                              analysis.status === "authentic"
                                ? "bg-green-500 hover:bg-green-600"
                                : analysis.status === "suspicious"
                                ? "bg-yellow-500 hover:bg-yellow-600"
                                : "bg-red-500 hover:bg-red-600"
                            }
                          >
                            {analysis.status === "authentic" &&
                              "✓ Likely Authentic"}
                            {analysis.status === "suspicious" && "⚠ Suspicious"}
                            {analysis.status === "counterfeit" &&
                              "✗ Likely Counterfeit"}
                            {analysis.status === "analyzing" &&
                              "🔄 Analyzing..."}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {analysis.drugName &&
                          analysis.status !== "analyzing" && (
                            <div>
                              <p className="text-sm font-medium text-gray-600">
                                Detected:
                              </p>
                              <p className="text-lg font-semibold">
                                {analysis.drugName}
                              </p>
                            </div>
                          )}

                        {analysis.confidence > 0 && (
                          <div>
                            <p className="text-sm font-medium text-gray-600">
                              Confidence:
                            </p>
                            <p className="text-lg font-semibold">
                              {analysis.confidence}%
                            </p>
                          </div>
                        )}

                        {analysis.extractedText &&
                          analysis.extractedText.length > 0 && (
                            <div>
                              <p className="text-sm font-medium text-gray-600">
                                Extracted Text:
                              </p>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {analysis.extractedText.map((text, index) => (
                                  <Badge
                                    key={index}
                                    variant="outline"
                                    className="text-xs"
                                  >
                                    {text}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                        {analysis.visualFeatures && (
                          <div>
                            <p className="text-sm font-medium text-gray-600">
                              Visual Features:
                            </p>
                            <div className="grid grid-cols-2 gap-2 mt-1 text-sm">
                              <div>
                                Color:{" "}
                                <span className="font-medium">
                                  {analysis.visualFeatures.color}
                                </span>
                              </div>
                              <div>
                                Shape:{" "}
                                <span className="font-medium">
                                  {analysis.visualFeatures.shape}
                                </span>
                              </div>
                            </div>
                            {analysis.visualFeatures.markings.length > 0 && (
                              <div className="mt-1">
                                <span className="text-sm text-gray-600">
                                  Markings:{" "}
                                </span>
                                {analysis.visualFeatures.markings.map(
                                  (marking, index) => (
                                    <Badge
                                      key={index}
                                      variant="outline"
                                      className="text-xs ml-1"
                                    >
                                      {marking}
                                    </Badge>
                                  )
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {analysis.issues.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-gray-600">
                              {analysis.status === "not_a_drug"
                                ? "Why this image was rejected:"
                                : "Issues Detected:"}
                            </p>
                            <ul className="text-sm text-gray-700 mt-1 space-y-1">
                              {analysis.issues.map((issue, index) => (
                                <li
                                  key={index}
                                  className="flex items-center gap-2"
                                >
                                  <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                                  {issue}
                                </li>
                              ))}
                            </ul>

                            {analysis.status === "not_a_drug" && (
                              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <p className="text-sm font-medium text-blue-800 mb-2">
                                  💡 How to take a good drug photo:
                                </p>
                                <ul className="text-xs text-blue-700 space-y-1">
                                  <li>
                                    • Focus on the medication packaging or
                                    tablets
                                  </li>
                                  <li>
                                    • Ensure good lighting and clear focus
                                  </li>
                                  <li>
                                    • Include text showing drug name, dosage,
                                    and manufacturer
                                  </li>
                                  <li>
                                    • Avoid personal photos, logos, or
                                    non-medical objects
                                  </li>
                                  <li>
                                    • Make sure the image shows pharmaceutical
                                    information clearly
                                  </li>
                                </ul>
                              </div>
                            )}
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
                          <Button size="sm" onClick={onClose}>
                            Done
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {/* Uploaded photos */}
              {uploadedPhotos.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">
                      Uploaded Photos ({uploadedPhotos.length})
                    </h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Add More
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {uploadedPhotos.map((photo) => (
                      <Card key={photo.id} className="relative">
                        <CardContent className="p-4">
                          <div className="relative">
                            <img
                              src={photo.imageData}
                              alt={photo.fileName}
                              className="w-full h-32 object-cover rounded-lg"
                            />
                            <Button
                              variant="destructive"
                              size="sm"
                              className="absolute top-2 right-2 h-6 w-6 p-0"
                              onClick={() => removePhoto(photo.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>

                          <div className="mt-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium truncate">
                                {photo.fileName}
                              </p>
                              {getPhotoStatusIcon(photo.analysis)}
                            </div>

                            {getPhotoStatusBadge(photo.analysis)}

                            {photo.analysis &&
                              photo.analysis.status !== "analyzing" && (
                                <div className="space-y-1 text-xs">
                                  {photo.analysis.drugName && (
                                    <p>
                                      <span className="font-medium">Drug:</span>{" "}
                                      {photo.analysis.drugName}
                                    </p>
                                  )}
                                  {photo.analysis.confidence > 0 && (
                                    <p>
                                      <span className="font-medium">
                                        Confidence:
                                      </span>{" "}
                                      {photo.analysis.confidence}%
                                    </p>
                                  )}
                                  {photo.analysis.issues.length > 0 && (
                                    <p className="text-red-600">
                                      <span className="font-medium">
                                        Issues:
                                      </span>{" "}
                                      {photo.analysis.issues[0]}
                                      {photo.analysis.issues.length > 1 &&
                                        ` (+${
                                          photo.analysis.issues.length - 1
                                        } more)`}
                                    </p>
                                  )}
                                </div>
                              )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {uploadedPhotos.length > 0 && !capturedImage && (
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setUploadedPhotos([]);
                          startCamera();
                        }}
                      >
                        <Camera className="w-4 h-4 mr-2" />
                        Take Photo
                      </Button>
                      <Button size="sm" onClick={onClose}>
                        Done
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileUpload}
            className="hidden"
          />
          <canvas ref={canvasRef} className="hidden" />
        </CardContent>
      </Card>
    </div>
  );
}
