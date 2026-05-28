import { ColumnConfig } from "../types";

export function validateNumberValue(
  value: any,
  config: Extract<ColumnConfig, { type: "number" }>,
  row: Record<string, any>,
  duplicateTracker: Set<any>
): { isValid: boolean; value: any; error?: { columnKey: string; receivedValue: unknown; errorMessage: string } } {
  // 1. Convert to number
  let finalValue = Number(value);

  // 2. Invalid number check
  if (isNaN(finalValue)) {
    if (config.fallbackToDefaultValue && config.defaultValue !== undefined) {
      finalValue = Number(config.defaultValue);
    } else {
      return { isValid: false, value, error: { columnKey: config.key, receivedValue: value, errorMessage: `Invalid number format for ${config.key}: ${value}` } };
    }
  }

  // 3. Duplicate Validation
  if (config.isDuplicatesAllowed === false) {
    if (duplicateTracker.has(finalValue)) {
      return { isValid: false, value: finalValue, error: { columnKey: config.key, receivedValue: finalValue, errorMessage: `Duplicate value found for ${config.key}: ${finalValue}` } };
    }
    duplicateTracker.add(finalValue);
  }

  // 4. Min Validation
  if (config.min !== undefined && finalValue < config.min) {
    return { isValid: false, value: finalValue, error: { columnKey: config.key, receivedValue: finalValue, errorMessage: `Value ${finalValue} is less than the minimum allowed (${config.min}) for ${config.key}` } };
  }

  // 5. Max Validation
  if (config.max !== undefined && finalValue > config.max) {
    return { isValid: false, value: finalValue, error: { columnKey: config.key, receivedValue: finalValue, errorMessage: `Value ${finalValue} is greater than the maximum allowed (${config.max}) for ${config.key}` } };
  }

  // 6. Allowed Values Validation
  if (config.allowedValues && config.allowedValues.length > 0) {
    // Treat allowedValues for numbers by coercing to string for generic config, 
    // or keep them as strings depending on how config is typed, but typical is string[]
    const stringifiedAllowed = config.allowedValues.map(String);
    if (!stringifiedAllowed.includes(String(finalValue))) {
      if (config.fallbackToDefaultValue && config.defaultValue !== undefined) {
        finalValue = Number(config.defaultValue);
      } else {
        return { isValid: false, value: finalValue, error: { columnKey: config.key, receivedValue: finalValue, errorMessage: `Value ${finalValue} is not in allowed values for ${config.key}` } };
      }
    }
  }

  // 7. Custom Validation
  if (config.customValidation) {
    const [isValid, errorMessage] = config.customValidation(finalValue, row);
    if (!isValid) {
      return { isValid: false, value: finalValue, error: { columnKey: config.key, receivedValue: finalValue, errorMessage: errorMessage || `Custom validation failed for ${config.key}` } };
    }
  }

  return { isValid: true, value: finalValue };
}
