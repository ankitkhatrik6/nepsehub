/**
 * nepse-cli - Types & Interfaces
 * Nepal Stock Exchange Market Data Library & CLI
 */

export interface MarketIndex {
  id: number;
  name: string;
  currentValue: number;
  change: number;
  percentageChange: number;
  high: number;
  low: number;
  previousClose: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
}

export interface MarketSummary {
  asOf: string;
  marketStatus: 'OPEN' | 'CLOSED';
  totalTurnoverRs: number;
  totalTradedShares: number;
  totalTransactions: number;
  totalScripsTraded?: number;
  indices: {
    nepse: MarketIndex;
    sensitive?: MarketIndex;
    float?: MarketIndex;
    sensitiveFloat?: MarketIndex;
  };
  subIndices?: MarketIndex[];
  rawSummary?: Record<string, number | string>;
}

export interface StockQuote {
  symbol: string;
  securityId: number;
  companyName: string;
  sector?: string;
  lastTradedPrice: number;
  closePrice: number;
  openPrice?: number;
  highPrice?: number;
  lowPrice?: number;
  previousClose: number;
  pointChange: number;
  percentageChange: number;
  totalTradedQuantity: number;
  totalTradedValue?: number;
  totalTrades?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  averageTradedPrice?: number;
  lastUpdatedTime?: string;
  activeStatus?: string;
}

export interface StockHistoryItem {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  turnover: number;
  trades?: number;
  change?: number;
  percentageChange?: number;
  averagePrice?: number;
}

export interface HistoryOptions {
  limit?: number;
  page?: number;
  startDate?: string;
  endDate?: string;
}

export interface StockSearchResult {
  symbol: string;
  securityId: number;
  companyName: string;
  sector?: string;
  activeStatus: string;
}

export interface TopPerformer {
  symbol: string;
  securityId: number;
  companyName: string;
  lastTradedPrice: number;
  pointChange: number;
  percentageChange: number;
}

export interface MostActiveStock {
  symbol: string;
  securityId: number;
  companyName: string;
  turnover?: number;
  totalTrades?: number;
  closingPrice?: number;
  lastTradedPrice?: number;
}

export interface CLICommandResult {
  success: boolean;
  data?: unknown;
  output?: string;
  error?: string;
}
