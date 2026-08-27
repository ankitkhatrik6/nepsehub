import { Command } from 'commander';
import pc from 'picocolors';
import {
  stockCommand,
  marketCommand,
  historyCommand,
  searchCommand,
  gainersCommand,
  losersCommand,
  activeCommand,
} from './commands';

const FOOTER_TEXT = `\n${pc.dim('─'.repeat(50))}\nDeveloped with ${pc.red('❤')} by ${pc.bold(pc.green('Ankit Khatri KC'))}\n`;

const program = new Command();

program
  .name('nepse')
  .description('Nepal Stock Exchange (NEPSE) market data')
  .version('1.0.0');

// nepse stock <symbol>
program
  .command('stock <symbol>')
  .description('Get live quote and trading metrics for a stock ticker (e.g. NABIL, GBIME)')
  .option('--json', 'Output results in JSON format')
  .option('--watch', 'Watch quote with auto-refresh')
  .option('-i, --interval <ms>', 'Watch interval in milliseconds', '5000')
  .action(async (symbol, options) => {
    try {
      const output = await stockCommand(symbol, options);
      if (output) {
        console.log(output);
        if (!options.json && !options.watch) console.log(FOOTER_TEXT);
      }
    } catch (err: unknown) {
      console.error(pc.red(`Error: ${(err as Error).message}`));
      process.exit(1);
    }
  });

// nepse market
program
  .command('market')
  .description('Get NEPSE market summary, turnover, traded shares, and major indices')
  .option('--json', 'Output results in JSON format')
  .action(async (options) => {
    try {
      const output = await marketCommand(options);
      if (output) {
        console.log(output);
        if (!options.json) console.log(FOOTER_TEXT);
      }
    } catch (err: unknown) {
      console.error(pc.red(`Error: ${(err as Error).message}`));
      process.exit(1);
    }
  });

// nepse history <symbol>
program
  .command('history <symbol>')
  .description('Get historical OHLCV price and volume data for a stock')
  .option('-l, --limit <number>', 'Number of past sessions to retrieve', '20')
  .option('-p, --page <number>', 'Page offset', '0')
  .option('--json', 'Output results in JSON format')
  .action(async (symbol, options) => {
    try {
      const output = await historyCommand(symbol, options);
      if (output) {
        console.log(output);
        if (!options.json) console.log(FOOTER_TEXT);
      }
    } catch (err: unknown) {
      console.error(pc.red(`Error: ${(err as Error).message}`));
      process.exit(1);
    }
  });

// nepse search <query>
program
  .command('search <query>')
  .description('Search listed stocks on NEPSE by ticker symbol or company name')
  .option('--json', 'Output results in JSON format')
  .action(async (query, options) => {
    try {
      const output = await searchCommand(query, options);
      if (output) {
        console.log(output);
        if (!options.json) console.log(FOOTER_TEXT);
      }
    } catch (err: unknown) {
      console.error(pc.red(`Error: ${(err as Error).message}`));
      process.exit(1);
    }
  });

// nepse gainers
program
  .command('gainers')
  .description('Get top 10 gaining stocks of the trading session')
  .option('--json', 'Output results in JSON format')
  .action(async (options) => {
    try {
      const output = await gainersCommand(options);
      if (output) {
        console.log(output);
        if (!options.json) console.log(FOOTER_TEXT);
      }
    } catch (err: unknown) {
      console.error(pc.red(`Error: ${(err as Error).message}`));
      process.exit(1);
    }
  });

// nepse losers
program
  .command('losers')
  .description('Get top 10 losing stocks of the trading session')
  .option('--json', 'Output results in JSON format')
  .action(async (options) => {
    try {
      const output = await losersCommand(options);
      if (output) {
        console.log(output);
        if (!options.json) console.log(FOOTER_TEXT);
      }
    } catch (err: unknown) {
      console.error(pc.red(`Error: ${(err as Error).message}`));
      process.exit(1);
    }
  });

// nepse active
program
  .command('active')
  .description('Get most active stocks by turnover on NEPSE')
  .option('--json', 'Output results in JSON format')
  .action(async (options) => {
    try {
      const output = await activeCommand(options);
      if (output) {
        console.log(output);
        if (!options.json) console.log(FOOTER_TEXT);
      }
    } catch (err: unknown) {
      console.error(pc.red(`Error: ${(err as Error).message}`));
      process.exit(1);
    }
  });

// Auto-run if executed directly
if (require.main === module || process.argv[1]?.endsWith('cli.ts') || process.argv[1]?.endsWith('cli.js')) {
  program.parse(process.argv);
}

export { program };
