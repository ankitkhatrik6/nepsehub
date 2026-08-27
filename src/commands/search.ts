/**
 * nepse search <query> [--json]
 */

import pc from 'picocolors';
import { defaultNepseService } from '../services/nepse.service';
import { renderSearchResultsTable } from '../utils/table';

export interface SearchCommandOptions {
  json?: boolean;
}

export async function searchCommand(
  query: string,
  options: SearchCommandOptions = {},
  service = defaultNepseService
): Promise<string> {
  if (!query) {
    const msg = pc.red('Error: Search query is required. Example: nepse search Bank');
    if (options.json) {
      return JSON.stringify({ error: 'Search query is required' }, null, 2);
    }
    return msg;
  }

  try {
    const results = await service.searchStocks(query);
    if (options.json) {
      return JSON.stringify(results, null, 2);
    }
    return renderSearchResultsTable(results);
  } catch (err: unknown) {
    const error = err as Error;
    if (options.json) {
      return JSON.stringify({ error: error.message }, null, 2);
    }
    return pc.red(`Error: ${error.message}`);
  }
}
