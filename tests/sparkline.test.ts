import { describe, it, expect } from 'vitest';
import { generateSparkline } from '../src/utils/sparkline';

describe('Sparkline Generator', () => {
  it('handles empty and single element arrays', () => {
    expect(generateSparkline([])).toBe('');
    expect(generateSparkline([500])).toBe('▄');
  });

  it('generates proportional sparkline characters', () => {
    const flat = generateSparkline([100, 100, 100]);
    expect(flat).toBe('▄▄▄');

    const uptrend = generateSparkline([10, 20, 30, 40, 50, 60, 70, 80]);
    expect(uptrend.length).toBe(8);
    expect(uptrend[0]).toBe(' ');
    expect(uptrend[uptrend.length - 1]).toBe('█');
  });
});
