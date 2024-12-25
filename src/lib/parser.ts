// src/lib/parser.ts
/**
 * Configuration options for CSV parsing
 */
export interface CsvParseOptions {
  /** Character used to separate fields (default: ',') */
  delimiter?: string;
  /** Line break character(s) (default: 'auto') */
  newline?: string;
  /** Character used for quoting fields (default: '"') */
  quoteChar?: string;
  /** Character used for escaping special characters (default: '"') */
  escapeChar?: string;
  /** Whether to treat the first row as headers (default: true) */
  header?: boolean;
  /** How to handle empty lines (default: true) */
  skipEmptyLines?: boolean | 'greedy';
  /** File encoding for reading files (default: 'utf8') */
  encoding?: BufferEncoding;
  /** Transform header fields before parsing */
  transformHeader?: (header: string) => string;
  /** Transform field values after parsing */
  transform?: (value: string, field: string | number) => any;
  /** Automatically convert string values to their proper types */
  dynamicTyping?: boolean | { [key: string]: boolean };
  /** Handle comment lines (false or comment character) */
  comments?: boolean | string;
  /** Skip lines that can't be parsed */
  skipInvalidLines?: boolean;
  /** Preview only the first n lines */
  preview?: number;
  /** Custom parsers for specific columns */
  parsers?: {
    [key: string]: (value: string) => any;
  };
  /** Rename headers in the output */
  renameHeaders?: {
    [key: string]: string;
  };
}

/**
 * Error information for parsing issues
 */
export interface CsvError {
  /** Type of error that occurred */
  type: string;
  /** Error code for programmatic handling */
  code: string;
  /** Human-readable error message */
  message: string;
  /** Row number where the error occurred (if applicable) */
  row?: number;
  /** Character index where the error occurred (if applicable) */
  index?: number;
}

/**
 * Metadata about the parsing operation
 */
export interface CsvMeta {
  /** Delimiter used in parsing */
  delimiter: string;
  /** Line break character(s) detected/used */
  linebreak: string;
  /** Whether the result was truncated due to preview */
  truncated: boolean;
  /** Column names (when headers are enabled) */
  fields?: string[];
  /** Number of data rows processed */
  rows: number;
}

/**
 * Result of a CSV parsing operation
 */
export interface CsvParseResult<T = any> {
  /** Parsed data rows */
  data: T[];
  /** Any errors that occurred during parsing */
  errors: CsvError[];
  /** Metadata about the parsing operation */
  meta: CsvMeta;
}

/**
 * Core CSV parser class that handles both text and file parsing
 */
class CsvParser<T = any> {
  /** Default configuration options */
  private options: Required<CsvParseOptions>;

  /**
   * Creates a new CSV parser instance
   * @param options - Configuration options for parsing
   */
  constructor(options: CsvParseOptions = {}) {
    this.options = {
      delimiter: ',',
      newline: 'auto',
      quoteChar: '"',
      escapeChar: '"',
      header: true,
      skipEmptyLines: true,
      encoding: 'utf8',
      transformHeader: (h) => h,
      transform: (v) => v,
      dynamicTyping: false,
      comments: false,
      skipInvalidLines: false,
      preview: 0,
      parsers: {},
      renameHeaders: {},
      ...options,
    };
  }

  /**
   * Detects the newline character(s) used in the text
   * @param text - Input text to analyze
   * @returns Detected newline character(s)
   */
  private detectNewline(text: string): string {
    if (text.includes('\r\n')) return '\r\n';
    if (text.includes('\n')) return '\n';
    if (text.includes('\r')) return '\r';
    return '\n';
  }

  /**
   * Parses a single row of CSV data
   * @param row - Raw row text
   * @returns Array of field values
   */
  private parseRow(row: string): string[] {
    const { delimiter, quoteChar, escapeChar } = this.options;
    const values: string[] = [];
    let currentValue = '';
    let isQuoted = false;
    let i = 0;

    while (i < row.length) {
      const char = row[i];

      if (char === quoteChar) {
        if (isQuoted && row[i + 1] === delimiter) {
          isQuoted = false;
          i++;
        } else if (!isQuoted && currentValue === '') {
          isQuoted = true;
        } else if (row[i - 1] === escapeChar) {
          currentValue = currentValue.slice(0, -1) + char;
        } else {
          isQuoted = !isQuoted;
        }
      } else if (char === delimiter && !isQuoted) {
        values.push(currentValue);
        currentValue = '';
      } else {
        currentValue += char;
      }

      i++;
    }

    values.push(currentValue);
    return values;
  }

  /**
   * Converts a string value to its proper type
   * @param value - String value to convert
   * @param type - Optional type hint
   * @returns Converted value
   */
  private convertType(value: string, type?: string): any {
    if (!this.options.dynamicTyping) return value;

    if (value === '') return null;
    if (value === 'true') return true;
    if (value === 'false') return false;
    if (value === 'null') return null;
    if (value === 'undefined') return undefined;

    const num = Number(value);
    if (!isNaN(num)) return num;

    const date = new Date(value);
    if (!isNaN(date.getTime())) return date;

    return value;
  }

  /**
   * Process CSV text and convert it to structured data
   * @param csvData - Raw CSV text
   * @returns Parsed CSV data and metadata
   */
  private processData(csvData: string): CsvParseResult<T> {
    const result: CsvParseResult<T> = {
      data: [],
      errors: [],
      meta: {
        delimiter: this.options.delimiter,
        linebreak:
          this.options.newline === 'auto'
            ? this.detectNewline(csvData)
            : this.options.newline,
        truncated: false,
        rows: 0,
      },
    };

    const lines = csvData.split(result.meta.linebreak);
    let headers: string[] = [];

    // Process headers if enabled
    if (this.options.header) {
      if (lines.length === 0) {
        result.errors.push({
          type: 'NoData',
          code: 'empty_file',
          message: 'No data found in CSV',
        });
        return result;
      }

      headers = this.parseRow(lines[0]).map(this.options.transformHeader);
      if (this.options.renameHeaders) {
        headers = headers.map((h) => this.options.renameHeaders[h] || h);
      }
      result.meta.fields = headers;
      lines.shift();
    }

    // Process data rows
    for (let i = 0; i < lines.length; i++) {
      if (this.options.preview && result.data.length >= this.options.preview) {
        result.meta.truncated = true;
        break;
      }

      const line = lines[i].trim();

      if (this.options.skipEmptyLines && !line) continue;

      if (this.options.comments) {
        const commentChar =
          typeof this.options.comments === 'string'
            ? this.options.comments
            : '#';
        if (line.startsWith(commentChar)) continue;
      }

      try {
        const row = this.parseRow(line);
        const parsedRow: any = this.options.header ? {} : [];

        row.forEach((value, index) => {
          const field = this.options.header ? headers[index] : index;
          let parsedValue = value;

          if (this.options.header && this.options.parsers[field]) {
            parsedValue = this.options.parsers[field](value);
          } else {
            parsedValue = this.convertType(
              value,
              typeof field === 'string' ? field : undefined
            );
          }

          parsedValue = this.options.transform(parsedValue, field);

          if (this.options.header) {
            parsedRow[field] = parsedValue;
          } else {
            parsedRow.push(parsedValue);
          }
        });

        result.data.push(parsedRow as T);
      } catch (error) {
        if (!this.options.skipInvalidLines) {
          throw error;
        }
        result.errors.push({
          type: 'InvalidRow',
          code: 'row_parse_failed',
          message:
            error instanceof Error ? error.message : 'Failed to parse row',
          row: i + 1,
        });
      }
    }

    result.meta.rows = result.data.length;
    return result;
  }

  /**
   * Parse CSV text synchronously
   * @param csvText - CSV text to parse
   * @param options - Optional parsing options
   * @returns Parsed CSV data and metadata
   */
  parse(
    csvText: string,
    options?: Partial<CsvParseOptions>
  ): CsvParseResult<T> {
    if (options) {
      this.options = { ...this.options, ...options };
    }
    return this.processData(csvText);
  }

  /**
   * Parse CSV from a file asynchronously
   * @param filePath - Path to CSV file
   * @param options - Optional parsing options
   * @returns Promise resolving to parsed CSV data and metadata
   */
  async parseFile(
    filePath: string,
    options?: Partial<CsvParseOptions>
  ): Promise<CsvParseResult<T>> {
    if (options) {
      this.options = { ...this.options, ...options };
    }

    let csvData: string;
    if (typeof window === 'undefined') {
      // Node.js environment
      const fs = await import('fs/promises');
      const buffer = await fs.readFile(filePath);
      csvData = buffer.toString(this.options.encoding);
    } else {
      // Browser environment
      const response = await fetch(filePath);
      csvData = await response.text();
    }

    return this.processData(csvData);
  }
}

/**
 * Factory for creating CSV parsers from text input
 */
export class TextCsvParser<T = any> {
  private csvText: string;

  constructor(text: string) {
    this.csvText = text;
  }

  /**
   * Parse the CSV text
   * @param options - Optional parsing options
   * @returns Parsed CSV data and metadata
   */
  parse(options?: CsvParseOptions): CsvParseResult<T> {
    return new CsvParser<T>(options).parse(this.csvText);
  }
}

/**
 * Factory for creating CSV parsers from file input
 */
export class FileCsvParser<T = any> {
  private filePath: string;

  constructor(path: string) {
    this.filePath = path;
  }

  /**
   * Parse the CSV file
   * @param options - Optional parsing options
   * @returns Promise resolving to parsed CSV data and metadata
   */
  async parse(options?: CsvParseOptions): Promise<CsvParseResult<T>> {
    return new CsvParser<T>(options).parseFile(this.filePath);
  }
}

// Export the main API
export const csv = {
  /**
   * Create a parser for CSV text input
   * @param text - CSV text to parse
   * @returns CSV text parser
   */
  text: <T = any>(text: string) => new TextCsvParser<T>(text),

  /**
   * Create a parser for CSV file input
   * @param path - Path to CSV file
   * @returns CSV file parser
   */
  file: <T = any>(path: string) => new FileCsvParser<T>(path),
};
