# Shield Drug - Test CSV Files for Manufacturer Batch Upload

This directory contains comprehensive test CSV files for testing the manufacturer batch upload feature in the Shield Drug application.

## 📁 File Overview

### ✅ Valid Test Files

| File | Description | Rows | Purpose |
|------|-------------|------|---------|
| `valid-batch-1.csv` | Common pharmaceutical drugs | 5 | Basic functionality testing |
| `valid-batch-2.csv` | Different dosage forms (liquid, injectable) | 5 | Various medication types |
| `large-batch.csv` | High-volume batch with 10 drugs | 10 | Bulk upload testing |
| `specialty-drugs.csv` | Controlled substances & biologics | 10 | Specialty medication testing |
| `malaria-drugs.csv` | Antimalarial medications | 10 | Nigeria-specific testing |

### ⚠️ Error Testing Files

| File | Description | Rows | Purpose |
|------|-------------|------|---------|
| `invalid-batch-errors.csv` | Various validation errors | 10 | Error handling testing |
| `warnings-batch.csv` | Non-critical warnings | 10 | Warning system testing |

## 🧪 Testing Scenarios

### 1. **Basic Functionality Testing**
- Use: `valid-batch-1.csv` or `valid-batch-2.csv`
- Expected: Successful upload with QR code generation
- Tests: File parsing, validation, blockchain recording

### 2. **Bulk Upload Testing**
- Use: `large-batch.csv`
- Expected: Successful processing of large batches
- Tests: Performance, memory usage, batch processing

### 3. **Error Handling Testing**
- Use: `invalid-batch-errors.csv`
- Expected: Validation errors with specific error messages
- Tests: Error reporting, user feedback, validation rules

### 4. **Warning System Testing**
- Use: `warnings-batch.csv`
- Expected: Upload succeeds with warnings
- Tests: Warning display, non-blocking issues

### 5. **Specialty Drug Testing**
- Use: `specialty-drugs.csv`
- Expected: Proper handling of controlled substances
- Tests: Special storage requirements, regulatory compliance

### 6. **Malaria Drug Testing**
- Use: `malaria-drugs.csv`
- Expected: Nigeria-specific drug handling
- Tests: Local pharmaceutical requirements

## 📋 CSV Format Requirements

### Required Columns
- `drug_name` - Name of the pharmaceutical product
- `batch_id` - Unique batch identifier (alphanumeric, hyphens, underscores)
- `quantity` - Number of units in the batch (positive integer)
- `manufacturer` - Pharmaceutical manufacturer name
- `location` - Manufacturing or storage location
- `expiry_date` - Expiration date (YYYY-MM-DD format, future date)
- `nafdac_number` - NAFDAC registration number (NAFDAC-123456 format)
- `manufacturing_date` - Manufacturing date (YYYY-MM-DD format)
- `active_ingredient` - Primary active ingredient
- `dosage_form` - Form of medication (tablet, capsule, injection, etc.)
- `strength` - Drug strength/concentration
- `package_size` - Package description
- `storage_conditions` - Storage requirements

### Optional Columns
- `description` - Additional product description

## 🔍 Validation Rules

### Critical Errors (Upload Fails)
- Missing required fields
- Invalid date formats
- Expired products
- Zero or negative quantities
- Invalid NAFDAC number format

### Warnings (Upload Succeeds)
- Very long drug names (>100 characters)
- Special characters in batch IDs
- Large quantities (>1,000,000)
- Non-standard NAFDAC number format

## 🚀 How to Use

1. **Start the application:**
   ```bash
   pnpm dev
   ```

2. **Navigate to manufacturer dashboard:**
   ```
   http://localhost:3000/manufacturer
   ```

3. **Upload test files:**
   - Click "Upload Batch" button
   - Select one of the CSV files from this directory
   - Monitor validation results and blockchain processing

4. **Test different scenarios:**
   - Start with `valid-batch-1.csv` for basic testing
   - Try `invalid-batch-errors.csv` to test error handling
   - Use `large-batch.csv` for performance testing

## 📊 Expected Results

### Successful Upload
- ✅ File validation passes
- ✅ Blockchain transaction recorded
- ✅ QR codes generated for each unit
- ✅ Upload history updated
- ✅ Success message displayed

### Failed Upload
- ❌ Validation errors displayed
- ❌ Specific error messages for each issue
- ❌ Upload blocked until errors fixed
- ❌ No blockchain transaction

### Upload with Warnings
- ⚠️ Upload succeeds
- ⚠️ Warning messages displayed
- ⚠️ User can proceed or fix warnings
- ✅ Blockchain transaction recorded

## 🔧 Troubleshooting

### Common Issues
1. **File not found:** Ensure CSV files are in the correct directory
2. **Validation errors:** Check CSV format against requirements
3. **Blockchain errors:** Verify environment variables are set
4. **Database errors:** Ensure MongoDB connection is configured

### Environment Setup
Make sure your `.env.local` file contains:
```env
DATABASE_URL=mongodb://localhost:27017/shield-drug
AVALANCHE_RPC_URL=https://api.avax-test.network/ext/bc/C/rpc
AVALANCHE_PRIVATE_KEY=your_private_key_here
AVALANCHE_CONTRACT_ADDRESS=your_contract_address_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 📈 Performance Testing

For performance testing with large datasets:
1. Use `large-batch.csv` as a baseline
2. Create larger files by duplicating rows
3. Monitor upload time and memory usage
4. Test with maximum allowed rows (100,000)

## 🔒 Security Testing

For security testing:
1. Test with files containing special characters
2. Verify input sanitization
3. Check for SQL injection prevention
4. Test file size limits (10MB max)

---

**Note:** These test files are designed for development and testing purposes. Do not use them in production environments.

