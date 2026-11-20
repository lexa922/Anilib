import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbDir = __dirname;
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'library.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

const schemaPath = path.join(dbDir, 'schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf8');
db.exec(schema);

const existingColumns = new Set(
    db.prepare('PRAGMA table_info(user_library)').all().map((col) => col.name)
);

if (!existingColumns.has('kitsu_score')) {
    db.exec('ALTER TABLE user_library ADD COLUMN kitsu_score REAL');
}
if (!existingColumns.has('genres')) {
    db.exec("ALTER TABLE user_library ADD COLUMN genres TEXT DEFAULT '[]'");
}
if (!existingColumns.has('poster')) {
    db.exec("ALTER TABLE user_library ADD COLUMN poster TEXT DEFAULT ''");
}
if (!existingColumns.has('subtype')) {
    db.exec("ALTER TABLE user_library ADD COLUMN subtype TEXT DEFAULT ''");
}
if (!existingColumns.has('release_year')) {
    db.exec('ALTER TABLE user_library ADD COLUMN release_year INTEGER');
}
if (!existingColumns.has('created_at')) {
    db.exec('ALTER TABLE user_library ADD COLUMN created_at DATETIME');
}
if (!existingColumns.has('metadata_synced')) {
    db.exec('ALTER TABLE user_library ADD COLUMN metadata_synced INTEGER DEFAULT 0');
}

db.exec('UPDATE user_library SET created_at = COALESCE(updated_at, CURRENT_TIMESTAMP) WHERE created_at IS NULL');
db.exec('CREATE INDEX IF NOT EXISTS idx_user_library_status ON user_library(status)');
db.exec('CREATE INDEX IF NOT EXISTS idx_user_library_updated_at ON user_library(updated_at DESC)');

export default db;
