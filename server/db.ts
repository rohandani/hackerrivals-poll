import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = process.env.DB_PATH || path.join(process.cwd(), 'data', 'polls.db');

function ensureDir(filePath: string) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function createDb(dbFilePath: string): Database.Database {
  ensureDir(dbFilePath);
  const db = new Database(dbFilePath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  initSchema(db);
  return db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS polls (
      id TEXT PRIMARY KEY,
      question TEXT NOT NULL,
      show_results INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS poll_options (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      poll_id TEXT NOT NULL,
      text TEXT NOT NULL,
      vote_count INTEGER DEFAULT 0,
      FOREIGN KEY (poll_id) REFERENCES polls(id)
    );

    CREATE TABLE IF NOT EXISTS votes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      poll_id TEXT NOT NULL,
      option_id INTEGER NOT NULL,
      voter_fingerprint TEXT NOT NULL,
      voted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (poll_id) REFERENCES polls(id),
      FOREIGN KEY (option_id) REFERENCES poll_options(id),
      UNIQUE(poll_id, voter_fingerprint)
    );
  `);

  // Migration: add show_results column if missing (for existing DBs)
  const columns = db.prepare("PRAGMA table_info(polls)").all() as { name: string }[];
  if (!columns.some((c) => c.name === 'show_results')) {
    db.exec('ALTER TABLE polls ADD COLUMN show_results INTEGER DEFAULT 1');
  }
}

const db = createDb(dbPath);

export default db;
export { createDb };
