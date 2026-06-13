import { ColumnConfig } from "../types";

export function validateBooleanValue(
  value: any,
  config: Extract<ColumnConfig, { type: "boolean" }>,
  row: Record<string, any>
): { isValid: boolean; value: any; error?: { columnKey: string; receivedValue: unknown; errorMessage: string } } {
  let finalValue: boolean;

  // 1. Normalize using trueValues and falseValues
  const stringValue = String(value).trim().toLowerCase();
  const hasTrueValues = config.trueValues && config.trueValues.length > 0;
  const hasFalseValues = config.falseValues && config.falseValues.length > 0;

  if (hasTrueValues || hasFalseValues) {
    const trueValuesLower = (config.trueValues || []).map((v: any) => String(v).trim().toLowerCase());
    const falseValuesLower = (config.falseValues || []).map((v: any) => String(v).trim().toLowerCase());

    if (trueValuesLower.includes(stringValue)) {
      finalValue = true;
    } else if (falseValuesLower.includes(stringValue)) {
      finalValue = false;
    } else {
      // If explicit values are defined and it doesn't match, it's invalid
      const expected = [...(config.trueValues || []), ...(config.falseValues || [])].join(', ');
      return { 
        isValid: false, 
        value, 
        error: { 
          columnKey: config.key, 
          receivedValue: value, 
          errorMessage: `Value must be one of [${expected}]` 
        } 
      };
    }
  } else {
    // Basic fallback if trueValues/falseValues not provided
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
