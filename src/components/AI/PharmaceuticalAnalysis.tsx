import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  Camera,
  Upload,
  Shield,
  Pill,
  FileText,
  Eye,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PharmaceuticalAnalysisResult {
  drugName: string;
  genericName: string;
  dosage: string;
  manufacturer: string;
  activeIngredients: string[];
  confidence: number;
  isAuthentic: boolean;
  counterfeitRisk: number;
  detectedFeatures: {
    packageType: string;
    pillShape: string;
    pillColor: string;
    markings: string[];
  };
  textExtraction: {
    extractedText: string[];
    confidence: number;
    method: string;
  };
  imageClassification: {
    isPharmaceutical: boolean;
    confidence: number;
    detectedObjects: string[];
  };
  blockchainVerification: {
    isVerified: boolean;
    batchId?: string;
    manufacturer?: string;
    expiryDate?: string;
  };
}

interface PharmaceuticalAnalysisProps {
  imageData: string;
  onResult: (result: PharmaceuticalAnalysisResult) => void;
  onClose: () => void;
}

export default function PharmaceuticalAnalysis({ 
  imageData, 
  onResult, 
  onClose 
}: PharmaceuticalAnalysisProps) {
  const { toast } = useToast();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<PharmaceuticalAnalysisResult | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const analyzeImage = useCallback(async () => {
    setIsAnalyzing(true);
    setAnalysisProgress(0);
    setAnalysisError(null);

    try {
      // Convert base64 to blob for upload
      const response = await fetch(imageData);
      const blob = await response.blob();
      
      // Create form data
      const formData = new FormData();
      formData.append('pharmaceuticalImage', blob, 'pharmaceutical-image.jpg');

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setAnalysisProgress(prev => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 10;
        });
      }, 200);

      // Call the new pharmaceutical analysis API
      const apiResponse = await fetch('/api/ai/pharmaceutical-analysis', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setAnalysisProgress(100);

      if (!apiResponse.ok) {
        const errorData = await apiResponse.json();
        throw new Error(errorData.message || 'Analysis failed');
      }

      const data = await apiResponse.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Analysis failed');
      }

      const result = data.data.analysis;
      setAnalysisResult(result);
      onResult(result);

      toast({
        title: "Analysis Complete",
        description: `Drug identified: ${result.drugName} (${result.confidence * 100}% confidence)`,
      });

    } catch (error) {
      console.error('Pharmaceutical analysis failed:', error);
      setAnalysisError(error instanceof Error ? error.message : 'Analysis failed');
      
      toast({
        title: "Analysis Failed",
        description: "Unable to analyze the pharmaceutical image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  }, [imageData, onResult, toast]);

  const getStatusIcon = (result: PharmaceuticalAnalysisResult) => {
    if (result.isAuthentic && result.confidence > 0.7) {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    } else if (result.counterfeitRisk > 0.5) {
      return <XCircle className="h-5 w-5 text-red-500" />;
    } else {
      return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusText = (result: PharmaceuticalAnalysisResult) => {
    if (result.isAuthentic && result.confidence > 0.7) {
      return "Authentic";
    } else if (result.counterfeitRisk > 0.5) {
      return "Suspicious";
    } else {
      return "Unknown";
    }
  };

  const getStatusColor = (result: PharmaceuticalAnalysisResult) => {
    if (result.isAuthentic && result.confidence > 0.7) {
      return "bg-green-100 text-green-800";
    } else if (result.counterfeitRisk > 0.5) {
      return "bg-red-100 text-red-800";
    } else {
      return "bg-yellow-100 text-yellow-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Analysis Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Pill className="h-5 w-5" />
            Pharmaceutical Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!analysisResult && !analysisError && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Analyze this pharmaceutical image using advanced AI models for drug identification, 
                counterfeit detection, and authenticity verification.
              </p>
              <Button 
                onClick={analyzeImage} 
                disabled={isAnalyzing}
                className="w-full"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-4 w-4" />
                    Start Analysis
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Progress Bar */}
          {isAnalyzing && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Analyzing pharmaceutical image...</span>
                <span>{Math.round(analysisProgress)}%</span>
              </div>
              <Progress value={analysisProgress} className="w-full" />
            </div>
          )}

          {/* Error Display */}
          {analysisError && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-red-600">
                <XCircle className="h-5 w-5" />
                <span className="font-medium">Analysis Failed</span>
              </div>
              <p className="text-sm text-gray-600">{analysisError}</p>
              <Button 
                onClick={analyzeImage} 
                variant="outline" 
                className="w-full"
              >
                Try Again
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Analysis Results */}
      {analysisResult && (
        <div className="space-y-4">
          {/* Main Result Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  {getStatusIcon(analysisResult)}
                  Analysis Results
                </CardTitle>
                <Badge className={getStatusColor(analysisResult)}>
                  {getStatusText(analysisResult)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Drug Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Drug Name</label>
                  <p className="text-lg font-semibold">{analysisResult.drugName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Generic Name</label>
                  <p className="text-lg font-semibold">{analysisResult.genericName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Dosage</label>
                  <p className="text-lg font-semibold">{analysisResult.dosage}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Manufacturer</label>
                  <p className="text-lg font-semibold">{analysisResult.manufacturer}</p>
                </div>
              </div>

              {/* Confidence and Risk */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Confidence</label>
                  <div className="flex items-center gap-2">
                    <Progress value={analysisResult.confidence * 100} className="flex-1" />
                    <span className="text-sm font-medium">
                      {Math.round(analysisResult.confidence * 100)}%
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Counterfeit Risk</label>
                  <div className="flex items-center gap-2">
                    <Progress value={analysisResult.counterfeitRisk * 100} className="flex-1" />
                    <span className="text-sm font-medium">
                      {Math.round(analysisResult.counterfeitRisk * 100)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Active Ingredients */}
              {analysisResult.activeIngredients.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Active Ingredients</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {analysisResult.activeIngredients.map((ingredient, index) => (
                      <Badge key={index} variant="secondary">
                        {ingredient}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Text Extraction Results */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Text Extraction
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Method: {analysisResult.textExtraction.method}</span>
                  <span>Confidence: {Math.round(analysisResult.textExtraction.confidence * 100)}%</span>
                </div>
                {analysisResult.textExtraction.extractedText.length > 0 ? (
                  <div className="space-y-1">
                    {analysisResult.textExtraction.extractedText.map((text, index) => (
                      <div key={index} className="text-sm bg-gray-50 p-2 rounded">
                        {text}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No text extracted</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Image Classification Results */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Image Classification
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Pharmaceutical: {analysisResult.imageClassification.isPharmaceutical ? 'Yes' : 'No'}</span>
                  <span>Confidence: {Math.round(analysisResult.imageClassification.confidence * 100)}%</span>
                </div>
                {analysisResult.imageClassification.detectedObjects.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Detected Objects</label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {analysisResult.imageClassification.detectedObjects.map((object, index) => (
                        <Badge key={index} variant="outline">
                          {object}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Detected Features */}
          <Card>
            <CardHeader>
              <CardTitle>Detected Features</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Package Type</label>
                  <p className="text-sm">{analysisResult.detectedFeatures.packageType}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Pill Shape</label>
                  <p className="text-sm">{analysisResult.detectedFeatures.pillShape}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Pill Color</label>
                  <p className="text-sm">{analysisResult.detectedFeatures.pillColor}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Markings</label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {analysisResult.detectedFeatures.markings.map((marking, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {marking}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Blockchain Verification */}
          {analysisResult.blockchainVerification && (
            <Card>
              <CardHeader>
                <CardTitle>Blockchain Verification</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  {analysisResult.blockchainVerification.isVerified ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-gray-400" />
                  )}
                  <span className="text-sm">
                    {analysisResult.blockchainVerification.isVerified 
                      ? 'Verified on blockchain' 
                      : 'Not verified on blockchain'
                    }
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button onClick={onClose} variant="outline" className="flex-1">
          Close
        </Button>
        {analysisResult && (
          <Button 
            onClick={() => onResult(analysisResult)} 
            className="flex-1"
          >
            Use Results
          </Button>
        )}
      </div>
    </div>
  );
}
