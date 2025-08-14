import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText, Package, Calendar, Hash, Users, AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface CSVRow {
  drug_name: string;
  batch_id: string;
  quantity: number;
  expiry_date: string;
  manufacturer: string;
  [key: string]: any;
}

interface CSVPreviewProps {
  csvData: CSVRow[];
  fileName: string;
  onClose: () => void;
}

export function CSVPreview({ csvData, fileName, onClose }: CSVPreviewProps) {
  const [showAllRecords, setShowAllRecords] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Analyze CSV data
  const analysis = analyzeCSVData(csvData);

  // Validate CSV data
  useEffect(() => {
    const errors = validateCSVData(csvData);
    setValidationErrors(errors);
  }, [csvData]);

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-lg">CSV Data Preview</CardTitle>
              <CardDescription>{fileName}</CardDescription>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-2xl font-bold text-primary">{analysis.totalRecords}</div>
            <div className="text-sm text-muted-foreground">Total Records</div>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-2xl font-bold text-success">{analysis.totalQuantity.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">Total Quantity</div>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-2xl font-bold text-secondary">{analysis.uniqueDrugs}</div>
            <div className="text-sm text-muted-foreground">Unique Drugs</div>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-2xl font-bold text-warning">{analysis.uniqueBatches}</div>
            <div className="text-sm text-muted-foreground">Unique Batches</div>
          </div>
        </div>

        {/* Validation Status */}
        {validationErrors.length > 0 ? (
          <div className="p-4 border border-red-200 rounded-lg bg-red-50">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span className="font-medium text-red-700">Validation Issues Found</span>
            </div>
            <ul className="text-sm text-red-600 space-y-1">
              {validationErrors.slice(0, 3).map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
              {validationErrors.length > 3 && (
                <li>• ... and {validationErrors.length - 3} more issues</li>
              )}
            </ul>
          </div>
        ) : (
          <div className="p-4 border border-green-200 rounded-lg bg-green-50">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="font-medium text-green-700">CSV data looks good!</span>
            </div>
          </div>
        )}

        {/* Data Summary */}
        <div className="space-y-3">
          <h4 className="font-medium flex items-center gap-2">
            <Info className="h-4 w-4" />
            Data Summary
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground mb-1">Primary Drug</p>
              <p className="font-medium">{analysis.primaryDrug}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Primary Manufacturer</p>
              <p className="font-medium">{analysis.primaryManufacturer}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Earliest Expiry</p>
              <p className="font-medium">{analysis.earliestExpiry}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Latest Expiry</p>
              <p className="font-medium">{analysis.latestExpiry}</p>
            </div>
          </div>
        </div>

        {/* Sample Records */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Sample Records</h4>
            {csvData.length > 5 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAllRecords(!showAllRecords)}
              >
                {showAllRecords ? 'Show Less' : `Show All (${csvData.length})`}
              </Button>
            )}
          </div>
          
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">Drug</TableHead>
                  <TableHead className="w-[100px]">Batch ID</TableHead>
                  <TableHead className="w-[80px]">Quantity</TableHead>
                  <TableHead className="w-[100px]">Expiry</TableHead>
                  <TableHead>Manufacturer</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(showAllRecords ? csvData : csvData.slice(0, 5)).map((row, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium text-sm">
                      {row.drug_name}
                    </TableCell>
                    <TableCell className="text-sm font-mono">
                      {row.batch_id}
                    </TableCell>
                    <TableCell className="text-sm">
                      {row.quantity.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-sm">
                      {new Date(row.expiry_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-sm">
                      {row.manufacturer}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {!showAllRecords && csvData.length > 5 && (
            <p className="text-sm text-muted-foreground text-center">
              Showing first 5 of {csvData.length} records
            </p>
          )}
        </div>

        {/* Unique Drugs List */}
        {analysis.uniqueDrugs > 1 && (
          <div className="space-y-2">
            <h4 className="font-medium">Drugs in Batch</h4>
            <div className="flex flex-wrap gap-2">
              {analysis.drugsList.map((drug, index) => (
                <Badge key={index} variant="outline">
                  {drug}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Helper functions
function analyzeCSVData(csvData: CSVRow[]) {
  const totalRecords = csvData.length;
  const totalQuantity = csvData.reduce((sum, row) => sum + (row.quantity || 0), 0);
  
  const uniqueDrugs = new Set(csvData.map(row => row.drug_name)).size;
  const uniqueBatches = new Set(csvData.map(row => row.batch_id)).size;
  
  const drugsList = Array.from(new Set(csvData.map(row => row.drug_name)));
  
  const primaryDrug = csvData[0]?.drug_name || 'Unknown';
  const primaryManufacturer = csvData[0]?.manufacturer || 'Unknown';
  
  const expiryDates = csvData
    .map(row => new Date(row.expiry_date))
    .filter(date => !isNaN(date.getTime()))
    .sort((a, b) => a.getTime() - b.getTime());
  
  const earliestExpiry = expiryDates.length > 0 
    ? expiryDates[0].toLocaleDateString() 
    : 'Unknown';
  const latestExpiry = expiryDates.length > 0 
    ? expiryDates[expiryDates.length - 1].toLocaleDateString() 
    : 'Unknown';

  return {
    totalRecords,
    totalQuantity,
    uniqueDrugs,
    uniqueBatches,
    drugsList,
    primaryDrug,
    primaryManufacturer,
    earliestExpiry,
    latestExpiry
  };
}

function validateCSVData(csvData: CSVRow[]): string[] {
  const errors: string[] = [];
  
  csvData.forEach((row, index) => {
    if (!row.drug_name || row.drug_name.trim() === '') {
      errors.push(`Row ${index + 1}: Missing drug name`);
    }
    if (!row.batch_id || row.batch_id.trim() === '') {
      errors.push(`Row ${index + 1}: Missing batch ID`);
    }
    if (!row.quantity || row.quantity <= 0) {
      errors.push(`Row ${index + 1}: Invalid quantity`);
    }
    if (!row.expiry_date || isNaN(new Date(row.expiry_date).getTime())) {
      errors.push(`Row ${index + 1}: Invalid expiry date`);
    }
    if (!row.manufacturer || row.manufacturer.trim() === '') {
      errors.push(`Row ${index + 1}: Missing manufacturer`);
    }
  });
  
  return errors;
}
