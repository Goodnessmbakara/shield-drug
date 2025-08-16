// Image preprocessing interface
export interface PreprocessingOptions {
  contrast?: number;
  brightness?: number;
  noiseReduction?: boolean;
  deskew?: boolean;
  resize?: {
    width?: number;
    height?: number;
    maintainAspectRatio?: boolean;
  };
  binarization?: {
    enabled?: boolean;
    threshold?: number;
  };
  enhancement?: {
    sharpen?: boolean;
    blur?: number;
    gamma?: number;
  };
}

// Default pharmaceutical preprocessing options
const DEFAULT_PHARMACEUTICAL_OPTIONS: PreprocessingOptions = {
  contrast: 1.2,
  brightness: 1.1,
  noiseReduction: true,
  deskew: true,
  resize: {
    width: 1200,
    maintainAspectRatio: true
  },
  binarization: {
    enabled: false,
    threshold: 128
  },
  enhancement: {
    sharpen: true,
    blur: 0,
    gamma: 1.0
  }
};

// Environment detection
const isBrowser = typeof window !== 'undefined';

// Browser-side preprocessing using Canvas API
async function preprocessImageBrowser(
  base64Image: string,
  options: PreprocessingOptions = {}
): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      const img = new Image();
      img.onload = () => {
        try {
          // Set canvas dimensions
          const { width, height, maintainAspectRatio } = options.resize || {};
          let targetWidth = width || img.width;
          let targetHeight = height || img.height;

          if (maintainAspectRatio && width) {
            targetHeight = (img.height * width) / img.width;
          } else if (maintainAspectRatio && height) {
            targetWidth = (img.width * height) / img.height;
          }

          canvas.width = targetWidth;
          canvas.height = targetHeight;

          // Apply grayscale conversion for better OCR
          ctx.filter = 'grayscale(100%)';
          ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

          // Apply contrast and brightness adjustments
          const contrast = options.contrast || 1.0;
          const brightness = options.brightness || 1.0;
          
          if (contrast !== 1.0 || brightness !== 1.0) {
            const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
            const data = imageData.data;

            for (let i = 0; i < data.length; i += 4) {
              // Apply contrast and brightness
              data[i] = Math.min(255, Math.max(0, (data[i] - 128) * contrast + 128 + (brightness - 1) * 128));
              data[i + 1] = Math.min(255, Math.max(0, (data[i + 1] - 128) * contrast + 128 + (brightness - 1) * 128));
              data[i + 2] = Math.min(255, Math.max(0, (data[i + 2] - 128) * contrast + 128 + (brightness - 1) * 128));
            }

            ctx.putImageData(imageData, 0, 0);
          }

          // Apply noise reduction if enabled
          if (options.noiseReduction) {
            applyNoiseReduction(ctx, targetWidth, targetHeight);
          }

          // Apply sharpening if enabled
          if (options.enhancement?.sharpen) {
            applySharpening(ctx, targetWidth, targetHeight);
          }

          // Convert back to base64
          const processedBase64 = canvas.toDataURL('image/png', 0.95);
          resolve(processedBase64);

        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = base64Image;

    } catch (error) {
      reject(error);
    }
  });
}

// Apply noise reduction using median filter
function applyNoiseReduction(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const newData = new Uint8ClampedArray(data);

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      const values = [];

      // Collect 3x3 neighborhood values
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nIdx = ((y + dy) * width + (x + dx)) * 4;
          values.push(data[nIdx]);
        }
      }

      // Calculate median
      values.sort((a, b) => a - b);
      const median = values[4]; // Middle value of 9 elements

      newData[idx] = median;
      newData[idx + 1] = median;
      newData[idx + 2] = median;
      newData[idx + 3] = data[idx + 3]; // Preserve alpha
    }
  }

  ctx.putImageData(new ImageData(newData, width, height), 0, 0);
}

// Apply sharpening using unsharp mask
function applySharpening(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const newData = new Uint8ClampedArray(data);

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      
      // Calculate average of neighbors
      let sum = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          const nIdx = ((y + dy) * width + (x + dx)) * 4;
          sum += data[nIdx];
        }
      }
      const avg = sum / 8;

      // Apply sharpening
      const sharpened = Math.min(255, Math.max(0, data[idx] + (data[idx] - avg) * 0.5));
      newData[idx] = sharpened;
      newData[idx + 1] = sharpened;
      newData[idx + 2] = sharpened;
      newData[idx + 3] = data[idx + 3]; // Preserve alpha
    }
  }

  ctx.putImageData(new ImageData(newData, width, height), 0, 0);
}

// Node.js preprocessing using Sharp library
async function preprocessImageNode(
  imageBuffer: Buffer,
  options: PreprocessingOptions = {}
): Promise<Buffer> {
  try {
    // Dynamic import for Sharp to avoid bundling issues
    const sharp = await import('sharp');
    
    let pipeline = sharp.default(imageBuffer);

    // Apply grayscale conversion
    pipeline = pipeline.grayscale();

    // Apply resize if specified
    if (options.resize) {
      const { width, height, maintainAspectRatio } = options.resize;
      if (width || height) {
        pipeline = pipeline.resize(width, height, {
          fit: maintainAspectRatio ? 'inside' : 'fill',
          withoutEnlargement: true
        });
      }
    }

    // Apply brightness
    if (options.brightness !== undefined) {
      const brightness = options.brightness || 1.0;
      pipeline = pipeline.modulate({
        brightness: brightness
      });
    }

    // Comment 11: Implement contrast adjustment in sharp pipeline
    if (options.contrast !== undefined) {
      const contrast = options.contrast || 1.0;
      // Use linear adjustment for contrast with balanced midtones
      const intercept = 0.5; // Keep midtones balanced
      pipeline = pipeline.linear(contrast, intercept);
    }

    // Apply gamma correction
    if (options.enhancement?.gamma) {
      pipeline = pipeline.gamma(options.enhancement.gamma);
    }

    // Apply blur if specified
    if (options.enhancement?.blur && options.enhancement.blur > 0) {
      pipeline = pipeline.blur(options.enhancement.blur);
    }

    // Apply sharpening if enabled
    if (options.enhancement?.sharpen) {
      pipeline = pipeline.sharpen(1, 1, 2);
    }

    // Apply noise reduction if enabled
    if (options.noiseReduction) {
      pipeline = pipeline.median(1);
    }

    // Apply deskewing if enabled
    if (options.deskew) {
      // Sharp doesn't have built-in deskew, but we can apply rotation detection
      // This is a simplified approach - in production you might want more sophisticated deskewing
      pipeline = pipeline.rotate();
    }

    // Apply binarization if enabled
    if (options.binarization?.enabled) {
      const threshold = options.binarization.threshold || 128;
      pipeline = pipeline.threshold(threshold);
    }

    // Convert to PNG with high quality
    return await pipeline.png({ quality: 95 }).toBuffer();

  } catch (error) {
    console.error('Node.js image preprocessing failed:', error);
    // Return original buffer as fallback
    return imageBuffer;
  }
}

// Main preprocessing function
export async function preprocessForOCR(
  input: string | Buffer,
  options: PreprocessingOptions = {}
): Promise<string | Buffer> {
  const config = { ...DEFAULT_PHARMACEUTICAL_OPTIONS, ...options };

  try {
    if (isBrowser) {
      // Browser environment - expect base64 string
      if (typeof input !== 'string') {
        throw new Error('Browser environment expects base64 string input');
      }
      return await preprocessImageBrowser(input, config);
    } else {
      // Node.js environment - expect Buffer
      if (typeof input === 'string') {
        // Convert base64 string to Buffer
        const buffer = Buffer.from(input.replace(/^data:image\/[a-z]+;base64,/, ''), 'base64');
        return await preprocessImageNode(buffer, config);
      } else {
        return await preprocessImageNode(input, config);
      }
    }
  } catch (error) {
    console.error('Image preprocessing failed:', error);
    // Return original input as fallback
    return input;
  }
}

// Quality assessment function - Comment 10: Enhanced to handle Buffer inputs properly
export function assessImageQuality(imageData: string | Buffer): {
  quality: 'excellent' | 'good' | 'fair' | 'poor';
  issues: string[];
  recommendations: string[];
} {
  const issues: string[] = [];
  const recommendations: string[] = [];

  if (isBrowser && typeof imageData === 'string') {
    // Analyze base64 image
    const size = Math.ceil((imageData.length * 3) / 4);
    
    if (size < 10000) {
      issues.push('Image file size is very small, may be low quality');
      recommendations.push('Use higher resolution camera or better lighting');
    }
    
    if (size > 5000000) {
      issues.push('Image file size is very large, may slow down processing');
      recommendations.push('Consider reducing image resolution');
    }
  } else if (!isBrowser && Buffer.isBuffer(imageData)) {
    // Comment 10: Handle Buffer inputs in Node environment
    const bufferSize = Buffer.byteLength(imageData);
    
    if (bufferSize < 10000) {
      issues.push('Image buffer size is very small, may be low quality');
      recommendations.push('Use higher resolution camera or better lighting');
    }
    
    if (bufferSize > 5000000) {
      issues.push('Image buffer size is very large, may slow down processing');
      recommendations.push('Consider reducing image resolution');
    }

    // Try to extract metadata for more detailed analysis
    try {
      // Note: This would require sharp to be available
      // In a real implementation, you might want to use sharp.metadata() here
      // For now, we'll use basic buffer analysis
      
      // Check if buffer contains valid image data
      const header = imageData.slice(0, 8);
      const isJPEG = header[0] === 0xFF && header[1] === 0xD8;
      const isPNG = header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4E && header[3] === 0x47;
      
      if (!isJPEG && !isPNG) {
        issues.push('Image format may not be supported (JPEG/PNG expected)');
        recommendations.push('Convert image to JPEG or PNG format');
      }
      
      // Estimate image dimensions from buffer size
      // This is a rough estimation - in production, use actual metadata
      const estimatedPixels = bufferSize / 3; // Rough estimate for RGB
      const estimatedDimension = Math.sqrt(estimatedPixels);
      
      if (estimatedDimension < 100) {
        issues.push('Image appears to be very low resolution');
        recommendations.push('Use higher resolution camera');
      }
      
      if (estimatedDimension > 3000) {
        issues.push('Image appears to be very high resolution, may be inefficient');
        recommendations.push('Consider resizing image for better performance');
      }
      
    } catch (metadataError) {
      // If metadata extraction fails, continue with basic analysis
      console.warn('Could not extract image metadata:', metadataError);
    }
  }

  // Default to good quality if no issues detected
  const quality: 'excellent' | 'good' | 'fair' | 'poor' = 
    issues.length === 0 ? 'good' : 
    issues.length <= 2 ? 'fair' : 'poor';

  return { quality, issues, recommendations };
}

// Pharmaceutical-specific preprocessing options
export const PHARMACEUTICAL_PREPROCESSING_OPTIONS: PreprocessingOptions = {
  contrast: 1.3,
  brightness: 1.15,
  noiseReduction: true,
  deskew: true,
  resize: {
    width: 1500,
    maintainAspectRatio: true
  },
  enhancement: {
    sharpen: true,
    gamma: 1.1
  }
};

// Export convenience function for pharmaceutical images
export async function preprocessPharmaceuticalImage(
  input: string | Buffer
): Promise<string | Buffer> {
  return preprocessForOCR(input, PHARMACEUTICAL_PREPROCESSING_OPTIONS);
}
