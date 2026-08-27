import { defaultNepseService, NepseService } from './services/nepse.service';
import {
  StockQuote,
  MarketSummary,
  StockHistoryItem,
  HistoryOptions,
  StockSearchResult,
  TopPerformer,
  MostActiveStock,
} from './types';

// public library functions bound to default service
export async function getQuote(symbol: string): Promise<StockQuote> {
  return defaultNepseService.getQuote(symbol);
}

export async function getMarketSummary(): Promise<MarketSummary> {
  return defaultNepseService.getMarketSummary();
}

export async function getHistory(
  symbol: string,
  options?: HistoryOptions
): Promise<StockHistoryItem[]> {
  return defaultNepseService.getHistory(symbol, options);
}

export async function searchStocks(query: string): Promise<StockSearchResult[]> {
  return defaultNepseService.searchStocks(query);
}

export async function getTopGainers(): Promise<TopPerformer[]> {
  return defaultNepseService.getTopGainers();
}

export async function getTopLosers(): Promise<TopPerformer[]> {
  return defaultNepseService.getTopLosers();
}

export async function getMostActive(): Promise<MostActiveStock[]> {
  return defaultNepseService.getMostActive();
}

// Export classes, providers and types
export { NepseService, defaultNepseService };
export * from './providers';
export * from './types';
export * from './utils/format';
export * from './utils/sparkline';
export * from './utils/table';
export * from './commands';
