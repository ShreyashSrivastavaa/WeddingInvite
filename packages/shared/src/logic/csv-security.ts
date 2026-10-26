const DANGEROUS_PREFIXES = ['=', '+', '-', '@', '\t', '\r'];

/**
 * Sanitizes a cell value to prevent CSV Formula Injection (CWE-1236).
 * If a cell begins with =, +, -, @, tab or CR, it is prefixed with a single quote (').
 * Also properly escapes quotes and wraps in quotes when necessary.
 */
export function sanitizeCsvCell(raw: unknown): string {
  if (raw === null || raw === undefined) {
    return '""';
  }

  let str = String(raw);

  // Check if starts with a formula trigger
  if (DANGEROUS_PREFIXES.some((prefix) => str.startsWith(prefix))) {
    str = `'${str}`;
  }

  // Escape existing double quotes by doubling them
  const escaped = str.replace(/"/g, '""');

  // Wrap in quotes if it contains commas, quotes, newlines, or begins with a quote
  if (/[",\r\n]/.test(escaped) || escaped.startsWith("'")) {
    return `"${escaped}"`;
  }

  return `"${escaped}"`;
}

/**
 * Generates an Excel-safe CSV string with UTF-8 BOM by default.
 */
export function generateCsv(
  headers: string[],
  rows: (unknown)[][],
  includeBom = true
): string {
  const headerLine = headers.map(sanitizeCsvCell).join(',');
  const rowLines = rows.map((row) => row.map(sanitizeCsvCell).join(','));

  const csvBody = [headerLine, ...rowLines].join('\r\n');
  return includeBom ? `\uFEFF${csvBody}` : csvBody;
}
