// Placeholder Google Vision Service
// This is a temporary implementation to resolve build errors

export const googleVisionService = {
  isConfigured(): boolean {
    return false;
  },

  async analyzeImage(imageData: string): Promise<any> {
    throw new Error('Google Vision Service not implemented');
  },

  analyzeDrugDetection(result: any): any {
    return {
      isDrug: false,
      confidence: 0,
      drugType: 'unknown'
    };
  }
};
