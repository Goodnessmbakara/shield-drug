# Unified CSV Schema Documentation

## Overview

The Shield Drug platform uses a unified CSV schema for both upload and export operations. This schema ensures consistency across all data operations and provides comprehensive tracking and verification capabilities.

## Schema Fields

### Core Drug Information
| Field | Type | Required | Description | Validation Rules |
|-------|------|----------|-------------|------------------|
| `serial_number` | number | Yes | Sequential number for each unit in the batch | 1-1,000,000, unique within batch |
| `drug_name` | string | Yes | Name of the pharmaceutical product | 1-200 characters, alphanumeric with spaces |
| `batch_id` | string | Yes | Unique identifier for the manufacturing batch | 3-50 characters, alphanumeric with hyphens/underscores |
| `quantity` | number | Yes | Quantity per unit (typically 1 for individual QR codes) | 1-1,000,000, positive integer |
| `expiry_date` | string | Yes | Expiration date in YYYY-MM-DD format | Must be future date, valid calendar date |
| `manufacturer` | string | Yes | Name of the pharmaceutical manufacturer | 2-100 characters, consistent naming |
| `location` | string | Yes | Manufacturing or storage location | 2-200 characters, recommended: "City, Country" |
| `nafdac_number` | string | Yes | NAFDAC registration number | Format: NAFDAC-123456 (6 digits) |
| `manufacturing_date` | string | Yes | Date of manufacture in YYYY-MM-DD format | Must be past date, valid calendar date |
| `active_ingredient` | string | Yes | Primary active pharmaceutical ingredient | 2-200 characters, standardized naming |
| `dosage_form` | string | Yes | Form of the medication (tablet, capsule, injection, etc.) | Predefined list: tablet, capsule, injection, syrup, cream, etc. |
| `strength` | string | Yes | Dosage strength (e.g., "500mg", "20mg/120mg") | 1-50 characters, standard units (mg, mcg, g, ml) |
| `package_size` | string | Yes | Number of units per package | 1-50 characters, descriptive format |
| `storage_conditions` | string | Yes | Recommended storage conditions | 2-200 characters, standardized recommendations |
| `description` | string | No | Additional description or notes | 0-500 characters, optional |

### Environmental Data
| Field | Type | Required | Description | Validation Rules |
|-------|------|----------|-------------|------------------|
| `temperature` | string | No | Storage temperature (e.g., "25°C", "Store below 30°C") | 0-50 characters, temperature format |
| `humidity` | string | No | Storage humidity conditions (e.g., "65%", "Store in dry place") | 0-50 characters, humidity format |

### Blockchain and Verification Data
| Field | Type | Required | Description | Validation Rules |
|-------|------|----------|-------------|------------------|
| `qr_code_id` | string | Yes | Unique QR code identifier | Auto-generated, format: QR_[BATCH_ID]_[SERIAL] |
| `blockchain_tx` | string | Yes | Blockchain transaction hash | Auto-generated, 64-character hex string |
| `file_hash` | string | Yes | SHA-256 hash of the original upload file | Auto-generated, 64-character hex string |

### Timestamps
| Field | Type | Required | Description | Validation Rules |
|-------|------|----------|-------------|------------------|
| `created_date` | string | Yes | ISO 8601 timestamp when the batch was created | Auto-generated, ISO 8601 format |
| `upload_date` | string | No | ISO 8601 timestamp when the file was uploaded | Auto-generated, ISO 8601 format |

### Quality and Compliance Data
| Field | Type | Required | Description | Validation Rules |
|-------|------|----------|-------------|------------------|
| `quality_score` | number | No | Quality assessment score (0-100) | 0-100, decimal precision 2 |
| `compliance_status` | string | No | Regulatory compliance status | Predefined: Compliant, Non-Compliant, Pending |
| `regulatory_approval` | string | No | Regulatory approval status | Predefined: Approved, Pending, Rejected |

### Verification Tracking
| Field | Type | Required | Description | Validation Rules |
|-------|------|----------|-------------|------------------|
| `verification_count` | number | No | Number of times this unit has been verified | 0-1,000,000, auto-incremented |
| `authenticity_rate` | number | No | Authenticity verification rate (0-100) | 0-100, decimal precision 2 |
| `last_verified` | string | No | ISO 8601 timestamp of last verification | Auto-generated, ISO 8601 format |

## Detailed Validation Rules

### File-Level Constraints
- **Maximum file size**: 10MB
- **Maximum rows per upload**: 100,000
- **Required format**: UTF-8 encoded CSV
- **Header row**: Must be present and match required columns exactly
- **Empty rows**: Automatically skipped during processing

### Field-Specific Validation

#### NAFDAC Number Format
- **Pattern**: `NAFDAC-` followed by exactly 6 digits
- **Examples**: `NAFDAC-123456`, `NAFDAC-789012`
- **Invalid examples**: `NAFDAC-12345` (5 digits), `NAFDAC-1234567` (7 digits), `nafdac-123456` (lowercase)

#### Date Format Validation
- **Format**: YYYY-MM-DD (ISO 8601 date format)
- **Expiry date**: Must be a future date (after current date)
- **Manufacturing date**: Must be a past date (before current date)
- **Examples**: `2025-12-31`, `2024-01-15`
- **Invalid examples**: `31-12-2025` (wrong format), `2023-12-31` (past expiry)

#### Quantity and Serial Number Constraints
- **Serial number**: Must be unique within the batch, range 1-1,000,000
- **Quantity**: Must be positive integer, range 1-1,000,000
- **Batch size**: Recommended maximum 10,000 units per batch for optimal processing

#### Drug Name and Manufacturer Validation
- **Drug name**: 1-200 characters, alphanumeric with spaces and common punctuation
- **Manufacturer**: 2-100 characters, should be consistent across batches
- **Special characters**: Allowed: letters, numbers, spaces, hyphens, parentheses
- **Prohibited**: Special characters that could cause CSV parsing issues

## Comprehensive Error Examples

### Common Validation Errors

#### 1. Missing Required Columns
```json
{
  "error": "Missing required columns: nafdac_number, expiry_date",
  "severity": "error",
  "row": 0,
  "column": "headers"
}
```

#### 2. Invalid NAFDAC Number Format
```json
{
  "error": "Invalid NAFDAC number format. Expected: NAFDAC-123456",
  "severity": "error",
  "row": 5,
  "column": "nafdac_number",
  "value": "NAFDAC-12345"
}
```

#### 3. Expired Drug (Past Expiry Date)
```json
{
  "error": "Expiry date must be in the future",
  "severity": "error",
  "row": 12,
  "column": "expiry_date",
  "value": "2023-12-31"
}
```

#### 4. Invalid Date Format
```json
{
  "error": "Invalid date format. Expected: YYYY-MM-DD",
  "severity": "error",
  "row": 8,
  "column": "manufacturing_date",
  "value": "15-01-2024"
}
```

#### 5. Quantity Validation Error
```json
{
  "error": "Quantity must be between 1 and 1,000,000",
  "severity": "error",
  "row": 3,
  "column": "quantity",
  "value": "0"
}
```

#### 6. File Size Exceeded
```json
{
  "error": "File size exceeds maximum limit of 10MB",
  "severity": "error",
  "file": "large-batch.csv",
  "size": "15.2MB"
}
```

#### 7. Row Limit Exceeded
```json
{
  "error": "Number of rows (150,000) exceeds maximum limit of 100,000",
  "severity": "error",
  "file": "large-batch.csv"
}
```

### Warning Examples

#### 1. Future Manufacturing Date
```json
{
  "warning": "Manufacturing date is in the future",
  "severity": "warning",
  "row": 7,
  "column": "manufacturing_date",
  "value": "2025-01-15"
}
```

#### 2. Large Batch Size
```json
{
  "warning": "Large batch size may affect processing time",
  "severity": "warning",
  "row": 0,
  "column": "quantity",
  "value": "50000"
}
```

#### 3. Inconsistent Manufacturer Name
```json
{
  "warning": "Manufacturer name differs from previous batches",
  "severity": "warning",
  "row": 15,
  "column": "manufacturer",
  "value": "Novartis Pharma",
  "previous": "Novartis"
}
```

## Advanced Usage Scenarios

### Large Batch Processing (>1000 units)
For batches with more than 1000 units, the system automatically:
- Generates batch-level QR codes instead of individual QR codes
- Optimizes blockchain transaction processing
- Provides progress tracking with estimated completion times
- Implements batch-level verification strategies

**Example large batch structure:**
```csv
drug_name,batch_id,quantity,manufacturer,location,expiry_date,nafdac_number,manufacturing_date,active_ingredient,dosage_form,strength,package_size,storage_conditions
Coartem,CT2024001,50000,Novartis,Lagos Nigeria,2025-12-31,NAFDAC-123456,2024-01-15,Artemether/Lumefantrine,Tablet,20mg/120mg,24 tablets per pack,Store below 30°C
```

### Small Batch Processing (<1000 units)
For smaller batches, the system:
- Generates individual QR codes for each unit
- Provides detailed tracking for each serial number
- Enables granular verification and authenticity checking
- Supports individual unit reporting and investigation

### Combination Drugs and Complex Products
For combination drugs with multiple active ingredients:
- Use standardized naming conventions (e.g., "Artemether/Lumefantrine")
- Include all active ingredients in the `active_ingredient` field
- Specify combined strength (e.g., "20mg/120mg")
- Add detailed description for complex formulations

**Example combination drug:**
```csv
drug_name,batch_id,quantity,manufacturer,location,expiry_date,nafdac_number,manufacturing_date,active_ingredient,dosage_form,strength,package_size,storage_conditions,description
Coartem,CT2024001,1000,Novartis,Lagos Nigeria,2025-12-31,NAFDAC-123456,2024-01-15,Artemether/Lumefantrine,Tablet,20mg/120mg,24 tablets per pack,Store below 30°C,Antimalarial combination therapy for uncomplicated P. falciparum malaria
```

### Optional Fields and Default Values
- **Description**: Optional field for additional notes or special instructions
- **Temperature/Humidity**: Optional environmental data for storage conditions
- **Quality Score**: Auto-calculated based on validation results and data quality
- **Compliance Status**: Auto-assigned based on regulatory requirements

## Processing Pipeline Documentation

### Complete Upload Flow

1. **File Validation** (0-30 seconds)
   - File size and format validation
   - Header row verification
   - Basic CSV structure validation

2. **Data Validation** (30 seconds - 5 minutes)
   - Field-level validation for each row
   - Business rule validation (dates, quantities, formats)
   - Duplicate detection and consistency checks

3. **Blockchain Recording** (1-10 minutes)
   - Batch data hashing and blockchain transaction creation
   - Smart contract interaction for data recording
   - Transaction confirmation and verification

4. **QR Code Generation** (1-15 minutes)
   - Individual QR codes for small batches (<1000 units)
   - Batch QR codes for large batches (≥1000 units)
   - QR code metadata embedding and blockchain linking

5. **Database Storage** (30 seconds - 2 minutes)
   - Structured data storage in MongoDB
   - Audit trail creation and indexing
   - Export format preparation

6. **Progress Tracking** (Real-time)
   - Real-time progress updates via WebSocket
   - Estimated completion time calculation
   - Error reporting and recovery mechanisms

### Batch vs Individual QR Code Strategies

#### Individual QR Codes (<1000 units)
- **Format**: `QR_[BATCH_ID]_[SERIAL_NUMBER]`
- **Metadata**: Full drug information, blockchain transaction hash
- **Verification**: Individual unit tracking and authenticity checking
- **Use case**: High-value drugs, detailed tracking requirements

#### Batch QR Codes (≥1000 units)
- **Format**: `QR_BATCH_[BATCH_ID]`
- **Metadata**: Batch summary, blockchain transaction hash, serial number range
- **Verification**: Batch-level verification with individual serial number lookup
- **Use case**: High-volume manufacturing, cost-effective tracking

## Integration Examples

### API Integration for Programmatic Uploads

#### Upload Request Example
```javascript
const formData = new FormData();
formData.append('file', csvFile);
formData.append('manufacturer', 'Novartis');
formData.append('batchId', 'CT2024001');

const response = await fetch('/api/manufacturer/upload-batch', {
  method: 'POST',
  headers: {
    'x-user-role': 'manufacturer',
    'x-user-email': 'manufacturer@example.com'
  },
  body: formData
});

const result = await response.json();
console.log('Upload ID:', result.uploadId);
console.log('Progress URL:', result.progressUrl);
```

#### Progress Tracking Example
```javascript
const progressResponse = await fetch(`/api/manufacturer/upload-progress/${uploadId}`, {
  headers: {
    'x-user-role': 'manufacturer',
    'x-user-email': 'manufacturer@example.com'
  }
});

const progress = await progressResponse.json();
console.log('Status:', progress.status);
console.log('Progress:', progress.progress);
console.log('Estimated completion:', progress.estimatedCompletion);
```

### Unified Export Format Integration

#### Export Request Example
```javascript
const exportResponse = await fetch('/api/manufacturer/batch-details/${batchId}/export', {
  headers: {
    'x-user-role': 'manufacturer',
    'x-user-email': 'manufacturer@example.com'
  }
});

const csvData = await exportResponse.text();
// csvData contains the complete unified CSV format with all tracking data
```

#### Data Transformation Example
```javascript
// Transform upload data to export format
const exportData = generateUnifiedCSVExport(batchData, qrCodes, {
  quality_score: 95,
  compliance_status: 'Compliant',
  regulatory_approval: 'Approved'
});

const csvString = convertToCSV(exportData);
```

## Production Considerations

### Recommended Batch Sizes
- **Optimal**: 1,000-5,000 units per batch
- **Maximum**: 100,000 units per batch
- **Large batches**: Consider splitting for better performance
- **Small batches**: Individual QR codes for detailed tracking

### CSV File Preparation Guidelines
- **Encoding**: Always use UTF-8 encoding
- **Line endings**: Use Unix line endings (LF) or Windows line endings (CRLF)
- **Quoting**: Quote fields containing commas, quotes, or line breaks
- **Validation**: Pre-validate data using provided validation tools
- **Backup**: Keep original files for audit purposes

### Performance Optimization
- **File size**: Keep files under 5MB for optimal processing
- **Row count**: Process in batches of 10,000 rows for large datasets
- **Network**: Use stable internet connection for large uploads
- **Timing**: Avoid peak usage hours for large batch uploads

### Data Retention and Audit Trail
- **Upload files**: Retained for 7 years for regulatory compliance
- **Processing logs**: Maintained for audit and troubleshooting
- **Blockchain data**: Immutable and permanently stored
- **Export data**: Available for download for 5 years

### Backup and Recovery
- **Database backups**: Daily automated backups
- **File storage**: Redundant storage with geographic distribution
- **Blockchain**: Immutable backup through distributed ledger
- **Recovery procedures**: Documented disaster recovery processes

## Template and Sample Data

### Downloadable CSV Template
```csv
drug_name,batch_id,quantity,manufacturer,location,expiry_date,nafdac_number,manufacturing_date,active_ingredient,dosage_form,strength,package_size,storage_conditions,description
[Enter drug name],[Enter batch ID],[Enter quantity],[Enter manufacturer],[Enter location],[YYYY-MM-DD],[NAFDAC-123456],[YYYY-MM-DD],[Enter active ingredient],[tablet/capsule/injection],[Enter strength],[Enter package size],[Enter storage conditions],[Optional description]
```

### Sample Data Examples

#### Valid Sample Row
```csv
Coartem,CT2024001,1000,Novartis,Lagos Nigeria,2025-12-31,NAFDAC-123456,2024-01-15,Artemether/Lumefantrine,Tablet,20mg/120mg,24 tablets per pack,Store below 30°C,Antimalarial medication for uncomplicated P. falciparum malaria
```

#### Invalid Sample Row (for testing)
```csv
Coartem,CT2024001,0,Novartis,Lagos Nigeria,2023-12-31,NAFDAC-12345,2024-01-15,Artemether/Lumefantrine,Tablet,20mg/120mg,24 tablets per pack,Store below 30°C,Antimalarial medication
```

### Sample File Generation
The system includes a sample file generation function that creates test data with various scenarios:
- Valid data for successful uploads
- Invalid data for testing error handling
- Edge cases for validation testing
- Large datasets for performance testing

## Usage Examples

### Upload Format (Input)
When uploading a batch, only the core drug information fields are required:

```csv
drug_name,batch_id,quantity,manufacturer,location,expiry_date,nafdac_number,manufacturing_date,active_ingredient,dosage_form,strength,package_size,storage_conditions,description
Coartem,CT2024001,10000,Novartis,Lagos Nigeria,2025-12-31,NAFDAC-123456,2024-01-15,Artemether/Lumefantrine,Tablet,20mg/120mg,24 tablets per pack,Store below 30°C,Antimalarial medication
```

### Export Format (Output)
When exporting processed data, all fields are included:

```csv
serial_number,drug_name,batch_id,quantity,expiry_date,manufacturer,location,nafdac_number,manufacturing_date,active_ingredient,dosage_form,strength,package_size,storage_conditions,description,temperature,humidity,qr_code_id,blockchain_tx,file_hash,created_date,upload_date,quality_score,compliance_status,regulatory_approval,verification_count,authenticity_rate,last_verified
1,Coartem,CT2024001,1,2025-12-31,Novartis,Lagos Nigeria,NAFDAC-123456,2024-01-15,Artemether/Lumefantrine,Tablet,20mg/120mg,24 tablets per pack,Store below 30°C,Antimalarial medication,25°C,65%,QR_CT2024001_001,0x1234567890abcdef...,sha256_hash_here,2024-01-15T10:30:00Z,2024-01-15T10:30:00Z,95,Compliant,Approved,0,100,
```

## Implementation Details

### File Locations
- **Sample file**: `public/unified-sample-batch.csv`
- **Type definitions**: `src/lib/types.ts` (UnifiedCSVExport interface)
- **Utility functions**: `src/lib/utils.ts` (generateUnifiedCSVExport, convertToCSV)
- **Validation**: `src/lib/validation.ts` (for upload format validation)

### Key Functions

#### `generateUnifiedCSVExport(batchData, qrCodes, additionalData)`
Generates unified CSV export data from batch details and QR codes.

#### `convertToCSV(data)`
Converts unified CSV export data to CSV string format with proper escaping.

### Data Flow
1. **Upload**: Users upload CSV with core drug information
2. **Processing**: System generates QR codes and blockchain transactions
3. **Export**: System exports unified format with all tracking data

## Benefits

1. **Consistency**: Same schema for upload and export operations
2. **Completeness**: Includes all necessary tracking and verification data
3. **Extensibility**: Easy to add new fields without breaking existing functionality
4. **Compliance**: Supports regulatory requirements and audit trails
5. **Interoperability**: Standard format for integration with external systems

## Migration Notes

- Existing upload functionality remains unchanged
- Export functionality now uses unified format
- Backward compatibility maintained for existing data
- New fields are optional and populated when available
