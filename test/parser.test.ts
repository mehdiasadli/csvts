// test/parser.test.ts
import { csv } from '../src/lib/parser';
import fs from 'fs/promises';
import path from 'path';

describe('CSV Parser', () => {
  // Text Parser Tests
  describe('Text Parser', () => {
    describe('Basic Parsing', () => {
      it('should parse simple CSV text with headers', () => {
        const input = 'name,age\nJohn,30\nJane,25';
        const result = csv.text(input).parse();

        expect(result.data).toEqual([
          { name: 'John', age: '30' },
          { name: 'Jane', age: '25' },
        ]);
        expect(result.meta.fields).toEqual(['name', 'age']);
      });

      it('should parse CSV text without headers', () => {
        const input = 'John,30\nJane,25';
        const result = csv.text(input).parse({ header: false });

        expect(result.data).toEqual([
          ['John', '30'],
          ['Jane', '25'],
        ]);
      });

      it('should return empty data array for empty input', () => {
        const input = '';
        const result = csv.text(input).parse();

        expect(result.data).toEqual([]);
        expect(result.errors[0].code).toBe('empty_file');
      });
    });

    describe('Delimiters and Quotes', () => {
      it('should handle custom delimiters', () => {
        const input = 'name;age\nJohn;30\nJane;25';
        const result = csv.text(input).parse({ delimiter: ';' });

        expect(result.data).toEqual([
          { name: 'John', age: '30' },
          { name: 'Jane', age: '25' },
        ]);
      });

      it('should handle quoted fields', () => {
        const input =
          'name,description\nJohn,"Software Engineer, Senior"\nJane,"Product Manager, Lead"';
        const result = csv.text(input).parse();

        expect(result.data).toEqual([
          { name: 'John', description: 'Software Engineer, Senior' },
          { name: 'Jane', description: 'Product Manager, Lead' },
        ]);
      });

      it('should handle escaped quotes', () => {
        const input =
          'name,quote\nJohn,"He said ""Hello"" to me"\nJane,"Simple quote"';
        const result = csv.text(input).parse();

        expect(result.data).toEqual([
          { name: 'John', quote: 'He said "Hello" to me' },
          { name: 'Jane', quote: 'Simple quote' },
        ]);
      });
    });

    describe('Data Type Conversion', () => {
      it('should perform automatic type conversion when enabled', () => {
        const input =
          'name,age,active,salary,birthdate\nJohn,30,true,50000.50,1990-01-01';
        const result = csv.text(input).parse({ dynamicTyping: true });

        expect(result.data[0]).toEqual({
          name: 'John',
          age: 30,
          active: true,
          salary: 50000.5,
          birthdate: new Date('1990-01-01'),
        });
      });

      it('should apply custom parsers for specific columns', () => {
        const input = 'name,data\nJohn,{"age":30}\nJane,{"age":25}';
        const result = csv.text(input).parse({
          parsers: {
            data: (value) => JSON.parse(value),
          },
        });

        expect(result.data).toEqual([
          { name: 'John', data: { age: 30 } },
          { name: 'Jane', data: { age: 25 } },
        ]);
      });
    });

    describe('Header Handling', () => {
      it('should transform headers', () => {
        const input = 'Full Name,User Age\nJohn Doe,30';
        const result = csv.text(input).parse({
          transformHeader: (header) =>
            header.toLowerCase().replace(/\s+/g, '_'),
        });

        expect(result.data[0]).toHaveProperty('full_name');
        expect(result.data[0]).toHaveProperty('user_age');
      });

      it('should rename headers', () => {
        const input = 'name,age\nJohn,30';
        const result = csv.text(input).parse({
          renameHeaders: {
            name: 'fullName',
            age: 'userAge',
          },
        });

        expect(result.data[0]).toHaveProperty('fullName');
        expect(result.data[0]).toHaveProperty('userAge');
      });
    });

    describe('Special Cases', () => {
      it('should handle empty fields', () => {
        const input = 'name,age,city\nJohn,,New York\nJane,25,';
        const result = csv.text(input).parse();

        expect(result.data).toEqual([
          { name: 'John', age: '', city: 'New York' },
          { name: 'Jane', age: '25', city: '' },
        ]);
      });

      it('should handle empty lines', () => {
        const input = 'name,age\nJohn,30\n\nJane,25\n\n';
        const result = csv.text(input).parse({ skipEmptyLines: true });

        expect(result.data).toHaveLength(2);
      });

      it('should handle comments', () => {
        const input =
          '# This is a comment\nname,age\n# Another comment\nJohn,30';
        const result = csv.text(input).parse({ comments: '#' });

        expect(result.data).toHaveLength(1);
        expect(result.data[0]).toEqual({ name: 'John', age: '30' });
      });
    });

    describe('Error Handling', () => {
      it('should collect errors for invalid rows when skipInvalidLines is true', () => {
        const input = 'name,age\nJohn,30\nInvalid,row,extra\nJane,25';
        const result = csv.text(input).parse({ skipInvalidLines: true });

        expect(result.data).toHaveLength(2);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].code).toBe('row_parse_failed');
      });

      it('should throw error for invalid rows when skipInvalidLines is false', () => {
        const input = 'name,age\nJohn,30\nInvalid,row,extra\nJane,25';

        expect(() => {
          csv.text(input).parse({ skipInvalidLines: false });
        }).toThrow();
      });
    });
  });

  // File Parser Tests
  describe('File Parser', () => {
    // Setup: Create temporary CSV file
    const testFilePath = path.join(__dirname, '__fixtures__/test.csv');

    beforeAll(async () => {
      const content = 'name,age\nJohn,30\nJane,25';
      await fs.writeFile(testFilePath, content);
    });

    afterAll(async () => {
      await fs.unlink(testFilePath);
    });

    it('should parse CSV file in Node.js environment', async () => {
      const result = await csv.file(testFilePath).parse();

      expect(result.data).toEqual([
        { name: 'John', age: '30' },
        { name: 'Jane', age: '25' },
      ]);
    });

    it('should handle file encoding', async () => {
      const result = await csv.file(testFilePath).parse({ encoding: 'utf8' });
      expect(result.data).toHaveLength(2);
    });

    it('should handle non-existent file', async () => {
      await expect(csv.file('non-existent.csv').parse()).rejects.toThrow();
    });
  });

  describe('Performance', () => {
    it('should handle large CSV data efficiently', () => {
      // Generate large CSV data
      const headers = 'col1,col2,col3,col4,col5';
      const rows = Array.from(
        { length: 10000 },
        (_, i) => `val${i},${i},true,${i * 1.5},"text ${i}"`
      ).join('\n');
      const input = `${headers}\n${rows}`;

      const startTime = process.hrtime();
      const result = csv.text(input).parse({ dynamicTyping: true });
      const [seconds, nanoseconds] = process.hrtime(startTime);

      expect(result.data).toHaveLength(10000);
      expect(seconds).toBeLessThan(1); // Should parse within 1 second
    });

    it('should handle preview mode', () => {
      const headers = 'col1,col2';
      const rows = Array.from({ length: 1000 }, (_, i) => `val${i},${i}`).join(
        '\n'
      );
      const input = `${headers}\n${rows}`;

      const result = csv.text(input).parse({ preview: 10 });

      expect(result.data).toHaveLength(10);
      expect(result.meta.truncated).toBe(true);
    });
  });
});
