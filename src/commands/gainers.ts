/**
 * nepse gainers [--json]
 */

import pc from 'picocolors';
import { defaultNepseService } from '../services/nepse.service';
import { renderTopPerformersTable } from '../utils/table';

export interface GainersCommandOptions {
  json?: boolean;
}

export async function gainersCommand(
  options: GainersCommandOptions = {},
  service = defaultNepseService
): Promise<string> {
  try {
    const gainers = await service.getTopGainers();
    if (options.json) {
      return JSON.stringify(gainers, null, 2);
    }
    return renderTopPerformersTable('Top 10 NEPSE Gainers', gainers);
  } catch (err: unknown) {
    const error = err as Error;
    if (options.json) {
      return JSON.stringify({ error: error.message }, null, 2);
    }
    return pc.red(`Error: ${error.message}`);
  }
}
