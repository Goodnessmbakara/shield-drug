import React, { useState, useRef } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Progress } from '../ui/progress';
import { Loader2, Upload, Camera, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface DrugIdentificationResult {
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
    batchNumber?: string;
    expiryDate?: string;
  };
  blockchainVerification?: {
    verified: boolean;
    transactionHash?: string;
    blockNumber?: number;
  };
}

export default function DrugImageRecognition() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<DrugIdentificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      setError('Image file size must be less than 10MB');
      return;
    }

    // Display uploaded image
    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadedImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Analyze the image
    await analyzeDrugImage(file);
  };

  const analyzeDrugImage = async (file: File) => {
    setIsAnalyzing(true);
    setError(null);
    setAnalysisResult(null);

    try {
      const formData = new FormData();
      formData.append('drugImage', file);

      const response = await fetch('/api/ai/drug-recognition', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to analyze drug image');
      }

      const result = await response.json();
      setAnalysisResult(result.data.analysis);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during analysis');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCameraCapture = () => {
    // In a real implementation, this would open the camera
    alert('Camera capture feature would be implemented here');
  };

  const getAuthenticityColor = (isAuthentic: boolean, counterfeitRisk: number) => {
    if (isAuthentic && counterfeitRisk < 0.3) return 'text-green-600';
    if (isAuthentic && counterfeitRisk < 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getAuthenticityIcon = (isAuthentic: boolean, counterfeitRisk: number) => {
    if (isAuthentic && counterfeitRisk < 0.3) return <CheckCircle className="w-5 h-5 text-green-600" />;
    if (isAuthentic && counterfeitRisk < 0.6) return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
    return <XCircle className="w-5 h-5 text-red-600" />;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            AI Drug Image Recognition
          </CardTitle>
          <CardDescription>
            Upload a drug image to identify the medication and detect potential counterfeits using AI
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Upload Section */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            
            <div className="space-y-4">
              <div className="flex justify-center">
                <Upload className="w-12 h-12 text-gray-400" />
              </div>
              
              <div>
                <h3 className="text-lg font-medium">Upload Drug Image</h3>
                <p className="text-sm text-gray-500">
                  Upload an image of the drug package, pills, or label for AI analysis
                </p>
              </div>

              <div className="flex gap-2 justify-center">
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isAnalyzing}
                  className="flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Choose Image
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCameraCapture}
                  disabled={isAnalyzing}
                  className="flex items-center gap-2"
                >
                  <Camera className="w-4 h-4" />
                  Take Photo
                </Button>
              </div>

              <p className="text-xs text-gray-400">
                Supported formats: JPG, PNG, GIF (Max 10MB)
              </p>
            </div>
          </div>

          {/* Uploaded Image Preview */}
          {uploadedImage && (
            <div className="space-y-2">
              <h4 className="font-medium">Uploaded Image:</h4>
              <img
                src={uploadedImage}
                alt="Uploaded drug"
                className="max-w-full h-48 object-contain border rounded-lg"
              />
            </div>
          )}

          {/* Loading State */}
          {isAnalyzing && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Analyzing drug image with AI...</span>
              </div>
              <Progress value={75} className="w-full" />
              <p className="text-sm text-gray-500">
                Performing OCR, image analysis, and counterfeit detection...
              </p>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Analysis Results */}
      {analysisResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getAuthenticityIcon(analysisResult.isAuthentic, analysisResult.counterfeitRisk)}
              Analysis Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Drug Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">Drug Information</h4>
                <div className="space-y-1 text-sm">
                  <div><span className="font-medium">Name:</span> {analysisResult.drugName}</div>
                  <div><span className="font-medium">Generic:</span> {analysisResult.genericName}</div>
                  <div><span className="font-medium">Dosage:</span> {analysisResult.dosage}</div>
                  <div><span className="font-medium">Manufacturer:</span> {analysisResult.manufacturer}</div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">AI Analysis</h4>
                <div className="space-y-1 text-sm">
                  <div><span className="font-medium">Confidence:</span> {(analysisResult.confidence * 100).toFixed(1)}%</div>
                  <div><span className="font-medium">Counterfeit Risk:</span> {(analysisResult.counterfeitRisk * 100).toFixed(1)}%</div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Authenticity:</span>
                    <Badge 
                      variant={analysisResult.isAuthentic ? "default" : "destructive"}
                      className={getAuthenticityColor(analysisResult.isAuthentic, analysisResult.counterfeitRisk)}
                    >
                      {analysisResult.isAuthentic ? 'Authentic' : 'Potential Counterfeit'}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Detected Features */}
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">Detected Features</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <Badge variant="outline">Package: {analysisResult.detectedFeatures.packageType}</Badge>
                <Badge variant="outline">Shape: {analysisResult.detectedFeatures.pillShape}</Badge>
                <Badge variant="outline">Color: {analysisResult.detectedFeatures.pillColor}</Badge>
                {analysisResult.detectedFeatures.batchNumber && (
                  <Badge variant="outline">Batch: {analysisResult.detectedFeatures.batchNumber}</Badge>
                )}
              </div>
              {analysisResult.detectedFeatures.markings.length > 0 && (
                <div className="flex gap-1 flex-wrap">
                  <span className="text-sm font-medium">Markings:</span>
                  {analysisResult.detectedFeatures.markings.map((marking, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {marking}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Active Ingredients */}
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">Active Ingredients</h4>
              <div className="flex gap-1 flex-wrap">
                {analysisResult.activeIngredients.map((ingredient, index) => (
                  <Badge key={index} variant="outline">
                    {ingredient}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Blockchain Verification */}
            {analysisResult.blockchainVerification && (
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">Blockchain Verification</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Status:</span>
                    <Badge variant={analysisResult.blockchainVerification.verified ? "default" : "destructive"}>
                      {analysisResult.blockchainVerification.verified ? 'Verified' : 'Not Verified'}
                    </Badge>
                  </div>
                  {analysisResult.blockchainVerification.transactionHash && (
                    <div><span className="font-medium">Transaction:</span> {analysisResult.blockchainVerification.transactionHash}</div>
                  )}
                  {analysisResult.blockchainVerification.blockNumber && (
                    <div><span className="font-medium">Block:</span> {analysisResult.blockchainVerification.blockNumber}</div>
                  )}
                </div>
              </div>
            )}

            {/* Security Recommendations */}
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">Security Recommendations</h4>
              {analysisResult.isAuthentic ? (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    This drug appears to be authentic. However, always verify with official sources and consult healthcare professionals.
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>
                    This drug shows signs of being counterfeit. Do not consume and report to authorities immediately.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 