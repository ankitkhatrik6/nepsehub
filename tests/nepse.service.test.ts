import { describe, it, expect, vi } from 'vitest';
import { NepseService } from '../src/services/nepse.service';
import { INepseProvider } from '../src/providers/base.provider';
import { StockQuote, MarketSummary, StockHistoryItem, StockSearchResult } from '../src/types';

describe('NepseService', () => {
  const mockQuote: StockQuote = {
    symbol: 'NABIL',
    securityId: 131,
    companyName: 'Nabil Bank Limited',
    lastTradedPrice: 545,
    closePrice: 545,
    openPrice: 550,
    highPrice: 552,
    lowPrice: 544.2,
    previousClose: 548.5,
    pointChange: -3.5,
    percentageChange: -0.64,
    totalTradedQuantity: 38251,
    totalTradedValue: 20904592.3,
    totalTrades: 416,
    activeStatus: 'A',
  };

  const mockSummary: MarketSummary = {
    asOf: '2026-08-21T15:00:00',
    marketStatus: 'CLOSED',
    totalTurnoverRs: 4167618882.32,
    totalTradedShares: 10022765,
    totalTransactions: 59805,
    indices: {
      nepse: {
        id: 58,
        name: 'NEPSE Index',
        currentValue: 2618.72,
        change: -10.67,
        percentageChange: -0.4,
        high: 2631.28,
        low: 2614.05,
        previousClose: 2629.39,
      },
    },
  };

  const mockProvider: INepseProvider = {
    name: 'Mock NEPSE Provider',
    isOfficial: false,
    getQuote: vi.fn().mockResolvedValue(mockQuote),
    getMarketSummary: vi.fn().mockResolvedValue(mockSummary),
    getHistory: vi.fn().mockResolvedValue([
      {
        date: '2026-08-21',
        open: 550,
        high: 552,
        low: 544.2,
        close: 545,
        volume: 38251,
        turnover: 20904592.3,
        change: -3.5,
        percentageChange: -0.64,
      } as StockHistoryItem,
    ]),
    searchStocks: vi.fn().mockResolvedValue([
      {
        symbol: 'NABIL',
        securityId: 131,
        companyName: 'Nabil Bank Limited',
        activeStatus: 'A',
      } as StockSearchResult,
    ]),
    getTopGainers: vi.fn().mockResolvedValue([]),
    getTopLosers: vi.fn().mockResolvedValue([]),
    getMostActive: vi.fn().mockResolvedValue([]),
  };

  it('validates stock symbols and retrieves quote', async () => {
    const service = new NepseService(mockProvider, { enableCache: false });
    const quote = await service.getQuote('nabil');
    expect(quote.symbol).toBe('NABIL');
    expect(quote.lastTradedPrice).toBe(545);
    expect(mockProvider.getQuote).toHaveBeenCalledWith('NABIL');
  });

  it('rejects invalid or empty stock symbols', async () => {
    const service = new NepseService(mockProvider, { enableCache: false });
    await expect(service.getQuote('')).rejects.toThrow();
    await expect(service.getQuote('INVALID$$SYMBOL')).rejects.toThrow();
  });

  it('caches responses when caching is enabled', async () => {
    const quoteSpy = vi.fn().mockResolvedValue(mockQuote);
    const cachingProvider = { ...mockProvider, getQuote: quoteSpy };
    const service = new NepseService(cachingProvider, { enableCache: true, cacheTtlMs: 5000 });

    await service.getQuote('NABIL');
    await service.getQuote('NABIL');

    expect(quoteSpy).toHaveBeenCalledTimes(1);
  });

  it('retrieves market summary correctly', async () => {
    const service = new NepseService(mockProvider, { enableCache: false });
    const summary = await service.getMarketSummary();
    expect(summary.totalTransactions).toBe(59805);
    expect(summary.indices.nepse.currentValue).toBe(2618.72);
  });

  it('searches stocks by query', async () => {
    const service = new NepseService(mockProvider, { enableCache: false });
    const results = await service.searchStocks('Nabil');
    expect(results).toHaveLength(1);
    expect(results[0].symbol).toBe('NABIL');
  });
});
