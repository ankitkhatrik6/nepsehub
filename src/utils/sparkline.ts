/**
 * Unicode Sparkline Generator for Terminal & Visualizers
 */

const TICKS = [' ', '▂', '▃', '▄', '▅', '▆', '▇', '█'];

export function generateSparkline(values: number[]): string {
  if (!values || values.length === 0) return '';
  if (values.length === 1) return '▄';

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;

  if (range === 0) {
    return '▄'.repeat(values.length);
  }

  return values
    .map((val) => {
      const normalized = (val - min) / range;
      const index = Math.min(TICKS.length - 1, Math.floor(normalized * TICKS.length));
      return TICKS[index];
    })
    .join('');
}
