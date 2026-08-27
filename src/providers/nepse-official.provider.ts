/**
 * Official NEPSE Exchange API Data Provider
 * Connects directly to nepalstock.com.np NOTS endpoints with token deobfuscation.
 */

import { INepseProvider } from './base.provider';
import {
  StockQuote,
  MarketSummary,
  StockHistoryItem,
  HistoryOptions,
  StockSearchResult,
  TopPerformer,
  MostActiveStock,
  MarketIndex,
} from '../types';
import { NepseTokenResponse, parseTokenResponse } from '../utils/token';

export interface NepseSecurityItem {
  id: number;
  symbol: string;
  securityName: string;
  name?: string;
  activeStatus: string;
}

export interface NepseTradeStatItem {
  securityId: string;
  securityName: string;
  symbol: string;
  indexId: number;
  totalTradeQuantity: number;
  lastTradedPrice: number;
  percentageChange: number;
  previousClose: number;
  closePrice: number;
  openPrice?: number;
  highPrice?: number;
  lowPrice?: number;
  totalTradedValue?: number;
  totalTrades?: number;
}

export interface NepseIndexItem {
  id: number;
  index: string;
  currentValue?: number;
  close?: number;
  change?: number;
  perChange?: number;
  high?: number;
  low?: number;
  previousClose?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
}

export class NepseOfficialProvider implements INepseProvider {
  public readonly name = 'NEPSE Official Exchange Provider';
  public readonly isOfficial = true;

  private baseUrl = 'https://nepalstock.com.np';
  private accessToken: string | null = null;
  private tokenTimestamp: number = 0;
  private tokenTtlSec = 40; // 40 seconds TTL
  private isAuthenticating: Promise<string> | null = null;

  private securityCache: NepseSecurityItem[] | null = null;
  private securityCacheTime = 0;
  private securityCacheTtlMs = 15 * 60 * 1000; // 15 minutes

  private requestTimeoutMs = 12000;

  /**
   * Acquires or reuses a deobfuscated access token
   */
  private async getAccessToken(forceRefresh = false): Promise<string> {
    const now = Math.floor(Date.now() / 1000);
    if (!forceRefresh && this.accessToken && now - this.tokenTimestamp < this.tokenTtlSec) {
      return this.accessToken;
    }

    if (this.isAuthenticating) {
      return this.isAuthenticating;
    }

    this.isAuthenticating = (async () => {
      try {
        const url = `${this.baseUrl}/api/authenticate/prove`;
        const headers = {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'application/json, text/plain, */*',
          Host: 'nepalstock.com.np',
          Referer: 'https://nepalstock.com.np/',
        };

        const res = await fetch(url, {
          headers,
          signal: AbortSignal.timeout(this.requestTimeoutMs),
        });

        if (!res.ok) {
          throw new Error(`Token request failed with HTTP ${res.status} ${res.statusText}`);
        }

        const data = (await res.json()) as NepseTokenResponse;
        const { accessToken } = await parseTokenResponse(data);

        this.accessToken = accessToken;
        this.tokenTimestamp = Math.floor(Date.now() / 1000);
        return accessToken;
      } finally {
        this.isAuthenticating = null;
      }
    })();

    return this.isAuthenticating;
  }

  /**
   * Performs an authenticated GET request to NEPSE NOTS endpoints
   */
  private async get<T>(endpoint: string, retryCount = 1): Promise<T> {
    const token = await this.getAccessToken();
    const url = `${this.baseUrl}${endpoint}`;

    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Accept: 'application/json, text/plain, */*',
      Host: 'nepalstock.com.np',
      Referer: 'https://nepalstock.com.np/',
      Authorization: `Salter ${token}`,
    };

    try {
      const res = await fetch(url, {
        headers,
        signal: AbortSignal.timeout(this.requestTimeoutMs),
      });

      if (res.status === 401 && retryCount > 0) {
        // Token expired or invalid, refresh and retry once
        await this.getAccessToken(true);
        return this.get<T>(endpoint, retryCount - 1);
      }

      if (!res.ok) {
        throw new Error(`NEPSE API error: ${res.status} ${res.statusText} for ${endpoint}`);
      }

      return (await res.json()) as T;
    } catch (err: unknown) {
      const error = err as Error;
      if (error.name === 'TimeoutError') {
        throw new Error(`NEPSE API request timed out for endpoint ${endpoint}`);
      }
      throw error;
    }
  }

  /**
   * Fetches the comprehensive list of listed active securities
   */
  public async getSecurityList(force = false): Promise<NepseSecurityItem[]> {
    const now = Date.now();
    if (!force && this.securityCache && now - this.securityCacheTime < this.securityCacheTtlMs) {
      return this.securityCache;
    }

    try {
      const list = await this.get<NepseSecurityItem[]>('/api/nots/security?nonDelisted=true');
      if (Array.isArray(list) && list.length > 0) {
        this.securityCache = list;
        this.securityCacheTime = now;
        return list;
      }
    } catch {
      if (this.securityCache) return this.securityCache;
    }

    return this.securityCache || [];
  }

  /**
   * Finds a security record by its ticker symbol
   */
  public async findSecurityBySymbol(symbol: string): Promise<NepseSecurityItem | null> {
    const normalized = symbol.trim().toUpperCase();
    const list = await this.getSecurityList();
    return list.find((s) => s.symbol.toUpperCase() === normalized) || null;
  }

  /**
   * Returns real-time stock quote for a ticker symbol
   */
  public async getQuote(symbol: string): Promise<StockQuote> {
    const normalized = symbol.trim().toUpperCase();
    if (!normalized) {
      throw new Error('Stock symbol is required.');
    }

    // 1. Get security list to verify symbol and obtain securityId
    const security = await this.findSecurityBySymbol(normalized);

    // 2. Fetch daily trade stats for main index (58)
    const tradeStats = await this.get<NepseTradeStatItem[]>('/api/nots/securityDailyTradeStat/58');
    const stat = tradeStats.find((s) => s.symbol.toUpperCase() === normalized);

    // 3. Fetch latest history record for detailed metrics (high, low, open, 52W, trades)
    let historyDetails: Record<string, unknown> | null = null;
    const secId = security ? security.id : stat ? parseInt(stat.securityId, 10) : null;

    if (secId) {
      try {
        const hist = await this.get<{ content: Array<Record<string, unknown>> }>(
          `/api/nots/market/security/price/${secId}?page=0&size=1`
        );
        if (hist.content && hist.content.length > 0) {
          historyDetails = hist.content[0];
        }
      } catch {
        // Continue with available stat data
      }
    }

    if (!stat && !historyDetails && !security) {
      throw new Error(`Symbol '${normalized}' not found on Nepal Stock Exchange.`);
    }

    const companyName =
      security?.securityName ||
      stat?.securityName ||
      (historyDetails?.security as Record<string, unknown>)?.securityName as string ||
      normalized;

    const lastTradedPrice = stat?.lastTradedPrice ?? (historyDetails?.lastTradedPrice as number) ?? 0;
    const closePrice = stat?.closePrice ?? (historyDetails?.closePrice as number) ?? lastTradedPrice;
    const previousClose =
      stat?.previousClose ??
      (historyDetails?.previousDayClosePrice as number) ??
      closePrice;

    const pointChange =
      stat?.lastTradedPrice && previousClose
        ? Number((stat.lastTradedPrice - previousClose).toFixed(2))
        : (historyDetails?.pointChange as number) ?? 0;

    const percentageChange =
      stat?.percentageChange !== undefined
        ? Number(stat.percentageChange.toFixed(2))
        : previousClose > 0
        ? Number(((pointChange / previousClose) * 100).toFixed(2))
        : 0;

    const openPrice = (historyDetails?.openPrice as number) ?? stat?.openPrice ?? previousClose;
    const highPrice = (historyDetails?.highPrice as number) ?? stat?.highPrice ?? Math.max(lastTradedPrice, openPrice);
    const lowPrice = (historyDetails?.lowPrice as number) ?? stat?.lowPrice ?? Math.min(lastTradedPrice, openPrice);
    const totalTradedQuantity = stat?.totalTradeQuantity ?? (historyDetails?.totalTradedQuantity as number) ?? 0;
    const totalTradedValue = stat?.totalTradedValue ?? (historyDetails?.totalTradedValue as number) ?? 0;
    const totalTrades = (historyDetails?.totalTrades as number) ?? stat?.totalTrades ?? 0;
    const fiftyTwoWeekHigh = historyDetails?.fiftyTwoWeekHigh as number | undefined;
    const fiftyTwoWeekLow = historyDetails?.fiftyTwoWeekLow as number | undefined;
    const averageTradedPrice = (historyDetails?.averageTradedPrice as number) ?? undefined;
    const lastUpdatedTime = (historyDetails?.lastUpdatedTime as string) ?? (historyDetails?.businessDate as string) ?? undefined;

    let sector: string | undefined;
    const companyObj = (historyDetails?.security as Record<string, unknown>)?.companyId as Record<string, unknown> | undefined;
    if (companyObj?.sectorMaster) {
      sector = (companyObj.sectorMaster as Record<string, unknown>).sectorDescription as string;
    }

    return {
      symbol: normalized,
      securityId: secId || 0,
      companyName,
      sector,
      lastTradedPrice,
      closePrice,
      openPrice,
      highPrice,
      lowPrice,
      previousClose,
      pointChange,
      percentageChange,
      totalTradedQuantity,
      totalTradedValue,
      totalTrades,
      fiftyTwoWeekHigh,
      fiftyTwoWeekLow,
      averageTradedPrice,
      lastUpdatedTime,
      activeStatus: security?.activeStatus || 'A',
    };
  }

  /**
   * Returns current NEPSE market summary and major indices
   */
  public async getMarketSummary(): Promise<MarketSummary> {
    const [summaryItems, indices, marketOpen] = await Promise.all([
      this.get<Array<{ detail: string; value: number | string }>>('/api/nots/market-summary/').catch(() => []),
      this.get<NepseIndexItem[]>('/api/nots/nepse-index').catch(() => []),
      this.get<{ isOpen?: string; asOf?: string; id?: number }>('/api/nots/nepse-data/market-open').catch(
        (): { isOpen?: string; asOf?: string; id?: number } => ({})
      ),
    ]);

    const summaryMap: Record<string, number> = {};
    summaryItems.forEach((item) => {
      const val = typeof item.value === 'string' ? parseFloat(item.value.replace(/,/g, '')) : item.value;
      summaryMap[item.detail] = isNaN(val) ? 0 : val;
    });

    const totalTurnoverRs =
      summaryMap['Total Turnover Rs:'] || summaryMap['Total Turnover Rs'] || summaryMap['Turnover'] || 0;
    const totalTradedShares =
      summaryMap['Total Traded Shares'] || summaryMap['Total Shares'] || 0;
    const totalTransactions =
      summaryMap['Total Transactions'] || summaryMap['Total Trades'] || 0;

    const findIndex = (nameKeywords: string[]): MarketIndex => {
      const found = indices.find((idx) =>
        nameKeywords.some((k) => idx.index.toLowerCase().includes(k.toLowerCase()))
      );
      if (!found) {
        return {
          id: 0,
          name: nameKeywords[0],
          currentValue: 0,
          change: 0,
          percentageChange: 0,
          high: 0,
          low: 0,
          previousClose: 0,
        };
      }
      return {
        id: found.id,
        name: found.index,
        currentValue: found.currentValue || found.close || 0,
        change: found.change || 0,
        percentageChange: found.perChange || 0,
        high: found.high || 0,
        low: found.low || 0,
        previousClose: found.previousClose || 0,
        fiftyTwoWeekHigh: found.fiftyTwoWeekHigh,
        fiftyTwoWeekLow: found.fiftyTwoWeekLow,
      };
    };

    const nepseIndex = findIndex(['NEPSE Index', 'nepse']);
    const sensitiveIndex = findIndex(['Sensitive Index']);
    const floatIndex = findIndex(['Float Index']);
    const sensitiveFloat = findIndex(['Sensitive Float Index']);

    const isMarketOpen =
      marketOpen?.isOpen === 'OPEN' || marketOpen?.isOpen === 'Y' || marketOpen?.id === 58;

    return {
      asOf: marketOpen?.asOf || new Date().toISOString(),
      marketStatus: isMarketOpen ? 'OPEN' : 'CLOSED',
      totalTurnoverRs,
      totalTradedShares,
      totalTransactions,
      indices: {
        nepse: nepseIndex,
        sensitive: sensitiveIndex.id ? sensitiveIndex : undefined,
        float: floatIndex.id ? floatIndex : undefined,
        sensitiveFloat: sensitiveFloat.id ? sensitiveFloat : undefined,
      },
    };
  }

  /**
   * Returns historical OHLCV trade records for a stock symbol
   */
  public async getHistory(symbol: string, options?: HistoryOptions): Promise<StockHistoryItem[]> {
    const normalized = symbol.trim().toUpperCase();
    const security = await this.findSecurityBySymbol(normalized);

    if (!security) {
      throw new Error(`Symbol '${normalized}' not found on Nepal Stock Exchange.`);
    }

    const limit = options?.limit || 20;
    const page = options?.page || 0;

    const histData = await this.get<{
      content: Array<{
        id: number;
        businessDate: string;
        openPrice: number;
        highPrice: number;
        lowPrice: number;
        closePrice: number;
        totalTradedQuantity: number;
        totalTradedValue: number;
        previousDayClosePrice?: number;
        totalTrades?: number;
        averageTradedPrice?: number;
        lastTradedPrice?: number;
      }>;
    }>(`/api/nots/market/security/price/${security.id}?page=${page}&size=${limit}`);

    if (!histData || !Array.isArray(histData.content)) {
      return [];
    }

    return histData.content.map((item) => {
      const prevClose = item.previousDayClosePrice || item.closePrice;
      const change = item.closePrice - prevClose;
      const percentageChange = prevClose > 0 ? (change / prevClose) * 100 : 0;

      return {
        date: item.businessDate,
        open: item.openPrice,
        high: item.highPrice,
        low: item.lowPrice,
        close: item.closePrice,
        volume: item.totalTradedQuantity,
        turnover: item.totalTradedValue,
        trades: item.totalTrades,
        change: Number(change.toFixed(2)),
        percentageChange: Number(percentageChange.toFixed(2)),
        averagePrice: item.averageTradedPrice,
      };
    });
  }

  /**
   * Searches active listed stocks by ticker symbol or company name
   */
  public async searchStocks(query: string): Promise<StockSearchResult[]> {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const list = await this.getSecurityList();
    return list
      .filter((s) => {
        const sym = s.symbol.toLowerCase();
        const name = (s.securityName || '').toLowerCase();
        return sym.includes(q) || name.includes(q);
      })
      .map((s) => ({
        symbol: s.symbol,
        securityId: s.id,
        companyName: s.securityName,
        activeStatus: s.activeStatus || 'A',
      }));
  }

  /**
   * Returns top 10 gainers for the session
   */
  public async getTopGainers(): Promise<TopPerformer[]> {
    const data = await this.get<
      Array<{
        symbol: string;
        securityId: number;
        securityName: string;
        ltp: number;
        pointChange: number;
        percentageChange: number;
      }>
    >('/api/nots/top-ten/top-gainer');

    return (data || []).map((item) => ({
      symbol: item.symbol,
      securityId: item.securityId,
      companyName: item.securityName,
      lastTradedPrice: item.ltp,
      pointChange: item.pointChange,
      percentageChange: item.percentageChange,
    }));
  }

  /**
   * Returns top 10 losers for the session
   */
  public async getTopLosers(): Promise<TopPerformer[]> {
    const data = await this.get<
      Array<{
        symbol: string;
        securityId: number;
        securityName: string;
        ltp: number;
        pointChange: number;
        percentageChange: number;
      }>
    >('/api/nots/top-ten/top-loser');

    return (data || []).map((item) => ({
      symbol: item.symbol,
      securityId: item.securityId,
      companyName: item.securityName,
      lastTradedPrice: item.ltp,
      pointChange: item.pointChange,
      percentageChange: item.percentageChange,
    }));
  }

  /**
   * Returns top 10 most active stocks by turnover
   */
  public async getMostActive(): Promise<MostActiveStock[]> {
    const data = await this.get<
      Array<{
        symbol: string;
        securityId: number;
        securityName: string;
        turnover: number;
        closingPrice?: number;
      }>
    >('/api/nots/top-ten/turnover');

    return (data || []).slice(0, 10).map((item) => ({
      symbol: item.symbol,
      securityId: item.securityId,
      companyName: item.securityName,
      turnover: item.turnover,
      closingPrice: item.closingPrice,
    }));
  }
}
