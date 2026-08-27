/**
 * nepse losers [--json]
 */

import pc from 'picocolors';
import { defaultNepseService } from '../services/nepse.service';
import { renderTopPerformersTable } from '../utils/table';

export interface LosersCommandOptions {
  json?: boolean;
}

export async function losersCommand(
  options: LosersCommandOptions = {},
  service = defaultNepseService
): Promise<string> {
  try {
    const losers = await service.getTopLosers();
    if (options.json) {
      return JSON.stringify(losers, null, 2);
    }
    return renderTopPerformersTable('Top 10 NEPSE Losers', losers);
  } catch (err: unknown) {
    const error = err as Error;
    if (options.json) {
      return JSON.stringify({ error: error.message }, null, 2);
    }
    return pc.red(`Error: ${error.message}`);
  }
}
