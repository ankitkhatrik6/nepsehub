/**
 * nepse stock <symbol> [--json] [--watch]
 */

import pc from 'picocolors';
import { defaultNepseService } from '../services/nepse.service';
import { renderStockQuoteTable } from '../utils/table';

export interface StockCommandOptions {
  json?: boolean;
  watch?: boolean;
  interval?: string;
}

export async function stockCommand(
  symbol: string,
  options: StockCommandOptions = {},
  service = defaultNepseService
): Promise<string> {
  if (!symbol) {
    const msg = pc.red('Error: Stock symbol is required. Example: nepse stock NABIL');
    if (options.json) {
      return JSON.stringify({ error: 'Stock symbol is required' }, null, 2);
    }
    return msg;
  }

  const fetchAndRender = async (): Promise<string> => {
    try {
      const quote = await service.getQuote(symbol);
      if (options.json) {
        return JSON.stringify(quote, null, 2);
      }
      return renderStockQuoteTable(quote);
    } catch (err: unknown) {
      const error = err as Error;
      if (options.json) {
        return JSON.stringify({ error: error.message }, null, 2);
      }
      return pc.red(`Error: ${error.message}`);
    }
  };

  if (options.watch) {
    const intervalMs = parseInt(options.interval || '5000', 10);
    console.clear();
    console.log(pc.cyan(`Watching ${symbol.toUpperCase()} (refresh every ${intervalMs / 1000}s) - Press Ctrl+C to exit...\n`));

    const initial = await fetchAndRender();
    console.log(initial);

    const timer = setInterval(async () => {
      console.clear();
      console.log(pc.cyan(`Watching ${symbol.toUpperCase()} (refresh every ${intervalMs / 1000}s) - Press Ctrl+C to exit...\n`));
      const res = await fetchAndRender();
      console.log(res);
    }, intervalMs);

    // Keep active in terminal
    process.on('SIGINT', () => {
      clearInterval(timer);
      console.log(pc.yellow('\nWatch stopped.'));
      process.exit(0);
    });

    return '';
  }

  return await fetchAndRender();
}
