import initSqlJs, { Database, SqlJsStatic } from 'sql.js';
import fs from 'fs';
import path from 'path';

let db: Database | null = null;
let SQL: SqlJsStatic | null = null;

export async function getDb(): Promise<Database> {
  if (db) {
    return db;
  }

  try {
    if (!SQL) {
      SQL = await initSqlJs({
        locateFile: (file: string) => {
          if (file.endsWith('.wasm')) {
            return '/app/public/sql-wasm.wasm';
          }
          return file;
        }
      });
    }

    const dbPath = path.join(process.cwd(), 'markdown.db');
    
    // Try to load existing database, or create new one
    let data: Uint8Array | undefined;
    if (fs.existsSync(dbPath)) {
      data = new Uint8Array(fs.readFileSync(dbPath));
    }
    
    db = new SQL.Database(data);
    
    // Initialize the database with the required table
    db.exec(`
      CREATE TABLE IF NOT EXISTS markdowns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    return db;
  } catch (error) {
    console.error('Error opening database:', error);
    throw new Error('Failed to connect to database');
  }
}

export function closeDb() {
  if (db) {
    // Save database to file before closing
    const dbPath = path.join(process.cwd(), 'markdown.db');
    const data = db.export();
    fs.writeFileSync(dbPath, data);
    
    db.close();
    db = null;
  }
}
