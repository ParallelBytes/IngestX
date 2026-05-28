import { ColumnConfig } from "../types";

export function validateBooleanValue(
  value: any,
  config: Extract<ColumnConfig, { type: "boolean" }>,
  row: Record<string, any>
): { isValid: boolean; value: any; error?: { columnKey: string; receivedValue: unknown; errorMessage: string } } {
  let finalValue: boolean;

  // 1. Normalize using trueValues and Convert to boolean
  if (config.trueValues && config.trueValues.length > 0) {
    const stringValue = String(value).trim().toLowerCase();
    const trueValuesLower = config.trueValues.map((v: any) => String(v).trim().toLowerCase());
    finalValue = trueValuesLower.includes(stringValue);
  } else {
    // Basic fallback if trueValues not provided
    finalValue = Boolean(value);
    if (typeof value === 'string') {
       finalValue = value.trim().toLowerCase() === 'true';
    }
  }

  // 2. Custom Validation
  if (config.customValidation) {
    const [isValid, errorMessage] = config.customValidation(finalValue, row);
    if (!isValid) {
      return { isValid: false, value: finalValue, error: { columnKey: config.key, receivedValue: finalValue, errorMessage: errorMessage || `Custom validation failed for ${config.key}` } };
    }
  }

  return { isValid: true, value: finalValue };
}
