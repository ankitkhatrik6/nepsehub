/**
 * nepse market [--json]
 */

import pc from 'picocolors';
import { defaultNepseService } from '../services/nepse.service';
import { renderMarketSummaryTable } from '../utils/table';

export interface MarketCommandOptions {
  json?: boolean;
}

export async function marketCommand(
  options: MarketCommandOptions = {},
  service = defaultNepseService
): Promise<string> {
  try {
    const summary = await service.getMarketSummary();
    if (options.json) {
      return JSON.stringify(summary, null, 2);
    }
    return renderMarketSummaryTable(summary);
  } catch (err: unknown) {
    const error = err as Error;
    if (options.json) {
      return JSON.stringify({ error: error.message }, null, 2);
    }
    return pc.red(`Error: ${error.message}`);
  }
}
