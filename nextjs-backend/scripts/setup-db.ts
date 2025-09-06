import { getDb, closeDb } from '../src/lib/db';

async function setupDatabase() {
  try {
    console.log('Setting up database...');
    const db = await getDb();
    
    // The table is already created in the getDb function
    // Let's verify it exists and show some info
    const tables = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='markdowns'");
    
    if (tables.length > 0 && tables[0].values.length > 0) {
      console.log('✅ Database table "markdowns" is ready');
      
      // Show table structure
      const tableInfo = db.exec("PRAGMA table_info(markdowns)");
      if (tableInfo.length > 0) {
        console.log('Table structure:');
        tableInfo[0].values.forEach((column: any) => {
          const [name, type, notnull, defaultValue, pk] = column;
          console.log(`  - ${name}: ${type} ${notnull ? 'NOT NULL' : ''} ${pk ? 'PRIMARY KEY' : ''}`);
        });
      }
    } else {
      console.log('❌ Failed to create table');
    }
    
    closeDb();
    console.log('Database setup complete!');
  } catch (error) {
    console.error('Error setting up database:', error);
    process.exit(1);
  }
}

setupDatabase();
