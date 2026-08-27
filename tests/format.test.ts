import { describe, it, expect } from 'vitest';
import { formatRs, formatNumber, formatVolume, formatPlainChange } from '../src/utils/format';

describe('Format Utilities', () => {
  it('formats Nepalese Rupees correctly', () => {
    expect(formatRs(1234.56)).toBe('Rs. 1,234.56');
    expect(formatRs(10000000)).toBe('Rs. 1,00,00,000.00');
    expect(formatRs(null)).toBe('N/A');
    expect(formatRs(undefined)).toBe('N/A');
  });

  it('formats numbers with proper decimal precision', () => {
    expect(formatNumber(545)).toBe('545.00');
    expect(formatNumber(2618.724, 2)).toBe('2,618.72');
    expect(formatNumber(null)).toBe('N/A');
  });

  it('formats volumes as integers with regional commas', () => {
    expect(formatVolume(38251)).toBe('38,251');
    expect(formatVolume(10022765)).toBe('1,00,22,765');
    expect(formatVolume(null)).toBe('N/A');
  });

  it('formats point & percent change strings', () => {
    expect(formatPlainChange(12.5, 2.34)).toBe('+12.50 (+2.34%)');
    expect(formatPlainChange(-3.5, -0.64)).toBe('-3.50 (-0.64%)');
    expect(formatPlainChange(0, 0)).toBe('0.00 (0.00%)');
    expect(formatPlainChange(null, null)).toBe('N/A');
  });
});
