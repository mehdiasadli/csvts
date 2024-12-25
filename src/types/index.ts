// src/types/index.ts

import { FileCsvParser, TextCsvParser } from '../lib/parser';

/**
 * Factory interface for CSV parser methods
 */
export interface CsvParserFactory {
  /**
   * Create a parser for CSV text input
   * @param text CSV text content
   */
  text: <T = any>(text: string) => TextCsvParser<T>;

  /**
   * Create a parser for CSV file input
   * @param path Path to CSV file
   */
  file: <T = any>(path: string) => FileCsvParser<T>;
}

/**
 * Helper type for CSV row data
 * Useful when defining custom row types
 */
export type CsvRow<T = any> = {
  [K in keyof T]: T[K];
};

/**
 * Helper type for CSV data with headers
 * Represents array of typed rows
 */
export type CsvData<T = any> = CsvRow<T>[];

/**
 * Column parser configuration
 */
export interface CsvColumn {
  name: string;
  parser?: (value: string) => any;
}

// Re-export core types from parser
export type {
  CsvParseOptions,
  CsvParseResult,
  CsvError,
  CsvMeta,
  TextCsvParser,
  FileCsvParser,
} from '../lib/parser';
