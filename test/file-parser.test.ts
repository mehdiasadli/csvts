import { csv } from '../src/lib/parser';
import path from 'path';

describe('CSV File Parser Tests', () => {
  const fixturesPath = path.join(__dirname, '__fixtures__');

  describe('Users Data', () => {
    const usersPath = path.join(fixturesPath, 'users.csv');

    it('should parse basic user data correctly', async () => {
      const result = await csv.file(usersPath).parse({
        dynamicTyping: true,
      });

      expect(result.data).toHaveLength(5);
      expect(result.meta.fields).toEqual([
        'id',
        'first_name',
        'last_name',
        'email',
        'date_of_birth',
        'country',
      ]);

      // Check first user
      expect(result.data[0]).toEqual({
        id: 1,
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        date_of_birth: new Date('1990-01-15'),
        country: 'USA',
      });
    });

    it('should transform user data with custom parsers', async () => {
      const result = await csv.file(usersPath).parse({
        parsers: {
          date_of_birth: (value) => new Date(value),
          email: (value) => value.toLowerCase(),
        },
        transformHeader: (header) => header.toUpperCase(),
      });

      expect(result.data[0].DATE_OF_BIRTH instanceof Date).toBe(true);
      expect(result.data[0].EMAIL).toBe('john@example.com');
    });
  });

  describe('Products Data', () => {
    const productsPath = path.join(fixturesPath, 'products.csv');

    it('should handle quoted fields and special characters', async () => {
      const result = await csv.file(productsPath).parse({
        dynamicTyping: true,
      });

      expect(result.data).toHaveLength(5);

      // Check product with quotes in description
      const coffeeMaker = result.data[1];
      expect(coffeeMaker.name).toBe('Coffee Maker, Deluxe');
      expect(coffeeMaker.description).toContain('Best Rated');
      expect(coffeeMaker.price).toBe(89.99);
      expect(coffeeMaker.in_stock).toBe(true);
    });

    it('should handle numeric and boolean conversions', async () => {
      const result = await csv.file(productsPath).parse({
        dynamicTyping: true,
        transform: (value, field) => {
          if (field === 'price') return parseFloat(value);
          if (field === 'in_stock') return value === 'true';
          return value;
        },
      });

      result.data.forEach((product) => {
        expect(typeof product.price).toBe('number');
        expect(typeof product.in_stock).toBe('boolean');
      });
    });
  });

  describe('Transactions Data', () => {
    const transactionsPath = path.join(fixturesPath, 'transactions.csv');

    it('should handle financial data with proper type conversion', async () => {
      const result = await csv.file(transactionsPath).parse({
        dynamicTyping: true,
      });

      expect(result.data).toHaveLength(5);

      // Check numeric values
      result.data.forEach((transaction) => {
        expect(typeof transaction.amount).toBe('number');
        expect(typeof transaction.items_count).toBe('number');
      });

      // Check specific transaction
      expect(result.data[1]).toEqual({
        transaction_id: 'T-002',
        date: new Date('2024-01-02'),
        amount: -25.99,
        currency: 'EUR',
        status: 'refunded',
        items_count: 1,
      });
    });

    it('should apply custom formatting to transaction data', async () => {
      const result = await csv.file(transactionsPath).parse({
        transform: (value, field) => {
          if (field === 'amount') return `$${value}`;
          if (field === 'status') return value.toUpperCase();
          return value;
        },
      });

      expect(result.data[0].amount).toBe('$150.50');
      expect(result.data[0].status).toBe('COMPLETED');
    });
  });

  describe('Invalid Data Handling', () => {
    const invalidPath = path.join(fixturesPath, 'invalid.csv');

    it('should handle invalid rows with error collection', async () => {
      const result = await csv.file(invalidPath).parse({
        skipInvalidLines: true,
        dynamicTyping: true,
      });

      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.data.some((row) => row.age === 50)).toBe(true); // Valid row
    });

    it('should skip empty rows and comments', async () => {
      const result = await csv.file(invalidPath).parse({
        skipEmptyLines: true,
        comments: '#',
      });

      // Count should exclude empty rows and comments
      expect(result.data.length).toBeLessThan(8);
    });
  });

  describe('Performance with Large Dataset', () => {
    const largePath = path.join(fixturesPath, 'large.csv');

    it('should handle large files efficiently', async () => {
      const startTime = process.hrtime();

      const result = await csv.file(largePath).parse({
        dynamicTyping: true,
      });

      const [seconds, nanoseconds] = process.hrtime(startTime);

      expect(result.data.length).toBeGreaterThan(1000);
      expect(seconds).toBeLessThan(1); // Should process within 1 second
    });

    it('should preview large files', async () => {
      const result = await csv.file(largePath).parse({
        preview: 10,
        dynamicTyping: true,
      });

      expect(result.data).toHaveLength(10);
      expect(result.meta.truncated).toBe(true);
    });
  });
});
