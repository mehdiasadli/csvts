import fs from 'fs/promises';
import path from 'path';

async function generateLargeCSV() {
  const fixturesPath = path.join(__dirname, '../__fixtures__');
  const filePath = path.join(fixturesPath, 'large.csv');

  const header = 'id,timestamp,event_type,user_id,value\n';
  let content = header;

  const eventTypes = ['click', 'view', 'scroll', 'submit'];
  const userIds = Array.from(
    { length: 100 },
    (_, i) => `U${String(i).padStart(3, '0')}`
  );

  // Generate 1000 rows
  for (let i = 1; i <= 1000; i++) {
    const timestamp = new Date(2024, 0, 1, 0, 0, i).toISOString();
    const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    const userId = userIds[Math.floor(Math.random() * userIds.length)];
    const value = (Math.random() * 100).toFixed(2);

    content += `${i},${timestamp},${eventType},${userId},${value}\n`;

    // Write in chunks to avoid memory issues
    if (i % 100 === 0) {
      await fs.appendFile(filePath, content);
      content = '';
    }
  }

  if (content) {
    await fs.appendFile(filePath, content);
  }
}

async function generateAllFixtures() {
  const fixturesPath = path.join(__dirname, '../__fixtures__');

  // Ensure fixtures directory exists
  await fs.mkdir(fixturesPath, { recursive: true });

  // Write all fixture files
  const fixtures = {
    'users.csv': `id,first_name,last_name,email,date_of_birth,country
1,John,Doe,john@example.com,1990-01-15,USA
2,Jane,Smith,jane@example.com,1992-03-20,Canada
3,Bob,Johnson,bob@example.com,1985-12-10,UK
4,Alice,Williams,alice@example.com,1988-07-25,Australia
5,Charlie,Brown,charlie@example.com,1995-05-30,Germany`,

    'products.csv': `sku,name,description,price,category,in_stock
P001,"Laptop Pro 15""","High-performance laptop, 15"" display",1299.99,Electronics,true
P002,"Coffee Maker, Deluxe","12-cup programmable, ""Best Rated"" 2024",89.99,Kitchen,true
P003,Basic Mouse,"Standard USB mouse, black",15.50,Electronics,false
P004,"Large Desk, Oak","Solid oak desk, 60"" × 30""",399.99,Furniture,true
P005,"Plant Pot, Ceramic","Hand-painted, 8"" diameter",25.99,Home & Garden,true`,

    'transactions.csv': `transaction_id,date,amount,currency,status,items_count
T-001,2024-01-01,150.50,USD,completed,3
T-002,2024-01-02,-25.99,EUR,refunded,1
T-003,2024-01-02,1250.00,USD,completed,5
T-004,2024-01-03,0.99,GBP,completed,1
T-005,2024-01-03,499.99,USD,pending,2`,

    'invalid.csv': `name,age,email
John,invalid_age,john@example.com
Mary,25,invalid_email
Bob,30,bob@example.com,extra_field
,,,
Invalid row without enough fields
"Unclosed quote,40,test@example.com
# This is a comment
Valid,50,valid@example.com`,
  };

  for (const [filename, content] of Object.entries(fixtures)) {
    await fs.writeFile(path.join(fixturesPath, filename), content);
  }

  // Generate large dataset
  await generateLargeCSV();
}

// Execute if run directly
if (require.main === module) {
  generateAllFixtures().catch(console.error);
}

export { generateAllFixtures };
