/**
 * Pharmaceutical Data Acquisition Service
 * Fetches real training data from legitimate pharmaceutical datasets and APIs
 */

import { environmentConfig } from '@/config/environmentConfig';
import * as fs from 'fs';
import * as path from 'path';

interface DrugDataEntry {
  id: string;
  name: string;
  genericName?: string;
  brandNames: string[];
  activeIngredients: string[];
  strength: string;
  dosageForm: string;
  manufacturer: string;
  ndcNumber?: string;
  imageUrls: string[];
  description: string;
  visualCharacteristics: {
    color: string[];
    shape: string;
    size: string;
    markings: string[];
    imprint?: string;
  };
  approvalDate?: string;
  therapeuticClass: string;
  controlledSubstance?: boolean;
  prescriptionRequired: boolean;
}

interface DatasetSource {
  name: string;
  url: string;
  apiKey?: string;
  rateLimitMs: number;
  enabled: boolean;
  dataFormat: 'json' | 'xml' | 'csv';
}

interface DataAcquisitionStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  uniqueDrugs: number;
  imagesDownloaded: number;
  lastUpdate: Date;
}

class PharmaceuticalDataAcquisition {
  private dataSources: Map<string, DatasetSource> = new Map();
  private stats: DataAcquisitionStats;
  private rateLimiters: Map<string, number> = new Map();

  constructor() {
    this.initializeDataSources();
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      uniqueDrugs: 0,
      imagesDownloaded: 0,
      lastUpdate: new Date()
    };
  }

  private initializeDataSources(): void {
    // FDA Orange Book - Public drug approval database
    this.dataSources.set('fda-orange-book', {
      name: 'FDA Orange Book',
      url: 'https://api.fda.gov/drug/label.json',
      rateLimitMs: 1000, // 1 request per second
      enabled: true,
      dataFormat: 'json'
    });

    // NIH Pillbox - Pill identification database
    this.dataSources.set('nih-pillbox', {
      name: 'NIH Pillbox',
      url: 'https://pillbox.nlm.nih.gov/API',
      rateLimitMs: 500,
      enabled: true,
      dataFormat: 'json'
    });

    // DailyMed - FDA structured product labeling
    this.dataSources.set('dailymed', {
      name: 'DailyMed API',
      url: 'https://dailymed.nlm.nih.gov/dailymed/services/v2/spls.json',
      rateLimitMs: 1000,
      enabled: true,
      dataFormat: 'json'
    });

    // Custom pharmaceutical dataset endpoint (if configured)
    if (environmentConfig.database.pharmaceuticalDatasetEndpoint) {
      this.dataSources.set('custom-pharma-dataset', {
        name: 'Custom Pharmaceutical Dataset',
        url: environmentConfig.database.pharmaceuticalDatasetEndpoint,
        apiKey: process.env.PHARMACEUTICAL_DATASET_API_KEY,
        rateLimitMs: 2000,
        enabled: true,
        dataFormat: 'json'
      });
    }

    // Academic datasets (placeholder - would require institutional access)
    this.dataSources.set('academic-datasets', {
      name: 'Academic Pharmaceutical Datasets',
      url: 'https://academic-pharma-data.edu/api/v1',
      apiKey: process.env.ACADEMIC_DATASET_API_KEY,
      rateLimitMs: 5000,
      enabled: !!process.env.ACADEMIC_DATASET_API_KEY,
      dataFormat: 'json'
    });
  }

  /**
   * Acquire pharmaceutical data from all enabled sources
   */
  async acquirePharmaceuticalData(options: {
    maxRecords?: number;
    categories?: string[];
    includeImages?: boolean;
    outputPath?: string;
  } = {}): Promise<DrugDataEntry[]> {
    
    const {
      maxRecords = 1000,
      categories = ['tablets', 'capsules', 'pills'],
      includeImages = true,
      outputPath = environmentConfig.training.dataPath
    } = options;

    console.log('🔍 Starting pharmaceutical data acquisition...');
    console.log(`Target: ${maxRecords} records, Categories: ${categories.join(', ')}`);

    const allData: DrugDataEntry[] = [];
    
    for (const [sourceId, source] of this.dataSources) {
      if (!source.enabled) {
        console.log(`⏭️ Skipping disabled source: ${source.name}`);
        continue;
      }

      console.log(`📡 Fetching data from: ${source.name}`);
      
      try {
        const sourceData = await this.fetchFromSource(sourceId, source, {
          maxRecords: Math.floor(maxRecords / this.dataSources.size),
          categories,
          includeImages
        });
        
        allData.push(...sourceData);
        console.log(`✅ Retrieved ${sourceData.length} records from ${source.name}`);
        
      } catch (error) {
        console.error(`❌ Failed to fetch from ${source.name}:`, error);
        this.stats.failedRequests++;
      }
    }

    // Remove duplicates and process data
    const uniqueData = this.deduplicateData(allData);
    this.stats.uniqueDrugs = uniqueData.length;
    
    console.log(`🔬 Processing ${uniqueData.length} unique pharmaceutical records...`);

    // Save processed data
    await this.saveProcessedData(uniqueData, outputPath);
    
    // Download images if requested
    if (includeImages) {
      await this.downloadPharmaceuticalImages(uniqueData, outputPath);
    }

    this.stats.lastUpdate = new Date();
    this.logAcquisitionStats();

    return uniqueData;
  }

  private async fetchFromSource(
    sourceId: string,
    source: DatasetSource,
    options: { maxRecords: number; categories: string[]; includeImages: boolean }
  ): Promise<DrugDataEntry[]> {
    
    const data: DrugDataEntry[] = [];
    let offset = 0;
    const limit = 100; // Fetch in batches

    while (data.length < options.maxRecords) {
      await this.respectRateLimit(sourceId, source.rateLimitMs);

      try {
        const batchData = await this.fetchBatchFromSource(source, offset, limit, options.categories);
        
        if (batchData.length === 0) {
          console.log(`No more data available from ${source.name}`);
          break;
        }

        data.push(...batchData);
        offset += limit;
        this.stats.totalRequests++;
        this.stats.successfulRequests++;

        console.log(`📥 Fetched batch: ${data.length}/${options.maxRecords} from ${source.name}`);

      } catch (error) {
        console.error(`Error fetching batch from ${source.name}:`, error);
        this.stats.failedRequests++;
        break;
      }
    }

    return data.slice(0, options.maxRecords);
  }

  private async fetchBatchFromSource(
    source: DatasetSource,
    offset: number,
    limit: number,
    categories: string[]
  ): Promise<DrugDataEntry[]> {
    
    const url = this.buildApiUrl(source, offset, limit, categories);
    const headers: Record<string, string> = {
      'User-Agent': 'PharmaceuticalAI-DataAcquisition/1.0',
      'Accept': 'application/json'
    };

    if (source.apiKey) {
      headers['Authorization'] = `Bearer ${source.apiKey}`;
    }

    const response = await fetch(url, { headers });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const rawData = await response.json();
    return this.parseSourceData(source, rawData);
  }

  private buildApiUrl(
    source: DatasetSource,
    offset: number,
    limit: number,
    categories: string[]
  ): string {
    
    const baseUrl = source.url;
    const params = new URLSearchParams();

    // Add common parameters
    params.set('limit', limit.toString());
    params.set('skip', offset.toString());

    // Source-specific URL building
    switch (source.name) {
      case 'FDA Orange Book':
        params.set('search', `dosage_form:(${categories.join(' OR ')})`);
        break;
        
      case 'NIH Pillbox':
        params.set('format', 'json');
        if (categories.includes('tablets')) params.set('shape', 'ROUND');
        break;
        
      case 'DailyMed API':
        params.set('drug_name', '*');
        break;
        
      default:
        // Generic API parameters
        params.set('category', categories.join(','));
    }

    return `${baseUrl}?${params.toString()}`;
  }

  private parseSourceData(source: DatasetSource, rawData: any): DrugDataEntry[] {
    const data: DrugDataEntry[] = [];

    try {
      switch (source.name) {
        case 'FDA Orange Book':
          data.push(...this.parseFDAData(rawData));
          break;
          
        case 'NIH Pillbox':
          data.push(...this.parsePillboxData(rawData));
          break;
          
        case 'DailyMed API':
          data.push(...this.parseDailyMedData(rawData));
          break;
          
        default:
          data.push(...this.parseGenericData(rawData));
      }
    } catch (error) {
      console.error(`Error parsing data from ${source.name}:`, error);
    }

    return data;
  }

  private parseFDAData(rawData: any): DrugDataEntry[] {
    const data: DrugDataEntry[] = [];
    
    if (rawData.results) {
      for (const result of rawData.results) {
        try {
          const entry: DrugDataEntry = {
            id: result.id || `fda_${Date.now()}_${Math.random()}`,
            name: result.openfda?.brand_name?.[0] || result.openfda?.generic_name?.[0] || 'Unknown',
            genericName: result.openfda?.generic_name?.[0],
            brandNames: result.openfda?.brand_name || [],
            activeIngredients: result.active_ingredient || [],
            strength: result.openfda?.substance_name?.[0] || 'Unknown',
            dosageForm: result.dosage_form?.[0] || 'Unknown',
            manufacturer: result.openfda?.manufacturer_name?.[0] || 'Unknown',
            ndcNumber: result.openfda?.product_ndc?.[0],
            imageUrls: [], // FDA doesn't provide images directly
            description: result.description?.[0] || '',
            visualCharacteristics: {
              color: this.extractColorsFromDescription(result.description?.[0] || ''),
              shape: this.extractShapeFromDescription(result.description?.[0] || ''),
              size: 'Unknown',
              markings: this.extractMarkingsFromDescription(result.description?.[0] || ''),
              imprint: result.openfda?.imprint?.[0]
            },
            approvalDate: result.effective_time,
            therapeuticClass: result.openfda?.pharm_class_epc?.[0] || 'Unknown',
            controlledSubstance: this.isControlledSubstance(result),
            prescriptionRequired: true
          };

          data.push(entry);
        } catch (error) {
          console.warn('Error parsing FDA record:', error);
        }
      }
    }

    return data;
  }

  private parsePillboxData(rawData: any): DrugDataEntry[] {
    const data: DrugDataEntry[] = [];
    
    // NIH Pillbox data structure varies - implement based on actual API response
    if (Array.isArray(rawData)) {
      for (const item of rawData) {
        try {
          const entry: DrugDataEntry = {
            id: item.setid || `pillbox_${Date.now()}_${Math.random()}`,
            name: item.medicine_name || 'Unknown',
            brandNames: item.medicine_name ? [item.medicine_name] : [],
            activeIngredients: [item.active_ingredient || ''],
            strength: item.strength || 'Unknown',
            dosageForm: item.dosage_form || 'Unknown',
            manufacturer: item.labeler || 'Unknown',
            imageUrls: item.image_url ? [item.image_url] : [],
            description: item.description || '',
            visualCharacteristics: {
              color: item.color ? [item.color] : [],
              shape: item.shape || 'Unknown',
              size: item.size || 'Unknown',
              markings: item.imprint_text ? [item.imprint_text] : [],
              imprint: item.imprint_text
            },
            therapeuticClass: 'Unknown',
            prescriptionRequired: item.rxcui ? true : false
          };

          data.push(entry);
        } catch (error) {
          console.warn('Error parsing Pillbox record:', error);
        }
      }
    }

    return data;
  }

  private parseDailyMedData(rawData: any): DrugDataEntry[] {
    const data: DrugDataEntry[] = [];
    
    // DailyMed parsing implementation
    if (rawData.data) {
      for (const item of rawData.data) {
        try {
          const entry: DrugDataEntry = {
            id: item.setid || `dailymed_${Date.now()}_${Math.random()}`,
            name: item.title || 'Unknown',
            brandNames: [item.title || ''],
            activeIngredients: item.active_ingredients || [],
            strength: 'Unknown',
            dosageForm: item.dosage_form || 'Unknown',
            manufacturer: item.author || 'Unknown',
            imageUrls: [],
            description: item.description || '',
            visualCharacteristics: {
              color: [],
              shape: 'Unknown',
              size: 'Unknown',
              markings: []
            },
            therapeuticClass: item.product_type || 'Unknown',
            prescriptionRequired: true
          };

          data.push(entry);
        } catch (error) {
          console.warn('Error parsing DailyMed record:', error);
        }
      }
    }

    return data;
  }

  private parseGenericData(rawData: any): DrugDataEntry[] {
    // Generic parser for custom datasets
    const data: DrugDataEntry[] = [];
    
    if (Array.isArray(rawData)) {
      for (const item of rawData) {
        // Implement based on your custom dataset structure
        const entry: DrugDataEntry = {
          id: item.id || `custom_${Date.now()}_${Math.random()}`,
          name: item.name || 'Unknown',
          brandNames: item.brandNames || [item.name],
          activeIngredients: item.activeIngredients || [],
          strength: item.strength || 'Unknown',
          dosageForm: item.dosageForm || 'Unknown',
          manufacturer: item.manufacturer || 'Unknown',
          imageUrls: item.imageUrls || [],
          description: item.description || '',
          visualCharacteristics: item.visualCharacteristics || {
            color: [],
            shape: 'Unknown',
            size: 'Unknown',
            markings: []
          },
          therapeuticClass: item.therapeuticClass || 'Unknown',
          prescriptionRequired: item.prescriptionRequired ?? true
        };

        data.push(entry);
      }
    }

    return data;
  }

  private deduplicateData(data: DrugDataEntry[]): DrugDataEntry[] {
    const seen = new Set<string>();
    const unique: DrugDataEntry[] = [];

    for (const entry of data) {
      // Create a unique key based on name, strength, and manufacturer
      const key = `${entry.name.toLowerCase()}_${entry.strength}_${entry.manufacturer.toLowerCase()}`;
      
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(entry);
      }
    }

    return unique;
  }

  private async saveProcessedData(data: DrugDataEntry[], outputPath: string): Promise<void> {
    const outputFile = path.join(outputPath, 'pharmaceutical_dataset.json');
    
    // Ensure output directory exists
    await fs.promises.mkdir(path.dirname(outputFile), { recursive: true });
    
    // Save as JSON
    await fs.promises.writeFile(outputFile, JSON.stringify(data, null, 2));
    console.log(`💾 Saved ${data.length} records to ${outputFile}`);

    // Also save as CSV for easier analysis
    const csvData = this.convertToCSV(data);
    const csvFile = path.join(outputPath, 'pharmaceutical_dataset.csv');
    await fs.promises.writeFile(csvFile, csvData);
    console.log(`💾 Saved CSV version to ${csvFile}`);
  }

  private async downloadPharmaceuticalImages(data: DrugDataEntry[], outputPath: string): Promise<void> {
    console.log('📸 Downloading pharmaceutical images...');
    
    const imagesDir = path.join(outputPath, 'images');
    await fs.promises.mkdir(imagesDir, { recursive: true });

    let downloadCount = 0;
    const maxConcurrent = 3;
    const chunks = this.chunkArray(data.filter(d => d.imageUrls.length > 0), maxConcurrent);

    for (const chunk of chunks) {
      await Promise.allSettled(chunk.map(async (entry) => {
        for (let i = 0; i < entry.imageUrls.length; i++) {
          try {
            await this.downloadImage(entry.imageUrls[i], imagesDir, `${entry.id}_${i}.jpg`);
            downloadCount++;
          } catch (error) {
            console.warn(`Failed to download image for ${entry.name}:`, error);
          }
        }
      }));
    }

    this.stats.imagesDownloaded = downloadCount;
    console.log(`📸 Downloaded ${downloadCount} pharmaceutical images`);
  }

  private async downloadImage(url: string, outputDir: string, filename: string): Promise<void> {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const buffer = await response.arrayBuffer();
    const filepath = path.join(outputDir, filename);
    
    await fs.promises.writeFile(filepath, Buffer.from(buffer));
  }

  // Helper methods
  private extractColorsFromDescription(description: string): string[] {
    const colors = ['white', 'blue', 'red', 'yellow', 'green', 'pink', 'orange', 'purple', 'brown', 'black'];
    return colors.filter(color => description.toLowerCase().includes(color));
  }

  private extractShapeFromDescription(description: string): string {
    const shapes = ['round', 'oval', 'oblong', 'square', 'triangle', 'diamond', 'capsule'];
    for (const shape of shapes) {
      if (description.toLowerCase().includes(shape)) return shape;
    }
    return 'Unknown';
  }

  private extractMarkingsFromDescription(description: string): string[] {
    // Extract imprints, scores, etc. from description
    const markings: string[] = [];
    const imprintMatch = description.match(/imprint[ed]?\s*:?\s*([A-Z0-9\s-]+)/i);
    if (imprintMatch) {
      markings.push(imprintMatch[1].trim());
    }
    return markings;
  }

  private isControlledSubstance(fdaRecord: any): boolean {
    const controlledTerms = ['schedule', 'controlled', 'narcotic', 'opioid'];
    const recordText = JSON.stringify(fdaRecord).toLowerCase();
    return controlledTerms.some(term => recordText.includes(term));
  }

  private convertToCSV(data: DrugDataEntry[]): string {
    if (data.length === 0) return '';

    const headers = ['id', 'name', 'genericName', 'strength', 'dosageForm', 'manufacturer', 'therapeuticClass', 'prescriptionRequired'];
    const csvRows = [headers.join(',')];

    for (const entry of data) {
      const row = headers.map(header => {
        const value = entry[header as keyof DrugDataEntry];
        return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
      });
      csvRows.push(row.join(','));
    }

    return csvRows.join('\n');
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  private async respectRateLimit(sourceId: string, rateLimitMs: number): Promise<void> {
    const lastRequest = this.rateLimiters.get(sourceId) || 0;
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequest;

    if (timeSinceLastRequest < rateLimitMs) {
      const delay = rateLimitMs - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    this.rateLimiters.set(sourceId, Date.now());
  }

  private logAcquisitionStats(): void {
    console.log('\n📊 Data Acquisition Statistics:');
    console.log(`Total Requests: ${this.stats.totalRequests}`);
    console.log(`Successful: ${this.stats.successfulRequests}`);
    console.log(`Failed: ${this.stats.failedRequests}`);
    console.log(`Unique Drugs: ${this.stats.uniqueDrugs}`);
    console.log(`Images Downloaded: ${this.stats.imagesDownloaded}`);
    console.log(`Last Update: ${this.stats.lastUpdate.toISOString()}\n`);
  }

  getAcquisitionStats(): DataAcquisitionStats {
    return { ...this.stats };
  }

  getAvailableDataSources(): DatasetSource[] {
    return Array.from(this.dataSources.values());
  }
}

export const pharmaceuticalDataAcquisition = new PharmaceuticalDataAcquisition();
export type { DrugDataEntry, DatasetSource, DataAcquisitionStats };