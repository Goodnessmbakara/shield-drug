# Unified CSV Schema Documentation

## Overview

The Shield Drug platform uses a unified CSV schema for both upload and export operations. This schema ensures consistency across all data operations and provides comprehensive tracking and verification capabilities.

## Schema Fields

### Core Drug Information
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `serial_number` | number | Yes | Sequential number for each unit in the batch |
| `drug_name` | string | Yes | Name of the pharmaceutical product |
| `batch_id` | string | Yes | Unique identifier for the manufacturing batch |
| `quantity` | number | Yes | Quantity per unit (typically 1 for individual QR codes) |
| `expiry_date` | string | Yes | Expiration date in YYYY-MM-DD format |
| `manufacturer` | string | Yes | Name of the pharmaceutical manufacturer |
| `location` | string | Yes | Manufacturing or storage location |
| `nafdac_number` | string | Yes | NAFDAC registration number (format: NAFDAC-123456) |
| `manufacturing_date` | string | Yes | Date of manufacture in YYYY-MM-DD format |
| `active_ingredient` | string | Yes | Primary active pharmaceutical ingredient |
| `dosage_form` | string | Yes | Form of the medication (tablet, capsule, injection, etc.) |
| `strength` | string | Yes | Dosage strength (e.g., "500mg", "20mg/120mg") |
| `package_size` | string | Yes | Number of units per package |
| `storage_conditions` | string | Yes | Recommended storage conditions |
| `description` | string | No | Additional description or notes |

### Environmental Data
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `temperature` | string | No | Storage temperature (e.g., "25°C", "Store below 30°C") |
| `humidity` | string | No | Storage humidity conditions (e.g., "65%", "Store in dry place") |

### Blockchain and Verification Data
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `qr_code_id` | string | Yes | Unique QR code identifier |
| `blockchain_tx` | string | Yes | Blockchain transaction hash |
| `file_hash` | string | Yes | SHA-256 hash of the original upload file |

### Timestamps
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `created_date` | string | Yes | ISO 8601 timestamp when the batch was created |
| `upload_date` | string | No | ISO 8601 timestamp when the file was uploaded |

### Quality and Compliance Data
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `quality_score` | number | No | Quality assessment score (0-100) |
| `compliance_status` | string | No | Regulatory compliance status |
| `regulatory_approval` | string | No | Regulatory approval status |

### Verification Tracking
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `verification_count` | number | No | Number of times this unit has been verified |
| `authenticity_rate` | number | No | Authenticity verification rate (0-100) |
| `last_verified` | string | No | ISO 8601 timestamp of last verification |

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
