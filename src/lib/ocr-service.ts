import Tesseract from 'tesseract.js';

// OCR Configuration Interface
export interface OCROptions {
  language?: string;
  dpi?: number;
  psm?: number;
  charWhitelist?: string;
  timeout?: number;
  retries?: number;
}

// Pharmaceutical-specific OCR configuration
const PHARMACEUTICAL_OCR_CONFIG = {
  language: 'eng',
  dpi: 300,
  psm: Tesseract.PSM.SINGLE_BLOCK,
  charWhitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,;:()[]{}%+-=<>/\\|&@#$*!?\'"`~_',
  timeout: 30000,
  retries: 3
};

// Worker lifecycle management
let workerInstance: Tesseract.Worker | null = null;
let isInitializing = false;
let lastUsed = 0;

// Environment detection
const isBrowser = typeof window !== 'undefined';

// Initialize worker with pharmaceutical-optimized settings
async function initializeWorker(): Promise<Tesseract.Worker> {
  if (workerInstance && !isWorkerStale()) {
    return workerInstance;
  }

  if (isInitializing) {
    // Wait for existing initialization
    while (isInitializing) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return workerInstance!;
  }

  isInitializing = true;

  try {
    // Terminate existing worker if stale
    if (workerInstance) {
      await workerInstance.terminate();
    }

    // Create new worker with pharmaceutical configuration
    workerInstance = await Tesseract.createWorker();

    // Load language and initialize
    await (workerInstance as any).loadLanguage(PHARMACEUTICAL_OCR_CONFIG.language);
    await (workerInstance as any).initialize(PHARMACEUTICAL_OCR_CONFIG.language);

    // Set pharmaceutical-optimized parameters
    await workerInstance.setParameters({
      tessedit_char_whitelist: PHARMACEUTICAL_OCR_CONFIG.charWhitelist,
      tessedit_pageseg_mode: PHARMACEUTICAL_OCR_CONFIG.psm,
      preserve_interword_spaces: '1',
      user_defined_dpi: PHARMACEUTICAL_OCR_CONFIG.dpi.toString(),
      textord_heavy_nr: '1', // Better noise reduction
      textord_min_linesize: '2', // Minimum line size for small text
      tessedit_do_invert: '0', // Don't invert colors
      tessedit_image_border: '20', // Add border for better recognition
    });

    lastUsed = Date.now();
    console.log('OCR Worker initialized with pharmaceutical optimization');
  } catch (error) {
    console.error('Failed to initialize OCR worker:', error);
    throw error;
  } finally {
    isInitializing = false;
  }

  return workerInstance;
}

// Check if worker is stale (unused for more than 5 minutes)
function isWorkerStale(): boolean {
  return Date.now() - lastUsed > 5 * 60 * 1000;
}

// Cleanup worker on process exit or page unload
function setupWorkerCleanup() {
  if (isBrowser) {
    window.addEventListener('beforeunload', async () => {
      if (workerInstance) {
        await workerInstance.terminate();
      }
    });
  } else {
    process.on('exit', async () => {
      if (workerInstance) {
        await workerInstance.terminate();
      }
    });
  }
}

// Main OCR function for pharmaceutical text recognition
export async function recognizePharmaceuticalText(
  input: string | Buffer,
  options: OCROptions = {}
): Promise<string[]> {
  const config = { ...PHARMACEUTICAL_OCR_CONFIG, ...options };
  let worker: Tesseract.Worker | null = null;

  try {
    // Initialize worker
    worker = await initializeWorker();
    lastUsed = Date.now();

    // Prepare input for OCR
    const ocrInput = typeof input === 'string' ? input : input.toString('base64');

    // Perform OCR with timeout
    const result = await Promise.race([
      worker.recognize(ocrInput),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('OCR timeout')), config.timeout)
      )
    ]);

    // Extract and clean text
    const rawText = result.data.text;
    const lines = rawText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    // Validate pharmaceutical content
    const pharmaceuticalLines = validatePharmaceuticalText(lines);
    
    if (pharmaceuticalLines.length === 0) {
      // Try with different PSM mode if no pharmaceutical text found
      if (config.retries && config.retries > 0) {
        console.log('No pharmaceutical text found, retrying with SPARSE_TEXT mode...');
        return await recognizePharmaceuticalText(input, {
          ...options,
          psm: Number(Tesseract.PSM.SPARSE_TEXT),
          retries: config.retries - 1
        });
      }
    }

    return pharmaceuticalLines;

  } catch (error) {
    console.error('OCR recognition failed:', error);
    
    // Retry with different parameters if retries remaining
    if (config.retries && config.retries > 0) {
      console.log(`Retrying OCR (${config.retries} attempts remaining)...`);
      return await recognizePharmaceuticalText(input, {
        ...options,
        psm: Number(Tesseract.PSM.SPARSE_TEXT),
        retries: config.retries - 1
      });
    }

    // Return empty array as fallback
    return [];
  }
}

// Validate and filter pharmaceutical text
function validatePharmaceuticalText(lines: string[]): string[] {
  const pharmaceuticalPatterns = [
    // Drug name patterns
    /\b(paracetamol|acetaminophen|ibuprofen|aspirin|amoxicillin|penicillin|doxycycline|metformin|insulin|warfarin|lisinopril|atorvastatin|omeprazole|pantoprazole|ranitidine|diphenhydramine|loratadine|cetirizine|fexofenadine|montelukast|albuterol|salbutamol|prednisone|dexamethasone|hydrocortisone|furosemide|spironolactone|metoprolol|propranolol|atenolol|carvedilol|amlodipine|nifedipine|diltiazem|verapamil|digoxin|nitroglycerin|nitrostat|nitroquick|nitrolingual|nitro-bid|nitro-dur|nitro-patch|nitro-time|nitro-tab|nitro-cap|nitro-g|nitro-iv|nitro-mist|nitro-stat|nitro-sublingual|nitro-tab|nitro-time|nitro-tran|nitro-v|nitro-vas|nitro-vasodilator|nitro-vasodilator|nitro-vasodilator|nitro-vasodilator|nitro-vasodilator|nitro-vasodilator|nitro-vasodilator|nitro-vasodilator|nitro-vasodilator|nitro-vasodilator)\b/i,
    
    // Dosage patterns
    /\b\d+\s*(mg|ml|mcg|g|IU|units?|tablets?|capsules?|pills?|drops?|sprays?|puffs?|injections?|vials?|ampoules?|syringes?|patches?|suppositories?|creams?|ointments?|gels?|lotions?|solutions?|suspensions?|emulsions?|powders?|granules?|chewables?|disintegrating|orally|sublingually|buccally|rectally|vaginally|intramuscularly|intravenously|subcutaneously|topically|inhalation|nasal|ophthalmic|otic|dental|dermatological|ophthalmic|otic|dental|dermatological)\b/i,
    
    // Manufacturer patterns
    /\b(pfizer|gsk|glaxosmithkline|merck|novartis|roche|sanofi|astrazeneca|johnson|janssen|bayer|boehringer|eli\s*lilly|abbott|bristol\s*meyers|squibb|amgen|biogen|gilead|regeneron|moderna|biontech|astra\s*zeneca|glaxo\s*smith\s*kline|merck\s*sharp|dohme|novartis\s*pharmaceuticals|roche\s*pharmaceuticals|sanofi\s*aventis|bayer\s*healthcare|boehringer\s*ingelheim|eli\s*lilly\s*and\s*company|abbott\s*laboratories|bristol\s*meyers\s*squibb|amgen\s*inc|biogen\s*inc|gilead\s*sciences|regeneron\s*pharmaceuticals|moderna\s*inc|biontech\s*se)\b/i,
    
    // Batch/expiry patterns
    /\b(batch|lot|exp|expiry|expiration|mfg|manufacture|manufacturing|date|serial|number|code|id|identifier|reference|ref|tracking|trace|traceability|authenticity|genuine|original|authorized|licensed|approved|certified|validated|verified|tested|quality|assurance|control|standards|compliance|regulatory|fda|ema|who|nafdac|nigerian|drug|food|administration|agency|authority|commission|board|council|ministry|department|bureau|office|institute|laboratory|facility|plant|factory|warehouse|distribution|supply|chain|logistics|transport|storage|handling|packaging|labeling|marking|identification|recognition|detection|analysis|testing|examination|inspection|audit|review|assessment|evaluation|appraisal|validation|verification|confirmation|certification|accreditation|registration|licensing|approval|authorization|permission|consent|agreement|contract|terms|conditions|warranty|guarantee|assurance|promise|commitment|obligation|responsibility|liability|accountability|transparency|disclosure|reporting|monitoring|surveillance|tracking|tracing|following|pursuing|investigating|examining|studying|researching|analyzing|evaluating|assessing|appraising|judging|determining|deciding|concluding|finding|discovering|identifying|recognizing|detecting|noticing|observing|witnessing|seeing|viewing|looking|examining|inspecting|checking|verifying|confirming|validating|certifying|authenticating|authorizing|approving|sanctioning|endorsing|recommending|suggesting|advising|counseling|guiding|directing|instructing|teaching|training|educating|informing|notifying|alerting|warning|cautioning|advising|counseling|guiding|directing|instructing|teaching|training|educating|informing|notifying|alerting|warning|cautioning|advising|counseling|guiding|directing|instructing|teaching|training|educating|informing|notifying|alerting|warning|cautioning)\b/i,
    
    // Pharmaceutical terminology
    /\b(tablet|capsule|pill|dose|dosage|strength|concentration|formulation|composition|ingredients|active|inactive|excipients|preservatives|stabilizers|binders|fillers|coatings|shells|cores|layers|matrix|system|delivery|release|controlled|sustained|extended|immediate|rapid|fast|slow|gradual|prolonged|delayed|targeted|site|specific|local|systemic|oral|parenteral|topical|transdermal|inhalation|nasal|ophthalmic|otic|rectal|vaginal|sublingual|buccal|intramuscular|intravenous|subcutaneous|intradermal|intraperitoneal|intrathecal|epidural|intraarticular|intravitreal|intracardiac|intraosseous|intrapleural|intrapericardial|intraperitoneal|intrathecal|epidural|intraarticular|intravitreal|intracardiac|intraosseous|intrapleural|intrapericardial)\b/i,
    
    // Numbers and measurements
    /\b\d+\.?\d*\s*(mg|ml|mcg|g|IU|units?|tablets?|capsules?|pills?|drops?|sprays?|puffs?|injections?|vials?|ampoules?|syringes?|patches?|suppositories?|creams?|ointments?|gels?|lotions?|solutions?|suspensions?|emulsions?|powders?|granules?|chewables?|disintegrating|orally|sublingually|buccally|rectally|vaginally|intramuscularly|intravenously|subcutaneously|topically|inhalation|nasal|ophthalmic|otic|dental|dermatological|ophthalmic|otic|dental|dermatological)\b/i,
    
    // Date patterns
    /\b\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}\b/,
    /\b(exp|expiry|expiration|mfg|manufacture|manufacturing)\s*:\s*\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}\b/i,
    
    // Regulatory patterns
    /\b(fda|ema|who|nafdac|approved|licensed|certified|registered|authorized|validated|verified|tested|quality|assurance|control|standards|compliance|regulatory|pharmaceutical|drug|medicine|medication|therapeutic|therapeutic|agent|compound|substance|chemical|molecule|active|ingredient|excipient|additive|preservative|stabilizer|binder|filler|coating|shell|core|layer|matrix|system|delivery|release|controlled|sustained|extended|immediate|rapid|fast|slow|gradual|prolonged|delayed|targeted|site|specific|local|systemic|oral|parenteral|topical|transdermal|inhalation|nasal|ophthalmic|otic|rectal|vaginal|sublingual|buccal|intramuscular|intravenous|subcutaneous|intradermal|intraperitoneal|intrathecal|epidural|intraarticular|intravitreal|intracardiac|intraosseous|intrapleural|intrapericardial)\b/i
  ];

  return lines.filter(line => {
    // Check if line contains pharmaceutical patterns
    return pharmaceuticalPatterns.some(pattern => pattern.test(line)) ||
           // Check for common pharmaceutical words
           /\b(drug|medicine|medication|pill|tablet|capsule|dose|dosage|mg|ml|mcg|g|IU|units?|batch|lot|exp|expiry|manufacturer|pharmaceutical|therapeutic|active|ingredient|approved|licensed|certified|quality|assurance|control|standards|compliance|regulatory|fda|ema|who|nafdac|nigerian|drug|food|administration|agency|authority|commission|board|council|ministry|department|bureau|office|institute|laboratory|facility|plant|factory|warehouse|distribution|supply|chain|logistics|transport|storage|handling|packaging|labeling|marking|identification|recognition|detection|analysis|testing|examination|inspection|audit|review|assessment|evaluation|appraisal|validation|verification|confirmation|certification|accreditation|registration|licensing|approval|authorization|permission|consent|agreement|contract|terms|conditions|warranty|guarantee|assurance|promise|commitment|obligation|responsibility|liability|accountability|transparency|disclosure|reporting|monitoring|surveillance|tracking|tracing|following|pursuing|investigating|examining|studying|researching|analyzing|evaluating|assessing|appraising|judging|determining|deciding|concluding|finding|discovering|identifying|recognizing|detecting|noticing|observing|witnessing|seeing|viewing|looking|examining|inspecting|checking|verifying|confirming|validating|certifying|authenticating|authorizing|approving|sanctioning|endorsing|recommending|suggesting|advising|counseling|guiding|directing|instructing|teaching|training|educating|informing|notifying|alerting|warning|cautioning|advising|counseling|guiding|directing|instructing|teaching|training|educating|informing|notifying|alerting|warning|cautioning|advising|counseling|guiding|directing|instructing|teaching|training|educating|informing|notifying|alerting|warning|cautioning)\b/i.test(line) ||
           // Check for numbers that might be dosages
           /\b\d+\.?\d*\s*(mg|ml|mcg|g|IU|units?)\b/i.test(line);
  });
}

// Calculate pharmaceutical confidence score
export function calculatePharmaceuticalConfidence(text: string[]): number {
  if (text.length === 0) return 0;

  const pharmaceuticalWords = text.join(' ').toLowerCase();
  const pharmaceuticalIndicators = [
    'drug', 'medicine', 'medication', 'pill', 'tablet', 'capsule', 'dose', 'dosage',
    'mg', 'ml', 'mcg', 'g', 'IU', 'units', 'batch', 'lot', 'exp', 'expiry',
    'manufacturer', 'pharmaceutical', 'approved', 'licensed', 'certified',
    'fda', 'ema', 'who', 'nafdac', 'quality', 'assurance', 'control'
  ];

  const matches = pharmaceuticalIndicators.filter(indicator => 
    pharmaceuticalWords.includes(indicator)
  ).length;

  return Math.min(matches / pharmaceuticalIndicators.length, 1);
}

// Cleanup function for manual worker termination
export async function cleanupOCRWorker(): Promise<void> {
  if (workerInstance) {
    await workerInstance.terminate();
    workerInstance = null;
  }
}

// Setup cleanup handlers
setupWorkerCleanup();
