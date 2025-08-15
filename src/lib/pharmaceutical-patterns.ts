// Pharmaceutical text patterns and validation utilities

// Drug name patterns with common variations and OCR corrections
export const DRUG_NAME_PATTERNS = {
  // Common pain relievers
  paracetamol: /\b(paracetamol|acetaminophen|panadol|tylenol|calpol|doliprane|efferalgan|dafalgan|acetaminophen|apap)\b/i,
  ibuprofen: /\b(ibuprofen|advil|motrin|brufen|nurofen|ibuprofene|ibuprofeno)\b/i,
  aspirin: /\b(aspirin|acetylsalicylic\s*acid|asa|aspirine|aspirina)\b/i,
  
  // Antibiotics
  amoxicillin: /\b(amoxicillin|amoxil|trimox|amoxicilline|amoxicilina)\b/i,
  penicillin: /\b(penicillin|penicilline|penicilina|benzylpenicillin|procaine\s*penicillin)\b/i,
  doxycycline: /\b(doxycycline|vibramycin|doryx|doxycyclin|doxiciclina)\b/i,
  
  // Diabetes medications
  metformin: /\b(metformin|glucophage|fortamet|glumetza|metformina)\b/i,
  insulin: /\b(insulin|humulin|novolin|lantus|levemir|insulina)\b/i,
  
  // Cardiovascular medications
  warfarin: /\b(warfarin|coumadin|jantoven|warfarina)\b/i,
  lisinopril: /\b(lisinopril|zestril|prinivil|lisinoprila)\b/i,
  atorvastatin: /\b(atorvastatin|lipitor|atorvastatina)\b/i,
  
  // Gastrointestinal medications
  omeprazole: /\b(omeprazole|prilosec|omeprazol|omeprazolo)\b/i,
  pantoprazole: /\b(pantoprazole|protonix|pantoprazol|pantoprazolo)\b/i,
  ranitidine: /\b(ranitidine|zantac|ranitidina|ranitidino)\b/i,
  
  // Allergy medications
  diphenhydramine: /\b(diphenhydramine|benadryl|diphenhydramina)\b/i,
  loratadine: /\b(loratadine|claritin|loratadina)\b/i,
  cetirizine: /\b(cetirizine|zyrtec|cetirizina)\b/i,
  fexofenadine: /\b(fexofenadine|allegra|fexofenadina)\b/i,
  montelukast: /\b(montelukast|singulair|montelukasta)\b/i,
  
  // Respiratory medications
  albuterol: /\b(albuterol|salbutamol|ventolin|proventil|albuterolo)\b/i,
  prednisone: /\b(prednisone|deltasone|prednisona)\b/i,
  dexamethasone: /\b(dexamethasone|decadron|dexametasona)\b/i,
  hydrocortisone: /\b(hydrocortisone|cortef|hydrocortisona)\b/i,
  
  // Diuretics
  furosemide: /\b(furosemide|lasix|furosemida)\b/i,
  spironolactone: /\b(spironolactone|aldactone|spironolactona)\b/i,
  
  // Beta blockers
  metoprolol: /\b(metoprolol|lopressor|toprol|metoprololo)\b/i,
  propranolol: /\b(propranolol|inderal|propranololo)\b/i,
  atenolol: /\b(atenolol|tenormin|atenololo)\b/i,
  carvedilol: /\b(carvedilol|coreg|carvedilolo)\b/i,
  
  // Calcium channel blockers
  amlodipine: /\b(amlodipine|norvasc|amlodipina)\b/i,
  nifedipine: /\b(nifedipine|adalat|procardia|nifedipina)\b/i,
  diltiazem: /\b(diltiazem|cardizem|diltiazem)\b/i,
  verapamil: /\b(verapamil|calan|verelan|verapamilo)\b/i,
  
  // Cardiac glycosides
  digoxin: /\b(digoxin|lanoxin|digoxina)\b/i,
  
  // Nitrates
  nitroglycerin: /\b(nitroglycerin|nitrostat|nitroquick|nitrolingual|nitro-bid|nitro-dur|nitro-patch|nitro-time|nitro-tab|nitro-cap|nitro-g|nitro-iv|nitro-mist|nitro-stat|nitro-sublingual|nitro-tab|nitro-time|nitro-tran|nitro-v|nitro-vas|nitro-vasodilator)\b/i
};

// Dosage and strength patterns
export const DOSAGE_PATTERNS = {
  // Basic dosage units
  mg: /\b(\d+\.?\d*)\s*(mg|milligrams?|milligrammes?)\b/i,
  ml: /\b(\d+\.?\d*)\s*(ml|milliliters?|millilitres?|cc|cubic\s*centimeters?)\b/i,
  mcg: /\b(\d+\.?\d*)\s*(mcg|micrograms?|microgrammes?|μg|ug)\b/i,
  g: /\b(\d+\.?\d*)\s*(g|grams?|grammes?)\b/i,
  IU: /\b(\d+\.?\d*)\s*(IU|international\s*units?)\b/i,
  units: /\b(\d+\.?\d*)\s*(units?|U)\b/i,
  
  // Dosage forms
  tablets: /\b(\d+\.?\d*)\s*(tablets?|tabs?|pills?)\b/i,
  capsules: /\b(\d+\.?\d*)\s*(capsules?|caps?)\b/i,
  drops: /\b(\d+\.?\d*)\s*(drops?|gtt)\b/i,
  sprays: /\b(\d+\.?\d*)\s*(sprays?|puffs?|actuations?)\b/i,
  injections: /\b(\d+\.?\d*)\s*(injections?|shots?|vials?|ampoules?|syringes?)\b/i,
  patches: /\b(\d+\.?\d*)\s*(patches?|transdermal\s*systems?)\b/i,
  suppositories: /\b(\d+\.?\d*)\s*(suppositories?|supps?)\b/i,
  
  // Administration routes
  oral: /\b(oral|orally|by\s*mouth|po|per\s*os)\b/i,
  sublingual: /\b(sublingual|sublingually|sl|under\s*tongue)\b/i,
  buccal: /\b(buccal|buccally|cheek)\b/i,
  rectal: /\b(rectal|rectally|pr|per\s*rectum)\b/i,
  vaginal: /\b(vaginal|vaginally|pv|per\s*vaginam)\b/i,
  intramuscular: /\b(intramuscular|im|intramuscularly)\b/i,
  intravenous: /\b(intravenous|iv|intravenously)\b/i,
  subcutaneous: /\b(subcutaneous|sc|subcutaneously|subcut)\b/i,
  topical: /\b(topical|topically|external|for\s*external\s*use)\b/i,
  inhalation: /\b(inhalation|inhaled|inhaler|nebulizer)\b/i,
  nasal: /\b(nasal|nasally|intranasal)\b/i,
  ophthalmic: /\b(ophthalmic|eye|ocular|ophthalmically)\b/i,
  otic: /\b(otic|ear|auricular|otically)\b/i
};

// Manufacturer patterns
export const MANUFACTURER_PATTERNS = {
  // Major pharmaceutical companies
  pfizer: /\b(pfizer|pfizer\s*inc|pfizer\s*ltd|pfizer\s*pharmaceuticals)\b/i,
  gsk: /\b(gsk|glaxosmithkline|glaxo\s*smith\s*kline|glaxo\s*kline|smithkline\s*beecham)\b/i,
  merck: /\b(merck|merck\s*sharp\s*dohme|msd|merck\s*&?\s*co|merck\s*pharmaceuticals)\b/i,
  novartis: /\b(novartis|novartis\s*pharmaceuticals|novartis\s*ag|novartis\s*ltd)\b/i,
  roche: /\b(roche|roche\s*pharmaceuticals|hoffmann\s*la\s*roche|roche\s*ltd)\b/i,
  sanofi: /\b(sanofi|sanofi\s*aventis|sanofi\s*synthelabo|sanofi\s*pharmaceuticals)\b/i,
  astrazeneca: /\b(astrazeneca|astra\s*zeneca|astrazeneca\s*plc|astrazeneca\s*pharmaceuticals)\b/i,
  johnson: /\b(johnson\s*&?\s*johnson|jnj|janssen|janssen\s*pharmaceuticals|mcneil)\b/i,
  bayer: /\b(bayer|bayer\s*healthcare|bayer\s*pharmaceuticals|bayer\s*ag)\b/i,
  boehringer: /\b(boehringer|boehringer\s*ingelheim|boehringer\s*ingelheim\s*pharmaceuticals)\b/i,
  eliLilly: /\b(eli\s*lilly|eli\s*lilly\s*and\s*company|lilly|lilly\s*pharmaceuticals)\b/i,
  abbott: /\b(abbott|abbott\s*laboratories|abbott\s*pharmaceuticals)\b/i,
  bristolMyers: /\b(bristol\s*meyers|bristol\s*meyers\s*squibb|bms|squibb)\b/i,
  amgen: /\b(amgen|amgen\s*inc|amgen\s*pharmaceuticals)\b/i,
  biogen: /\b(biogen|biogen\s*inc|biogen\s*pharmaceuticals)\b/i,
  gilead: /\b(gilead|gilead\s*sciences|gilead\s*pharmaceuticals)\b/i,
  regeneron: /\b(regeneron|regeneron\s*pharmaceuticals|regeneron\s*inc)\b/i,
  moderna: /\b(moderna|moderna\s*inc|moderna\s*pharmaceuticals)\b/i,
  biontech: /\b(biontech|biontech\s*se|biontech\s*pharmaceuticals)\b/i
};

// Batch and expiry patterns
export const BATCH_EXPIRY_PATTERNS = {
  // Batch number patterns
  batchNumber: /\b(batch|lot|serial|number|code|id|identifier|reference|ref|tracking|trace|traceability)\s*:?\s*([A-Z0-9\-_]{3,20})\b/i,
  
  // Expiry date patterns
  expiryDate: /\b(exp|expiry|expiration|expires|use\s*by|best\s*before|bb|bbf)\s*:?\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})\b/i,
  
  // Manufacturing date patterns
  mfgDate: /\b(mfg|manufacture|manufacturing|made|produced|packaged)\s*:?\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})\b/i,
  
  // Date formats
  dateFormats: [
    /\b\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}\b/, // MM/DD/YY or MM/DD/YYYY
    /\b\d{2,4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2}\b/, // YYYY/MM/DD
    /\b\d{1,2}\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s*\d{2,4}\b/i, // DD MMM YYYY
    /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s*\d{1,2}\s*\d{2,4}\b/i // MMM DD YYYY
  ]
};

// Regulatory patterns
export const REGULATORY_PATTERNS = {
  // Regulatory agencies
  fda: /\b(fda|food\s*and\s*drug\s*administration|us\s*fda|federal\s*drug\s*administration)\b/i,
  ema: /\b(ema|european\s*medicines\s*agency|european\s*medicines\s*authority)\b/i,
  who: /\b(who|world\s*health\s*organization|world\s*health\s*organisation)\b/i,
  nafdac: /\b(nafdac|nigerian\s*drug\s*food\s*administration|nigerian\s*drug\s*food\s*agency|nigerian\s*agency\s*for\s*food\s*and\s*drug\s*administration)\b/i,
  
  // Approval status
  approved: /\b(approved|licensed|certified|registered|authorized|validated|verified|tested|quality|assurance|control|standards|compliance|regulatory)\b/i,
  
  // Registration numbers
  regNumber: /\b(reg|registration|license|approval|certificate|permit)\s*:?\s*([A-Z0-9\-_]{5,20})\b/i
};

// Pharmaceutical terminology patterns
export const PHARMACEUTICAL_TERMINOLOGY = {
  // Dosage forms
  dosageForms: /\b(tablet|capsule|pill|dose|dosage|strength|concentration|formulation|composition|ingredients|active|inactive|excipients|preservatives|stabilizers|binders|fillers|coatings|shells|cores|layers|matrix|system|delivery|release|controlled|sustained|extended|immediate|rapid|fast|slow|gradual|prolonged|delayed|targeted|site|specific|local|systemic)\b/i,
  
  // Medical terminology
  medicalTerms: /\b(therapeutic|therapeutic|agent|compound|substance|chemical|molecule|active|ingredient|excipient|additive|preservative|stabilizer|binder|filler|coating|shell|core|layer|matrix|system|delivery|release|controlled|sustained|extended|immediate|rapid|fast|slow|gradual|prolonged|delayed|targeted|site|specific|local|systemic)\b/i,
  
  // Storage instructions
  storage: /\b(store|storage|keep|preserve|maintain|temperature|refrigerate|freeze|room\s*temperature|rt|cold|cool|dry|moisture|light|dark|airtight|sealed|unopened|opened|expires|expiry|expiration|use\s*by|best\s*before|bb|bbf)\b/i,
  
  // Administration instructions
  administration: /\b(take|administer|use|apply|swallow|chew|dissolve|crush|break|split|cut|inject|injectable|injection|shot|vial|ampoule|syringe|needle|subcutaneous|intramuscular|intravenous|iv|im|sc|subcut|oral|orally|by\s*mouth|po|per\s*os|sublingual|sublingually|sl|under\s*tongue|buccal|buccally|cheek|rectal|rectally|pr|per\s*rectum|vaginal|vaginally|pv|per\s*vaginam|topical|topically|external|for\s*external\s*use|inhalation|inhaled|inhaler|nebulizer|nasal|nasally|intranasal|ophthalmic|eye|ocular|ophthalmically|otic|ear|auricular|otically)\b/i
};

// OCR error correction mappings
export const OCR_ERROR_CORRECTIONS = {
  // Common OCR misreads for pharmaceutical text
  '0': 'O', 'O': '0', '1': 'I', 'I': '1', '5': 'S', 'S': '5',
  '8': 'B', 'B': '8', '6': 'G', 'G': '6', '2': 'Z', 'Z': '2',
  'rn': 'm', 'm': 'rn', 'cl': 'd', 'd': 'cl', 'vv': 'w', 'w': 'vv',
  'nn': 'm', 'll': 'I', 'tt': 'n'
};

// Interface for dosage information
export interface DosageInfo {
  value: number;
  unit: string;
  form?: string;
  route?: string;
  frequency?: string;
}

// Interface for drug information
export interface DrugInfo {
  name: string;
  dosage?: DosageInfo;
  manufacturer?: string;
  batchNumber?: string;
  expiryDate?: string;
  registrationNumber?: string;
  confidence: number;
}

// Validate if text contains valid drug names
export function validateDrugName(text: string): boolean {
  const normalizedText = text.toLowerCase();
  return Object.values(DRUG_NAME_PATTERNS).some(pattern => pattern.test(normalizedText));
}

// Extract structured dosage information
export function extractDosageInfo(text: string): DosageInfo | null {
  // Check for dosage patterns
  for (const [unit, pattern] of Object.entries(DOSAGE_PATTERNS)) {
    const match = text.match(pattern);
    if (match) {
      return {
        value: parseFloat(match[1]),
        unit: unit,
        form: extractDosageForm(text),
        route: extractAdministrationRoute(text)
      };
    }
  }
  return null;
}

// Extract dosage form from text
function extractDosageForm(text: string): string | undefined {
  const formPatterns = [
    { pattern: /\b(tablets?|tabs?|pills?)\b/i, form: 'tablet' },
    { pattern: /\b(capsules?|caps?)\b/i, form: 'capsule' },
    { pattern: /\b(drops?|gtt)\b/i, form: 'drops' },
    { pattern: /\b(sprays?|puffs?)\b/i, form: 'spray' },
    { pattern: /\b(injections?|shots?|vials?)\b/i, form: 'injection' },
    { pattern: /\b(patches?)\b/i, form: 'patch' },
    { pattern: /\b(suppositories?)\b/i, form: 'suppository' }
  ];

  for (const { pattern, form } of formPatterns) {
    if (pattern.test(text)) {
      return form;
    }
  }
  return undefined;
}

// Extract administration route from text
function extractAdministrationRoute(text: string): string | undefined {
  const routePatterns = [
    { pattern: /\b(oral|orally|by\s*mouth|po)\b/i, route: 'oral' },
    { pattern: /\b(sublingual|sublingually|sl)\b/i, route: 'sublingual' },
    { pattern: /\b(buccal|buccally)\b/i, route: 'buccal' },
    { pattern: /\b(rectal|rectally|pr)\b/i, route: 'rectal' },
    { pattern: /\b(vaginal|vaginally|pv)\b/i, route: 'vaginal' },
    { pattern: /\b(intramuscular|im)\b/i, route: 'intramuscular' },
    { pattern: /\b(intravenous|iv)\b/i, route: 'intravenous' },
    { pattern: /\b(subcutaneous|sc|subcut)\b/i, route: 'subcutaneous' },
    { pattern: /\b(topical|topically|external)\b/i, route: 'topical' },
    { pattern: /\b(inhalation|inhaled|inhaler)\b/i, route: 'inhalation' },
    { pattern: /\b(nasal|nasally)\b/i, route: 'nasal' },
    { pattern: /\b(ophthalmic|eye|ocular)\b/i, route: 'ophthalmic' },
    { pattern: /\b(otic|ear|auricular)\b/i, route: 'otic' }
  ];

  for (const { pattern, route } of routePatterns) {
    if (pattern.test(text)) {
      return route;
    }
  }
  return undefined;
}

// Validate and filter pharmaceutical-relevant text
export function validatePharmaceuticalText(text: string[]): string[] {
  const pharmaceuticalPatterns = [
    ...Object.values(DRUG_NAME_PATTERNS),
    ...Object.values(DOSAGE_PATTERNS),
    ...Object.values(MANUFACTURER_PATTERNS),
    ...Object.values(BATCH_EXPIRY_PATTERNS),
    ...Object.values(REGULATORY_PATTERNS),
    ...Object.values(PHARMACEUTICAL_TERMINOLOGY)
  ];

  return text.filter(line => {
    // Check if line contains pharmaceutical patterns
    return pharmaceuticalPatterns.some(pattern => {
      if (Array.isArray(pattern)) {
        return pattern.some(p => p.test(line));
      }
      return pattern.test(line);
    }) ||
           // Check for common pharmaceutical words
           /\b(drug|medicine|medication|pill|tablet|capsule|dose|dosage|mg|ml|mcg|g|IU|units?|batch|lot|exp|expiry|manufacturer|pharmaceutical|therapeutic|active|ingredient|approved|licensed|certified|quality|assurance|control|standards|compliance|regulatory|fda|ema|who|nafdac)\b/i.test(line) ||
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

// Apply OCR error correction to drug names
export function correctOCRErrors(text: string): string {
  let correctedText = text;
  
  // Apply character substitutions
  for (const [error, correction] of Object.entries(OCR_ERROR_CORRECTIONS)) {
    correctedText = correctedText.replace(new RegExp(error, 'g'), correction);
  }
  
  // Apply common pharmaceutical text corrections
  const pharmaceuticalCorrections = [
    { pattern: /\b5OOmg\b/gi, correction: '500mg' },
    { pattern: /\b1OOmg\b/gi, correction: '100mg' },
    { pattern: /\b25Omg\b/gi, correction: '250mg' },
    { pattern: /\b75Omg\b/gi, correction: '750mg' },
    { pattern: /\b1OOOmg\b/gi, correction: '1000mg' },
    { pattern: /\bparacetamOl\b/gi, correction: 'paracetamol' },
    { pattern: /\bibuprOfen\b/gi, correction: 'ibuprofen' },
    { pattern: /\baspir1n\b/gi, correction: 'aspirin' },
    { pattern: /\bamox1cillin\b/gi, correction: 'amoxicillin' },
    { pattern: /\bmetfOrm1n\b/gi, correction: 'metformin' }
  ];
  
  for (const { pattern, correction } of pharmaceuticalCorrections) {
    correctedText = correctedText.replace(pattern, correction);
  }
  
  return correctedText;
}

// Extract comprehensive drug information from text
export function extractDrugInfo(text: string[]): DrugInfo | null {
  const fullText = text.join(' ').toLowerCase();
  
  // Find drug name
  let drugName = '';
  for (const [name, pattern] of Object.entries(DRUG_NAME_PATTERNS)) {
    if (pattern.test(fullText)) {
      drugName = name;
      break;
    }
  }
  
  if (!drugName) return null;
  
  // Extract dosage information
  const dosage = extractDosageInfo(fullText);
  
  // Extract manufacturer
  let manufacturer = '';
  for (const [name, pattern] of Object.entries(MANUFACTURER_PATTERNS)) {
    if (pattern.test(fullText)) {
      manufacturer = name;
      break;
    }
  }
  
  // Extract batch number
  const batchMatch = fullText.match(BATCH_EXPIRY_PATTERNS.batchNumber);
  const batchNumber = batchMatch ? batchMatch[2] : undefined;
  
  // Extract expiry date
  const expiryMatch = fullText.match(BATCH_EXPIRY_PATTERNS.expiryDate);
  const expiryDate = expiryMatch ? expiryMatch[2] : undefined;
  
  // Extract registration number
  const regMatch = fullText.match(REGULATORY_PATTERNS.regNumber);
  const registrationNumber = regMatch ? regMatch[2] : undefined;
  
  // Calculate confidence
  const confidence = calculatePharmaceuticalConfidence(text);
  
  return {
    name: drugName,
    dosage: dosage || undefined,
    manufacturer,
    batchNumber,
    expiryDate,
    registrationNumber,
    confidence
  };
}
