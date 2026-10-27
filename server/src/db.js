import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const defaultDatabasePath = fileURLToPath(new URL('../data/finance.sqlite', import.meta.url));

export function createDatabase(databasePath = process.env.DATABASE_PATH || defaultDatabasePath) {
  const resolvedPath = path.resolve(databasePath);
  mkdirSync(path.dirname(resolvedPath), { recursive: true });

  const database = new Database(resolvedPath);
  database.pragma('journal_mode = WAL');
  // Giữ nguyên bảng giao dịch hiện tại; số tiền được lưu bằng cent nguyên để tránh sai số thập phân.
  database.exec(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
      type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
      category TEXT NOT NULL,
      date TEXT NOT NULL,
      note TEXT NOT NULL DEFAULT ''
    )
  `);
  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_transactions_date_id
    ON transactions (date DESC, id DESC)
  `);
  database.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      name TEXT PRIMARY KEY
    )
  `);
  // Chạy mỗi lần khởi động nhưng INSERT OR IGNORE giúp nhập category cũ an toàn, không tạo bản sao.
  database.exec(`
    INSERT OR IGNORE INTO categories (name)
    SELECT DISTINCT category FROM transactions
  `);

  return database;
}
