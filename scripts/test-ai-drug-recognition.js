const fs = require('fs');
const path = require('path');

// Simulate AI drug recognition service
class MockAIDrugRecognitionService {
  constructor() {
    this.drugDatabase = new Map();
    this.initializeDrugDatabase();
  }

  initializeDrugDatabase() {
    this.drugDatabase.set('paracetamol', {
      name: 'Paracetamol',
      genericName: 'Acetaminophen',
      manufacturers: ['GSK', 'Pfizer', 'Johnson & Johnson'],
      packageTypes: ['tablet', 'capsule', 'liquid'],
      pillShapes: ['round', 'oval'],
      pillColors: ['white', 'yellow'],
      markings: ['P', '500', 'PARA'],
      activeIngredients: ['Paracetamol'],
      typicalDosages: ['500mg', '1000mg'],
    });

    this.drugDatabase.set('ibuprofen', {
      name: 'Ibuprofen',
      genericName: 'Ibuprofen',
      manufacturers: ['Bayer', 'Pfizer', 'GSK'],
      packageTypes: ['tablet', 'capsule'],
      pillShapes: ['round', 'oval'],
      pillColors: ['white', 'pink'],
      markings: ['IBU', '400', '600'],
      activeIngredients: ['Ibuprofen'],
      typicalDosages: ['200mg', '400mg', '600mg'],
    });

    this.drugDatabase.set('amoxicillin', {
      name: 'Amoxicillin',
      genericName: 'Amoxicillin',
      manufacturers: ['GSK', 'Pfizer', 'Merck'],
      packageTypes: ['capsule', 'tablet', 'liquid'],
      pillShapes: ['capsule', 'round'],
      pillColors: ['white', 'yellow', 'orange'],
      markings: ['AMOX', '500', '875'],
      activeIngredients: ['Amoxicillin'],
      typicalDosages: ['250mg', '500mg', '875mg'],
    });
  }

  async analyzeDrugImage(imageBuffer) {
    console.log('🔍 Starting AI drug image analysis...');
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Simulate OCR text extraction
    const textExtraction = [
      'PARACETAMOL 500mg',
      'Batch: B2024001',
      'Exp: 12/2025',
      'GSK Pharmaceuticals',
      'Take 1-2 tablets every 4-6 hours',
      'Store in a cool, dry place',
    ];

    // Simulate image analysis
    const imageAnalysis = {
      text: ['PARACETAMOL', '500mg', 'GSK', 'B2024001'],
      objects: ['tablet', 'package', 'label'],
      colors: ['white', 'blue', 'red'],
      patterns: ['striped', 'logo', 'barcode'],
      quality: 0.85,
    };

    // Identify drug
    const drugName = this.extractDrugName(textExtraction);
    const drugInfo = this.drugDatabase.get(drugName.toLowerCase());
    
    if (!drugInfo) {
      throw new Error(`Unknown drug: ${drugName}`);
    }

    // Detect counterfeit
    const counterfeitDetection = this.detectCounterfeit(drugName, imageAnalysis);
    
    // Simulate blockchain verification
    const blockchainVerification = {
      verified: Math.random() > 0.2,
      transactionHash: '0x' + Math.random().toString(16).substring(2, 10) + '...' + Math.random().toString(16).substring(2, 10),
      blockNumber: Math.floor(Math.random() * 1000000) + 45000000,
    };

    const result = {
      drugName: drugInfo.name,
      genericName: drugInfo.genericName,
      dosage: this.extractDosage(textExtraction),
      manufacturer: this.extractManufacturer(textExtraction),
      activeIngredients: drugInfo.activeIngredients,
      confidence: 0.92,
      isAuthentic: !counterfeitDetection.isCounterfeit,
      counterfeitRisk: counterfeitDetection.riskScore,
      detectedFeatures: {
        packageType: this.detectPackageType(imageAnalysis),
        pillShape: this.detectPillShape(imageAnalysis),
        pillColor: this.detectPillColor(imageAnalysis),
        markings: this.detectMarkings(textExtraction),
        batchNumber: this.extractBatchNumber(textExtraction),
        expiryDate: this.extractExpiryDate(textExtraction),
      },
      blockchainVerification,
    };

    console.log('✅ AI drug analysis completed');
    return result;
  }

  extractDrugName(texts) {
    const drugKeywords = ['PARACETAMOL', 'IBUPROFEN', 'AMOXICILLIN', 'ASPIRIN'];
    for (const text of texts) {
      for (const keyword of drugKeywords) {
        if (text.toUpperCase().includes(keyword)) {
          return keyword;
        }
      }
    }
    return 'UNKNOWN';
  }

  extractDosage(texts) {
    const dosagePattern = /(\d+)\s*mg/i;
    for (const text of texts) {
      const match = text.match(dosagePattern);
      if (match) {
        return match[0];
      }
    }
    return 'Unknown';
  }

  extractManufacturer(texts) {
    const manufacturers = ['GSK', 'PFIZER', 'BAYER', 'MERCK', 'JOHNSON'];
    for (const text of texts) {
      for (const manufacturer of manufacturers) {
        if (text.toUpperCase().includes(manufacturer)) {
          return manufacturer;
        }
      }
    }
    return 'Unknown';
  }

  extractBatchNumber(texts) {
    const batchPattern = /batch[:\s]*([A-Z0-9]+)/i;
    for (const text of texts) {
      const match = text.match(batchPattern);
      if (match) {
        return match[1];
      }
    }
    return undefined;
  }

  extractExpiryDate(texts) {
    const expiryPattern = /exp[:\s]*(\d{1,2}\/\d{4})/i;
    for (const text of texts) {
      const match = text.match(expiryPattern);
      if (match) {
        return match[1];
      }
    }
    return undefined;
  }

  detectPackageType(imageAnalysis) {
    if (imageAnalysis.objects.includes('tablet')) return 'tablet';
    if (imageAnalysis.objects.includes('capsule')) return 'capsule';
    if (imageAnalysis.objects.includes('liquid')) return 'liquid';
    return 'unknown';
  }

  detectPillShape(imageAnalysis) {
    return 'round';
  }

  detectPillColor(imageAnalysis) {
    return imageAnalysis.colors[0] || 'unknown';
  }

  detectMarkings(texts) {
    const markings = [];
    for (const text of texts) {
      if (text.match(/^[A-Z0-9]{1,4}$/)) {
        markings.push(text);
      }
    }
    return markings;
  }

  detectCounterfeit(drugName, imageAnalysis) {
    let riskScore = 0;
    const riskFactors = [];

    // Check image quality
    if (imageAnalysis.quality < 0.7) {
      riskScore += 0.3;
      riskFactors.push('Low image quality');
    }

    // Check for suspicious patterns
    if (imageAnalysis.patterns.includes('blurry') || imageAnalysis.patterns.includes('pixelated')) {
      riskScore += 0.2;
      riskFactors.push('Blurry or pixelated image');
    }

    // Check color consistency
    const drugInfo = this.drugDatabase.get(drugName.toLowerCase());
    const expectedColors = drugInfo?.pillColors || ['white'];
    const colorMatch = this.checkColorConsistency(imageAnalysis.colors, expectedColors);
    if (colorMatch < 0.8) {
      riskScore += 0.25;
      riskFactors.push('Color inconsistency');
    }

    // Check text quality
    const textQuality = this.analyzeTextQuality(imageAnalysis.text);
    if (textQuality < 0.8) {
      riskScore += 0.2;
      riskFactors.push('Poor text quality');
    }

    // Check for missing security features
    const securityFeatures = this.checkSecurityFeatures(imageAnalysis);
    if (!securityFeatures.hasHologram && !securityFeatures.hasWatermark) {
      riskScore += 0.15;
      riskFactors.push('Missing security features');
    }

    const isCounterfeit = riskScore > 0.5;

    return { isCounterfeit, riskScore, riskFactors };
  }

  checkColorConsistency(detectedColors, expectedColors) {
    const matches = detectedColors.filter(color => expectedColors.includes(color));
    return matches.length / Math.max(detectedColors.length, expectedColors.length);
  }

  analyzeTextQuality(texts) {
    return 0.85;
  }

  checkSecurityFeatures(imageAnalysis) {
    return {
      hasHologram: Math.random() > 0.5,
      hasWatermark: Math.random() > 0.5,
    };
  }
}

// Test the AI drug recognition system
async function testAIDrugRecognition() {
  console.log('🤖 Testing AI Drug Recognition System\n');

  const aiService = new MockAIDrugRecognitionService();

  // Test cases
  const testCases = [
    {
      name: 'Authentic Paracetamol',
      description: 'Testing with authentic paracetamol image',
      expectedDrug: 'PARACETAMOL',
    },
    {
      name: 'Suspicious Ibuprofen',
      description: 'Testing with potentially counterfeit ibuprofen',
      expectedDrug: 'IBUPROFEN',
    },
    {
      name: 'Unknown Drug',
      description: 'Testing with unknown drug image',
      expectedDrug: 'UNKNOWN',
    },
  ];

  for (const testCase of testCases) {
    console.log(`\n🧪 Test Case: ${testCase.name}`);
    console.log(`📝 Description: ${testCase.description}`);
    console.log('─'.repeat(60));

    try {
      // Simulate image buffer (in real scenario, this would be an actual image)
      const mockImageBuffer = Buffer.from('mock-image-data');
      
      const startTime = Date.now();
      const result = await aiService.analyzeDrugImage(mockImageBuffer);
      const endTime = Date.now();

      console.log(`⏱️  Analysis Time: ${endTime - startTime}ms`);
      console.log(`💊 Drug Identified: ${result.drugName}`);
      console.log(`🏭 Manufacturer: ${result.manufacturer}`);
      console.log(`💪 Dosage: ${result.dosage}`);
      console.log(`🎯 Confidence: ${(result.confidence * 100).toFixed(1)}%`);
      console.log(`⚠️  Counterfeit Risk: ${(result.counterfeitRisk * 100).toFixed(1)}%`);
      console.log(`✅ Authentic: ${result.isAuthentic ? 'Yes' : 'No'}`);
      
      if (result.blockchainVerification) {
        console.log(`🔗 Blockchain Verified: ${result.blockchainVerification.verified ? 'Yes' : 'No'}`);
        if (result.blockchainVerification.transactionHash) {
          console.log(`📄 Transaction: ${result.blockchainVerification.transactionHash}`);
        }
      }

      console.log(`📦 Package Type: ${result.detectedFeatures.packageType}`);
      console.log(`🔵 Pill Color: ${result.detectedFeatures.pillColor}`);
      console.log(`⚪ Pill Shape: ${result.detectedFeatures.pillShape}`);
      
      if (result.detectedFeatures.markings.length > 0) {
        console.log(`🏷️  Markings: ${result.detectedFeatures.markings.join(', ')}`);
      }

      if (result.detectedFeatures.batchNumber) {
        console.log(`📋 Batch Number: ${result.detectedFeatures.batchNumber}`);
      }

      console.log(`💊 Active Ingredients: ${result.activeIngredients.join(', ')}`);

      // Security recommendation
      if (result.isAuthentic) {
        console.log('🟢 RECOMMENDATION: Drug appears authentic');
      } else {
        console.log('🔴 RECOMMENDATION: Potential counterfeit - do not consume!');
      }

    } catch (error) {
      console.error(`❌ Test failed: ${error.message}`);
    }
  }

  console.log('\n🎉 AI Drug Recognition System Test Completed!');
  console.log('\n📊 Key Features Demonstrated:');
  console.log('✅ Drug identification using OCR and image analysis');
  console.log('✅ Counterfeit detection through pattern recognition');
  console.log('✅ Blockchain verification integration');
  console.log('✅ Security feature detection');
  console.log('✅ Risk assessment and recommendations');
}

// Run the test
testAIDrugRecognition().catch(console.error); 