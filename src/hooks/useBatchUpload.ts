import { useState, useCallback, useEffect, useRef } from 'react';
import { UploadResponse, ValidationResult, UploadProgress, UploadStatus } from '@/lib/types';
import { validateFileSize, validateFileType, generateCSVTemplate } from '@/lib/validation';

interface UseBatchUploadReturn {
  // State
  isUploading: boolean;
  uploadProgress: UploadProgress | null;
  uploadResult: UploadResponse | null;
  error: string | null;
  
  // Actions
  uploadFile: (file: File) => Promise<void>;
  validateFile: (file: File) => { isValid: boolean; errors: string[] };
  downloadTemplate: () => void;
  resetUpload: () => void;
}

export function useBatchUpload(): UseBatchUploadReturn {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [uploadResult, setUploadResult] = useState<UploadResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentUploadId, setCurrentUploadId] = useState<string | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Function to poll progress from the backend
  const pollProgress = useCallback(async (uploadId: string) => {
    try {
      const response = await fetch(`/api/manufacturer/upload-progress?uploadId=${uploadId}`);
      if (response.ok) {
        const progress = await response.json();
        setUploadProgress({
          stage: progress.stage,
          progress: progress.progress,
          message: progress.message,
          details: `Processed: ${progress.processedQuantity}/${progress.totalQuantity} | Time remaining: ${progress.estimatedTimeRemaining}s`
        });
        
        if (progress.isComplete) {
          // Stop polling when complete
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = null;
          }
          setCurrentUploadId(null);
        }
        
        if (progress.error) {
          setError(progress.error);
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = null;
          }
          setCurrentUploadId(null);
        }
      }
    } catch (error) {
      console.error('Error polling progress:', error);
    }
  }, []);

  const validateFile = useCallback((file: File): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // Validate file type
    const fileTypeErrors = validateFileType(file);
    if (fileTypeErrors.length > 0) {
      errors.push(fileTypeErrors[0].message);
    }

    // Validate file size
    const fileSizeErrors = validateFileSize(file);
    if (fileSizeErrors.length > 0) {
      errors.push(fileSizeErrors[0].message);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }, []);

  const uploadFile = useCallback(async (file: File) => {
    try {
      setIsUploading(true);
      setError(null);
      setUploadResult(null);

      // Validate file first
      const validation = validateFile(file);
      if (!validation.isValid) {
        setError(validation.errors[0]);
        return;
      }

      // Read file content
      setUploadProgress({
        stage: 'validation',
        progress: 10,
        message: 'Reading file content...'
      });

      const fileContent = await readFileAsText(file);

      setUploadProgress({
        stage: 'validation',
        progress: 30,
        message: 'Validating file format...'
      });

      // Prepare upload data
      const uploadData = {
        fileContent,
        fileName: file.name,
        fileSize: file.size
      };

      // Get user info from localStorage (in a real app, this would come from auth context)
      const userRole = localStorage.getItem('userRole');
      const userEmail = localStorage.getItem('userEmail');

      if (!userRole || !userEmail) {
        throw new Error('User authentication required');
      }

      setUploadProgress({
        stage: 'processing',
        progress: 50,
        message: 'Validating batch data...'
      });

      // Simulate validation time based on file size
      const validationDelay = Math.min(file.size / 1024, 2000); // Max 2 seconds
      await new Promise(resolve => setTimeout(resolve, validationDelay));

      setUploadProgress({
        stage: 'processing',
        progress: 60,
        message: 'Preparing blockchain transaction...'
      });

      // Make API request
      const response = await fetch('/api/manufacturer/upload-batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': userRole,
          'x-user-email': userEmail
        },
        body: JSON.stringify(uploadData)
      });

      setUploadProgress({
        stage: 'blockchain',
        progress: 70,
        message: 'Recording on blockchain...'
      });

      // Get the response
      const result: UploadResponse = await response.json();

      // Start polling for progress updates
      setCurrentUploadId(result.uploadId);
      
      // Start polling every 2 seconds
      progressIntervalRef.current = setInterval(() => {
        pollProgress(result.uploadId);
      }, 2000);
      
      // Initial poll
      pollProgress(result.uploadId);
      
      // Wait for completion by polling until done
      while (currentUploadId) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        if (error) {
          throw new Error(error);
        }
      }
      
      setUploadResult(result);

      // Store in upload history (in a real app, this would be managed by a global state)
      const uploadHistory = JSON.parse(localStorage.getItem('uploadHistory') || '[]');
      const newUpload = {
        id: result.uploadId,
        fileName: file.name,
        drug: result.validationResult.data[0]?.drug_name || 'Unknown',
        quantity: result.validationResult.data.reduce((sum, row) => sum + parseInt(row.quantity.toString()), 0),
        status: result.status,
        date: new Date().toISOString(),
        size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
        records: result.validationResult.totalRows,
        blockchainTx: result.blockchainTx?.hash,
        manufacturer: userEmail,
        uploadProgress: 100,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      uploadHistory.unshift(newUpload);
      localStorage.setItem('uploadHistory', JSON.stringify(uploadHistory.slice(0, 50))); // Keep last 50 uploads

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      console.error('Upload error:', err);
      
      setError(errorMessage);
      setUploadProgress({
        stage: 'validation',
        progress: 0,
        message: 'Upload failed',
        details: errorMessage
      });
    } finally {
      // Clean up progress polling
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      setCurrentUploadId(null);
      setIsUploading(false);
    }
  }, [validateFile]);

  const downloadTemplate = useCallback(() => {
    const template = generateCSVTemplate();
    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'batch-upload-template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, []);

  const resetUpload = useCallback(() => {
    setIsUploading(false);
    setUploadProgress(null);
    setUploadResult(null);
    setError(null);
  }, []);

  return {
    isUploading,
    uploadProgress,
    uploadResult,
    error,
    uploadFile,
    validateFile,
    downloadTemplate,
    resetUpload
  };
}

// Helper function to read file as text
function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === 'string') {
        resolve(result);
      } else {
        reject(new Error('Failed to read file as text'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
} 