import { ColumnConfig } from "../types";

export function validateStringValue(
  value: any,
  config: Extract<ColumnConfig, { type: "string" }>,
  row: Record<string, any>,
  duplicateTracker: Set<any>
): { isValid: boolean; value: any; error?: { columnKey: string; receivedValue: unknown; errorMessage: string } } {
  let finalValue = String(value ?? "");

  // 1. Duplicate Validation
  if (config.isDuplicatesAllowed === false) {
    if (duplicateTracker.has(finalValue)) {
      return { isValid: false, value: finalValue, error: { columnKey: config.key, receivedValue: finalValue, errorMessage: `Duplicate value found for ${config.key}: ${finalValue}` } };
    }
    duplicateTracker.add(finalValue);
  }

  // 2. Allowed Values Validation
  if (config.allowedValues && config.allowedValues.length > 0) {
    if (!config.allowedValues.includes(finalValue)) {
      if (config.fallbackToDefaultValue && config.defaultValue !== undefined) {
        finalValue = String(config.defaultValue);
      } else {
        return { isValid: false, value: finalValue, error: { columnKey: config.key, receivedValue: finalValue, errorMessage: `Value ${finalValue} is not in allowed values for ${config.key}` } };
      }
    }
  }

  // 3. Regex Validation
  if (config.regex) {
    const regex = new RegExp(config.regex);
    if (!regex.test(finalValue)) {
      return { isValid: false, value: finalValue, error: { columnKey: config.key, receivedValue: finalValue, errorMessage: `Value ${finalValue} does not match the required format for ${config.key}` } };
    }
  }

  // 4. Custom Validation
  if (config.customValidation) {
    const [isValid, errorMessage] = config.customValidation(finalValue, row);
    if (!isValid) {
      return { isValid: false, value: finalValue, error: { columnKey: config.key, receivedValue: finalValue, errorMessage: errorMessage || `Custom validation failed for ${config.key}` } };
    }
  }

  return { isValid: true, value: finalValue };
}
