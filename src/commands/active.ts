/**
 * nepse active [--json]
 */

import pc from 'picocolors';
import { defaultNepseService } from '../services/nepse.service';
import { renderMostActiveTable } from '../utils/table';

export interface ActiveCommandOptions {
  json?: boolean;
}

export async function activeCommand(
  options: ActiveCommandOptions = {},
  service = defaultNepseService
): Promise<string> {
  try {
    const active = await service.getMostActive();
    if (options.json) {
      return JSON.stringify(active, null, 2);
    }
    return renderMostActiveTable(active);
  } catch (err: unknown) {
    const error = err as Error;
    if (options.json) {
      return JSON.stringify({ error: error.message }, null, 2);
    }
    return pc.red(`Error: ${error.message}`);
  }
}
