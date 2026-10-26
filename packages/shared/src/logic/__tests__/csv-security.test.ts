import { describe, it, expect } from 'vitest';
import { generateCsv, sanitizeCsvCell } from '../csv-security';

describe('CSV Formula Injection Prevention & Safe Generation', () => {
  it('prefixes formulas starting with =, +, -, @, tab, and CR with single quote', () => {
    expect(sanitizeCsvCell('=SUM(A1:A10)')).toBe(`"'=SUM(A1:A10)"`);
    expect(sanitizeCsvCell('+123456')).toBe(`"'+123456"`);
    expect(sanitizeCsvCell('-cmd|calc')).toBe(`"'-cmd|calc"`);
    expect(sanitizeCsvCell('@something')).toBe(`"'@something"`);
    expect(sanitizeCsvCell('\ttext')).toBe(`"'\ttext"`);
    expect(sanitizeCsvCell('\rtext')).toBe(`"'\rtext"`);
  });

  it('preserves and properly quotes regular strings and numbers', () => {
    expect(sanitizeCsvCell('Aarav Sharma')).toBe('"Aarav Sharma"');
    expect(sanitizeCsvCell(42)).toBe('"42"');
    expect(sanitizeCsvCell(null)).toBe('""');
  });

  it('escapes internal double quotes by doubling them', () => {
    expect(sanitizeCsvCell('Sharma "Family" Group')).toBe('"Sharma ""Family"" Group"');
  });

  it('generates Excel-safe CSV with UTF-8 BOM', () => {
    const headers = ['Household', 'Invited', 'Formula'];
    const rows = [
      ['Kapoor Family', 4, '=cmd|calc'],
      ['Mehta Household', 2, 'Safe text'],
    ];

    const csv = generateCsv(headers, rows, true);

    // Starts with UTF-8 BOM (\uFEFF)
    expect(csv.startsWith('\uFEFF')).toBe(true);
    // Formula escaped
    expect(csv).toContain(`"'+123456"` ? `"'=cmd|calc"` : '');
  });
});
