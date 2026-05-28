import { ColumnConfig, HeadersMismatch } from "../types";

export function normalizeHeaders(
  headersSent: string[],
  columnConfigs: ColumnConfig[],
  options?: { trimHeaders?: boolean; caseInsensitiveHeaders?: boolean }
): {
  normalizedRows?: (rows: Record<string, any>[]) => Record<string, any>[];
  headersMismatch?: HeadersMismatch;
} {
  const missingHeaders: string[] = [];
  const headerToKeyMap: Record<string, string> = {};

  // Helper to normalize strings based on config
  const normalizeString = (str: string) => {
    let normalized = str;
    if (options?.trimHeaders) normalized = normalized.trim();
    if (options?.caseInsensitiveHeaders) normalized = normalized.toLowerCase();
    return normalized;
  };

  const sentHeadersSet = new Set(headersSent.map(normalizeString));

  for (const config of columnConfigs) {
    if (config.validationRequired) {
      // Find if any display name is present in sent headers
      const matchedHeader = config.displayNames.find((name) =>
        sentHeadersSet.has(normalizeString(name))
      );

      if (!matchedHeader) {
        missingHeaders.push(config.displayNames[0]); // Push the primary expected name
      }
    }

    // Map all display names to the internal key for transformation
    for (const displayName of config.displayNames) {
      if (sentHeadersSet.has(normalizeString(displayName))) {
        headerToKeyMap[normalizeString(displayName)] = config.key;
      }
    }
  }

  if (missingHeaders.length > 0) {
    return {
      headersMismatch: {
        headersRequired: missingHeaders,
        headersSent: headersSent,
      },
    };
  }

  // Return a function to normalize rows based on the mapping
  const normalizedRows = (rows: Record<string, any>[]) => {
    return rows.map((row) => {
      const newRow: Record<string, any> = {};
      for (const [sentHeader, value] of Object.entries(row)) {
        const mappedKey = headerToKeyMap[normalizeString(sentHeader)];
        if (mappedKey) {
          newRow[mappedKey] = value;
        } else {
          // If a header doesn't map to a key, keep it as is or drop it.
          // Dropping extra data might be safer, but let's keep it to be non-destructive.
          newRow[sentHeader] = value;
        }
      }
      return newRow;
    });
  };

  return { normalizedRows };
}
