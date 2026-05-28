import { ColumnConfig } from "../types";
import { validateStringValue } from "./validateStringValue";
import { validateNumberValue } from "./validateNumberValue";
import { validateBooleanValue } from "./validateBooleanValue";

export function validateRow(
  row: Record<string, any>,
  columnConfigs: ColumnConfig[],
  duplicateTrackers: Record<string, Set<any>>,
  options?: { trimValues?: boolean }
): { isValid: boolean; processedRow: Record<string, any>; errors: { columnKey: string; receivedValue: unknown; errorMessage: string }[] } {
  let isRowValid = true;
  const errors: { columnKey: string; receivedValue: unknown; errorMessage: string }[] = [];
  
  // Return a new object to avoid mutating the original row
  const processedRow = { ...row };

  for (const config of columnConfigs) {
    const { key, type } = config;
    let value = processedRow[key];

    if (options?.trimValues && typeof value === 'string') {
      value = value.trim();
    }

    // Transformation Flow
    if (config.transform) {
      try {
        value = config.transform(value, processedRow);
        processedRow[key] = value;
      } catch (error: any) {
        isRowValid = false;
        errors.push({ columnKey: key, receivedValue: value, errorMessage: `Transformation failed for column ${key}: ${error.message || error}` });
        continue; // Skip further validation for this column if transform throws
      }
    }

    if (!config.validationRequired && (value === undefined || value === null || value === '')) {
      // If validation is not required and it's empty, we might just skip the rest of checks for this column
      // But it depends on exact requirements. Assuming we continue if there's no data and not required.
      if (config.fallbackToDefaultValue && config.defaultValue !== undefined) {
         processedRow[key] = config.defaultValue;
      }
      continue;
    }

    // Validation Flow
    let validationResult;
    const tracker = duplicateTrackers[key];

    if (type === "string") {
      validationResult = validateStringValue(value, config as Extract<ColumnConfig, { type: "string" }>, processedRow, tracker);
    } else if (type === "number") {
      validationResult = validateNumberValue(value, config as Extract<ColumnConfig, { type: "number" }>, processedRow, tracker);
    } else if (type === "boolean") {
      validationResult = validateBooleanValue(value, config as Extract<ColumnConfig, { type: "boolean" }>, processedRow);
    } else {
      validationResult = { isValid: false, value, error: { columnKey: key, receivedValue: value, errorMessage: `Unknown type configuration for column ${key}` } };
    }

    processedRow[key] = validationResult.value;

    if (!validationResult.isValid) {
      isRowValid = false;
      if (validationResult.error) {
        errors.push(validationResult.error);
      }
    }
  }

  return { isValid: isRowValid, processedRow, errors };
}
