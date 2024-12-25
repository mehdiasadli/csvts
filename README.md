# csvts

A powerful, type-safe CSV parser that works seamlessly in both Node.js and browser environments.

![npm version](https://img.shields.io/npm/v/csvts)
![npm downloads](https://img.shields.io/npm/dm/csvts)
![build status](https://img.shields.io/github/workflow/status/yourusername/csvts/CI)
![license](https://img.shields.io/npm/l/csvts)

## Features

- 🌐 Universal - works in Node.js and browsers
- 💪 Fully type-safe with TypeScript
- 🚀 High performance
- 🔧 Highly configurable
- 🎯 Precise type inference
- 📁 Handles both file and text input
- 🔄 Automatic type conversion
- 🛡️ Robust error handling

## Installation

```bash
npm install csvts
# or
yarn add csvts
# or
pnpm add csvts
```

## Quick Start

```typescript
import { csv } from 'csvts';

// Parse from text
const textResult = csv.text('name,age\nJohn,30').parse();
console.log(textResult.data); // [{ name: 'John', age: '30' }]

// Parse from file (Node.js)
const fileResult = await csv.file('./data.csv').parse();
console.log(fileResult.data);

// With type safety
interface User {
  name: string;
  age: number;
}

const users = csv.text('name,age\nJohn,30').parse({
  dynamicTyping: true,
});
// users.data is User[]
```

## API Reference

### Main Functions

#### `csv.text(input: string)`

Parse CSV from text input.

#### `csv.file(path: string)`

Parse CSV from a file (works in Node.js and browsers via fetch).

### Configuration Options

```typescript
interface CsvParseOptions {
  // Basic options
  delimiter?: string; // Default: ','
  newline?: string; // Default: 'auto'
  header?: boolean; // Default: true
  skipEmptyLines?: boolean; // Default: true

  // Type conversion
  dynamicTyping?: boolean; // Default: false

  // Transformations
  transformHeader?: (header: string) => string;
  transform?: (value: string, field: string) => any;

  // Custom parsing
  parsers?: {
    [key: string]: (value: string) => any;
  };

  // Error handling
  skipInvalidLines?: boolean; // Default: false

  // And more...
}
```

### Examples

#### Basic Usage

```typescript
const data = csv.text('name,age\nJohn,30').parse();
```

#### Custom Type Conversion

```typescript
const data = csv.text('name,birth,active\nJohn,1990-01-01,true').parse({
  parsers: {
    birth: (value) => new Date(value),
    active: (value) => value === 'true',
  },
});
```

#### Header Transformation

```typescript
const data = csv.text('Full Name,User Age\nJohn,30').parse({
  transformHeader: (header) => header.toLowerCase().replace(/\s+/g, '_'),
});
// Headers become: full_name, user_age
```

#### Error Handling

```typescript
const data = csv.text('name,age\nJohn,invalid').parse({
  skipInvalidLines: true,
  dynamicTyping: true,
});

console.log(data.errors); // Shows parsing errors
```

## Advanced Usage

### Type Safety

The parser is fully type-safe and will infer types from your data structure:

```typescript
interface Product {
  id: number;
  name: string;
  price: number;
  inStock: boolean;
}

const products = csv.text(csvData).parse({
  dynamicTyping: true,
  renameHeaders: {
    in_stock: 'inStock',
  },
});

// products.data is Product[]
```

### Custom Parsers

You can define custom parsers for specific columns:

```typescript
const data = csv.text(csvData).parse({
  parsers: {
    date: (value) => new Date(value),
    json: (value) => JSON.parse(value),
    amount: (value) => parseFloat(value),
  },
});
```

### Browser Usage

The parser works seamlessly in browsers:

```typescript
// Using with fetch
fetch('data.csv')
  .then((response) => response.text())
  .then((text) => {
    const data = csv.text(text).parse();
    console.log(data);
  });

// Or using file input
input.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  const text = await file.text();
  const data = csv.text(text).parse();
  console.log(data);
});
```

## Performance

The parser is optimized for performance:

- Efficient memory usage
- Fast parsing algorithm
- Support for large files
- Preview mode for large datasets

## License

MIT License - see the [LICENSE](LICENSE) file for details.
