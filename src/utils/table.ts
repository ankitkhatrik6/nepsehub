/**
 * nepse-cli - CLI Table Formatting Helpers
 */

import Table from 'cli-table3';
import pc from 'picocolors';
import {
  StockQuote,
  MarketSummary,
  StockHistoryItem,
  TopPerformer,
  MostActiveStock,
  StockSearchResult,
} from '../types';
import { formatRs, formatNumber, formatVolume, formatChange } from './format';
import { generateSparkline } from './sparkline';

export function renderStockQuoteTable(quote: StockQuote): string {
  const table = new Table({
    head: [pc.bold(pc.cyan('Field')), pc.bold(pc.cyan('Value'))],
    colWidths: [24, 46],
    style: { head: [], border: ['gray'] },
  });

  table.push(
    ['Symbol', pc.bold(pc.yellow(quote.symbol))],
    ['Company Name', pc.white(quote.companyName)],
    ['Sector', pc.gray(quote.sector || 'N/A')],
    ['Last Traded Price (LTP)', pc.bold(formatRs(quote.lastTradedPrice))],
    ['Close Price', formatRs(quote.closePrice)],
    ['Point Change', formatChange(quote.pointChange, quote.percentageChange)],
    ['Open Price', formatRs(quote.openPrice)],
    ['Day High / Low', `${formatRs(quote.highPrice)} / ${formatRs(quote.lowPrice)}`],
    ['52-Week High / Low', `${formatRs(quote.fiftyTwoWeekHigh)} / ${formatRs(quote.fiftyTwoWeekLow)}`],
    ['Total Traded Volume', formatVolume(quote.totalTradedQuantity) + ' shares'],
    ['Total Turnover', formatRs(quote.totalTradedValue)],
    ['Total Trades', formatNumber(quote.totalTrades, 0)],
    ['Avg Traded Price', formatRs(quote.averageTradedPrice)],
    ['Last Updated', pc.gray(quote.lastUpdatedTime || new Date().toISOString())]
  );

  return table.toString();
}

export function renderMarketSummaryTable(summary: MarketSummary): string {
  const statusColor = summary.marketStatus === 'OPEN' ? pc.green('● OPEN') : pc.red('■ CLOSED');

  const header = `\n${pc.bold('NEPSE MARKET SUMMARY')}  [${statusColor}${pc.reset(']')}   ${pc.gray(summary.asOf)}\n`;

  const statsTable = new Table({
    head: [pc.bold(pc.cyan('Metric')), pc.bold(pc.cyan('Value'))],
    colWidths: [26, 40],
    style: { head: [], border: ['gray'] },
  });

  statsTable.push(
    ['Total Turnover', pc.bold(formatRs(summary.totalTurnoverRs))],
    ['Total Traded Shares', formatVolume(summary.totalTradedShares)],
    ['Total Transactions', formatVolume(summary.totalTransactions)]
  );

  const indexTable = new Table({
    head: [
      pc.bold(pc.cyan('Index')),
      pc.bold(pc.cyan('Current')),
      pc.bold(pc.cyan('Change')),
      pc.bold(pc.cyan('High / Low')),
      pc.bold(pc.cyan('52W High / Low')),
    ],
    style: { head: [], border: ['gray'] },
  });

  const indices = [
    summary.indices.nepse,
    summary.indices.sensitive,
    summary.indices.float,
    summary.indices.sensitiveFloat,
  ].filter(Boolean);

  indices.forEach((idx) => {
    if (!idx) return;
    indexTable.push([
      pc.bold(pc.yellow(idx.name)),
      pc.bold(formatNumber(idx.currentValue)),
      formatChange(idx.change, idx.percentageChange),
      `${formatNumber(idx.high)} / ${formatNumber(idx.low)}`,
      idx.fiftyTwoWeekHigh
        ? `${formatNumber(idx.fiftyTwoWeekHigh)} / ${formatNumber(idx.fiftyTwoWeekLow)}`
        : 'N/A',
    ]);
  });

  return `${header}\n${statsTable.toString()}\n\n${pc.bold('Major Indices:')}\n${indexTable.toString()}`;
}

export function renderHistoryTable(symbol: string, history: StockHistoryItem[]): string {
  if (history.length === 0) {
    return pc.yellow(`No price history records found for ${symbol}.`);
  }

  const closes = history.map((h) => h.close).reverse();
  const sparkline = generateSparkline(closes);

  const table = new Table({
    head: [
      pc.bold(pc.cyan('Date')),
      pc.bold(pc.cyan('Open')),
      pc.bold(pc.cyan('High')),
      pc.bold(pc.cyan('Low')),
      pc.bold(pc.cyan('Close')),
      pc.bold(pc.cyan('Change (%)')),
      pc.bold(pc.cyan('Volume')),
      pc.bold(pc.cyan('Turnover')),
    ],
    style: { head: [], border: ['gray'] },
  });

  history.forEach((h) => {
    table.push([
      pc.gray(h.date),
      formatNumber(h.open),
      formatNumber(h.high),
      formatNumber(h.low),
      pc.bold(formatNumber(h.close)),
      formatChange(h.change, h.percentageChange),
      formatVolume(h.volume),
      formatRs(h.turnover),
    ]);
  });

  return `\n${pc.bold(`Historical Prices for ${pc.yellow(symbol)}`)} (Recent ${history.length} Sessions)\nTrend: ${pc.cyan(sparkline)}\n\n${table.toString()}`;
}

export function renderTopPerformersTable(title: string, performers: TopPerformer[]): string {
  const table = new Table({
    head: [
      pc.bold(pc.cyan('#')),
      pc.bold(pc.cyan('Symbol')),
      pc.bold(pc.cyan('Company Name')),
      pc.bold(pc.cyan('LTP (Rs.)')),
      pc.bold(pc.cyan('Point Change')),
      pc.bold(pc.cyan('% Change')),
    ],
    style: { head: [], border: ['gray'] },
  });

  performers.forEach((p, idx) => {
    table.push([
      pc.gray((idx + 1).toString()),
      pc.bold(pc.yellow(p.symbol)),
      p.companyName,
      pc.bold(formatNumber(p.lastTradedPrice)),
      formatChange(p.pointChange),
      formatChange(p.pointChange, p.percentageChange),
    ]);
  });

  return `\n${pc.bold(title)}\n${table.toString()}`;
}

export function renderMostActiveTable(stocks: MostActiveStock[]): string {
  const table = new Table({
    head: [
      pc.bold(pc.cyan('#')),
      pc.bold(pc.cyan('Symbol')),
      pc.bold(pc.cyan('Company Name')),
      pc.bold(pc.cyan('Turnover (Rs.)')),
      pc.bold(pc.cyan('Closing Price (Rs.)')),
    ],
    style: { head: [], border: ['gray'] },
  });

  stocks.forEach((s, idx) => {
    table.push([
      pc.gray((idx + 1).toString()),
      pc.bold(pc.yellow(s.symbol)),
      s.companyName,
      pc.bold(formatRs(s.turnover)),
      s.closingPrice ? formatRs(s.closingPrice) : 'N/A',
    ]);
  });

  return `\n${pc.bold('Most Active Stocks by Turnover')}\n${table.toString()}`;
}

export function renderSearchResultsTable(results: StockSearchResult[]): string {
  if (results.length === 0) {
    return pc.yellow('No matching stocks found on NEPSE.');
  }

  const table = new Table({
    head: [
      pc.bold(pc.cyan('Symbol')),
      pc.bold(pc.cyan('Security ID')),
      pc.bold(pc.cyan('Company Name')),
      pc.bold(pc.cyan('Status')),
    ],
    style: { head: [], border: ['gray'] },
  });

  results.forEach((r) => {
    table.push([
      pc.bold(pc.yellow(r.symbol)),
      pc.gray(r.securityId.toString()),
      r.companyName,
      r.activeStatus === 'A' ? pc.green('Active') : pc.red(r.activeStatus),
    ]);
  });

  return `\n${pc.bold(`Search Results (${results.length} found)`)}\n${table.toString()}`;
}
