import Database from 'better-sqlite3';
import path from 'path';

// Create read-only database connection
const dbPath = path.join(__dirname, '../../app.db');
const db = new Database(dbPath, { readonly: true });

// Enable foreign keys
db.pragma('foreign_keys = ON');

export default db;
