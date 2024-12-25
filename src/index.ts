// Import csv from parser
import { csv as csvParser } from './lib/parser';

// Re-export csv with our named export
export const csv = csvParser;

// Export types
export type {
  CsvParseOptions,
  CsvParseResult,
  CsvError,
  CsvMeta,
} from './lib/parser';

// Export utility types
export type { CsvRow, CsvData, CsvColumn, CsvParserFactory } from './types';

// Define version
export const VERSION = '0.1.0';

// Export default with explicit property assignment
export default {
  csv: csvParser,
  VERSION,
};
