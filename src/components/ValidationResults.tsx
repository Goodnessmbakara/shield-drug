import React from "react";
import { ValidationError, ValidationResult } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertTriangle, CheckCircle, XCircle, Info } from "lucide-react";

interface ValidationResultsProps {
  validationResult: ValidationResult;
  onClose?: () => void;
}

export function ValidationResults({
  validationResult,
  onClose,
}: ValidationResultsProps) {
  const { errors, warnings, totalRows, validRows, invalidRows } =
    validationResult;

  const getSeverityIcon = (severity: "error" | "warning") => {
    return severity === "error" ? (
      <XCircle className="h-4 w-4 text-red-500" />
    ) : (
      <AlertTriangle className="h-4 w-4 text-yellow-500" />
    );
  };

  const getSeverityColor = (severity: "error" | "warning") => {
    return severity === "error" ? "text-red-600" : "text-yellow-600";
  };

  const getSeverityBadge = (severity: "error" | "warning") => {
    return severity === "error" ? (
      <Badge variant="destructive" className="text-xs">
        Error
      </Badge>
    ) : (
      <Badge variant="secondary" className="text-xs">
        Warning
      </Badge>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Validation Results
          </CardTitle>
          {onClose && (
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
            >
              ×
            </button>
          )}
        </div>
        <CardDescription>
          File validation completed with {errors.length} errors and{" "}
          {warnings.length} warnings
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-2xl font-bold text-foreground">
              {totalRows}
            </div>
            <div className="text-xs text-muted-foreground">Total Rows</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{validRows}</div>
            <div className="text-xs text-muted-foreground">Valid Rows</div>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{invalidRows}</div>
            <div className="text-xs text-muted-foreground">Invalid Rows</div>
          </div>
          <div className="text-center p-3 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">
              {warnings.length}
            </div>
            <div className="text-xs text-muted-foreground">Warnings</div>
          </div>
        </div>

        {/* Validation Status */}
        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
          {errors.length === 0 ? (
            <>
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="font-medium text-green-700">
                Validation passed! All data is ready for upload.
              </span>
            </>
          ) : (
            <>
              <XCircle className="h-5 w-5 text-red-500" />
              <span className="font-medium text-red-700">
                Validation failed. Please fix the errors before uploading.
              </span>
            </>
          )}
        </div>

        {/* Errors Section */}
        {errors.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-red-700 flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              Errors ({errors.length})
            </h4>
            <div className="max-h-60 overflow-y-auto space-y-2">
              {errors.map((error, index) => (
                <div
                  key={index}
                  className="p-3 border border-red-200 rounded-lg bg-red-50"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 flex-1">
                      {getSeverityIcon(error.severity)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">
                            Row {error.row}, Column: {error.column}
                          </span>
                          {getSeverityBadge(error.severity)}
                        </div>
                        <p className="text-sm text-red-700">{error.message}</p>
                        {error.value && (
                          <p className="text-xs text-red-600 mt-1">
                            Value: "{error.value}"
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Warnings Section */}
        {warnings.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-yellow-700 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Warnings ({warnings.length})
            </h4>
            <div className="max-h-60 overflow-y-auto space-y-2">
              {warnings.map((warning, index) => (
                <div
                  key={index}
                  className="p-3 border border-yellow-200 rounded-lg bg-yellow-50"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 flex-1">
                      {getSeverityIcon(warning.severity)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">
                            Row {warning.row}, Column: {warning.column}
                          </span>
                          {getSeverityBadge(warning.severity)}
                        </div>
                        <p className="text-sm text-yellow-700">
                          {warning.message}
                        </p>
                        {warning.value && (
                          <p className="text-xs text-yellow-600 mt-1">
                            Value: "{warning.value}"
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {errors.length === 0 ? (
              <span className="text-green-600">
                ✓ Ready to upload {validRows} valid records
              </span>
            ) : (
              <span className="text-red-600">
                ✗ Please fix {errors.length} errors before uploading
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
