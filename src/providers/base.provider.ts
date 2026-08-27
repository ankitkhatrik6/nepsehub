/**
 * INepseProvider - Pluggable Market Data Provider Interface
 * Allows seamless addition of alternative data providers (e.g. MDP, WebSockets, or mirror proxies)
 * without altering the public library API.
 */

import {
  StockQuote,
  MarketSummary,
  StockHistoryItem,
  HistoryOptions,
  StockSearchResult,
  TopPerformer,
  MostActiveStock,
} from '../types';

export interface INepseProvider {
  readonly name: string;
  readonly isOfficial: boolean;

  getQuote(symbol: string): Promise<StockQuote>;
  getMarketSummary(): Promise<MarketSummary>;
  getHistory(symbol: string, options?: HistoryOptions): Promise<StockHistoryItem[]>;
  searchStocks(query: string): Promise<StockSearchResult[]>;
  getTopGainers(): Promise<TopPerformer[]>;
  getTopLosers(): Promise<TopPerformer[]>;
  getMostActive(): Promise<MostActiveStock[]>;
}
