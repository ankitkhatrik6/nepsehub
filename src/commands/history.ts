/**
 * nepse history <symbol> [--limit N] [--json]
 */

import pc from 'picocolors';
import { defaultNepseService } from '../services/nepse.service';
import { renderHistoryTable } from '../utils/table';

export interface HistoryCommandOptions {
  limit?: string;
  page?: string;
  json?: boolean;
}

export async function historyCommand(
  symbol: string,
  options: HistoryCommandOptions = {},
  service = defaultNepseService
): Promise<string> {
  if (!symbol) {
    const msg = pc.red('Error: Stock symbol is required. Example: nepse history NABIL');
    if (options.json) {
      return JSON.stringify({ error: 'Stock symbol is required' }, null, 2);
    }
    return msg;
  }

  try {
    const limit = options.limit ? parseInt(options.limit, 10) : 20;
    const page = options.page ? parseInt(options.page, 10) : 0;
    const history = await service.getHistory(symbol, { limit, page });

    if (options.json) {
      return JSON.stringify(history, null, 2);
    }

    return renderHistoryTable(symbol.toUpperCase(), history);
  } catch (err: unknown) {
    const error = err as Error;
    if (options.json) {
      return JSON.stringify({ error: error.message }, null, 2);
    }
    return pc.red(`Error: ${error.message}`);
  }
}
