/**
 * nepse-cli - Number & Currency Formatting Utilities
 */

import pc from 'picocolors';

export function formatRs(amount?: number | null, decimals = 2): string {
  if (amount === undefined || amount === null || isNaN(amount)) return 'N/A';
  return (
    'Rs. ' +
    amount.toLocaleString('en-IN', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })
  );
}

export function formatNumber(num?: number | null, decimals = 2): string {
  if (num === undefined || num === null || isNaN(num)) return 'N/A';
  return num.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatVolume(num?: number | null): string {
  if (num === undefined || num === null || isNaN(num)) return 'N/A';
  return num.toLocaleString('en-IN');
}

export function formatChange(change?: number | null, percent?: number | null): string {
  if (change === undefined || change === null || isNaN(change)) return 'N/A';
  const sign = change > 0 ? '+' : '';
  const formattedChange = `${sign}${formatNumber(change, 2)}`;
  const formattedPercent =
    percent !== undefined && percent !== null && !isNaN(percent)
      ? ` (${sign}${formatNumber(percent, 2)}%)`
      : '';

  const full = `${formattedChange}${formattedPercent}`;
  if (change > 0) return pc.green(full);
  if (change < 0) return pc.red(full);
  return pc.gray(full);
}

export function formatPlainChange(change?: number | null, percent?: number | null): string {
  if (change === undefined || change === null || isNaN(change)) return 'N/A';
  const sign = change > 0 ? '+' : '';
  const formattedChange = `${sign}${formatNumber(change, 2)}`;
  const formattedPercent =
    percent !== undefined && percent !== null && !isNaN(percent)
      ? ` (${sign}${formatNumber(percent, 2)}%)`
      : '';
  return `${formattedChange}${formattedPercent}`;
}
