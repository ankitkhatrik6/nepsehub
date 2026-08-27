/**
 * NepseService - Core Business & Data Orchestration Service
 * Shared by both the Library API and CLI Commands.
 */

import { z } from 'zod';
import { INepseProvider } from '../providers/base.provider';
import { NepseOfficialProvider } from '../providers/nepse-official.provider';
import {
  StockQuote,
  MarketSummary,
  StockHistoryItem,
  HistoryOptions,
  StockSearchResult,
  TopPerformer,
  MostActiveStock,
} from '../types';

const symbolSchema = z
  .string()
  .trim()
  .min(1, 'Stock symbol cannot be empty.')
  .max(15, 'Stock symbol is too long.')
  .regex(/^[A-Za-z0-9\-_]+$/, 'Stock symbol contains invalid characters.');

const historyOptionsSchema = z
  .object({
    limit: z.number().int().min(1).max(200).optional(),
    page: z.number().int().min(0).optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  })
  .optional();

export interface ServiceCacheOptions {
  enableCache?: boolean;
  cacheTtlMs?: number;
}

export class NepseService {
  private provider: INepseProvider;
  private cache = new Map<string, { data: unknown; expiresAt: number }>();
  private defaultCacheTtlMs = 15000; // 15s cache
  private enableCache = true;

  constructor(provider?: INepseProvider, options?: ServiceCacheOptions) {
    this.provider = provider || new NepseOfficialProvider();
    if (options?.enableCache !== undefined) {
      this.enableCache = options.enableCache;
    }
    if (options?.cacheTtlMs !== undefined) {
      this.defaultCacheTtlMs = options.cacheTtlMs;
    }
  }

  /**
   * Switches the active provider
   */
  public setProvider(provider: INepseProvider): void {
    this.provider = provider;
    this.clearCache();
  }

  /**
   * Clears in-memory service cache
   */
  public clearCache(): void {
    this.cache.clear();
  }

  private getFromCache<T>(key: string): T | null {
    if (!this.enableCache) return null;
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return entry.data as T;
  }

  private setCache(key: string, data: unknown, ttlMs?: number): void {
    if (!this.enableCache) return;
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + (ttlMs ?? this.defaultCacheTtlMs),
    });
  }

  /**
   * Retrieves a real-time stock quote
   */
  public async getQuote(symbol: string): Promise<StockQuote> {
    const validatedSymbol = symbolSchema.parse(symbol).toUpperCase();
    const cacheKey = `quote:${validatedSymbol}`;
    const cached = this.getFromCache<StockQuote>(cacheKey);
    if (cached) return cached;

    try {
      const quote = await this.provider.getQuote(validatedSymbol);
      this.setCache(cacheKey, quote, 10000); // 10s TTL
      return quote;
    } catch (err: unknown) {
      const error = err as Error;
      throw new Error(`Failed to get quote for '${validatedSymbol}': ${error.message}`);
    }
  }

  /**
   * Retrieves overall NEPSE market summary and indices
   */
  public async getMarketSummary(): Promise<MarketSummary> {
    const cacheKey = 'market:summary';
    const cached = this.getFromCache<MarketSummary>(cacheKey);
    if (cached) return cached;

    try {
      const summary = await this.provider.getMarketSummary();
      this.setCache(cacheKey, summary, 15000); // 15s TTL
      return summary;
    } catch (err: unknown) {
      const error = err as Error;
      throw new Error(`Failed to fetch market summary: ${error.message}`);
    }
  }

  /**
   * Retrieves historical OHLCV data for a ticker
   */
  public async getHistory(symbol: string, options?: HistoryOptions): Promise<StockHistoryItem[]> {
    const validatedSymbol = symbolSchema.parse(symbol).toUpperCase();
    const validOptions = historyOptionsSchema.parse(options);

    const cacheKey = `history:${validatedSymbol}:${validOptions?.limit || 20}:${validOptions?.page || 0}`;
    const cached = this.getFromCache<StockHistoryItem[]>(cacheKey);
    if (cached) return cached;

    try {
      const history = await this.provider.getHistory(validatedSymbol, validOptions);
      this.setCache(cacheKey, history, 60000); // 1 min TTL for history
      return history;
    } catch (err: unknown) {
      const error = err as Error;
      throw new Error(`Failed to fetch history for '${validatedSymbol}': ${error.message}`);
    }
  }

  /**
   * Searches listed stocks by ticker or company name
   */
  public async searchStocks(query: string): Promise<StockSearchResult[]> {
    const q = (query || '').trim();
    if (!q) return [];

    const cacheKey = `search:${q.toLowerCase()}`;
    const cached = this.getFromCache<StockSearchResult[]>(cacheKey);
    if (cached) return cached;

    try {
      const results = await this.provider.searchStocks(q);
      this.setCache(cacheKey, results, 60000);
      return results;
    } catch (err: unknown) {
      const error = err as Error;
      throw new Error(`Search failed for '${query}': ${error.message}`);
    }
  }

  /**
   * Retrieves top gainers
   */
  public async getTopGainers(): Promise<TopPerformer[]> {
    const cacheKey = 'top:gainers';
    const cached = this.getFromCache<TopPerformer[]>(cacheKey);
    if (cached) return cached;

    try {
      const gainers = await this.provider.getTopGainers();
      this.setCache(cacheKey, gainers, 15000);
      return gainers;
    } catch (err: unknown) {
      const error = err as Error;
      throw new Error(`Failed to fetch top gainers: ${error.message}`);
    }
  }

  /**
   * Retrieves top losers
   */
  public async getTopLosers(): Promise<TopPerformer[]> {
    const cacheKey = 'top:losers';
    const cached = this.getFromCache<TopPerformer[]>(cacheKey);
    if (cached) return cached;

    try {
      const losers = await this.provider.getTopLosers();
      this.setCache(cacheKey, losers, 15000);
      return losers;
    } catch (err: unknown) {
      const error = err as Error;
      throw new Error(`Failed to fetch top losers: ${error.message}`);
    }
  }

  /**
   * Retrieves top active stocks by turnover
   */
  public async getMostActive(): Promise<MostActiveStock[]> {
    const cacheKey = 'top:active';
    const cached = this.getFromCache<MostActiveStock[]>(cacheKey);
    if (cached) return cached;

    try {
      const active = await this.provider.getMostActive();
      this.setCache(cacheKey, active, 15000);
      return active;
    } catch (err: unknown) {
      const error = err as Error;
      throw new Error(`Failed to fetch most active stocks: ${error.message}`);
    }
  }
}

// Global default singleton instance
export const defaultNepseService = new NepseService();
