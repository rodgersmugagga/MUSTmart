const { Pool } = require('pg');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

let pool = null;
let sqliteDb = null;
let isPostgres = false;

// Neon PostgreSQL connection setup
if (process.env.DATABASE_URL && process.env.DATABASE_URL.trim() !== '') {
  try {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    });
    isPostgres = true;
    console.log('[MUSTmart DB] Configured for Neon PostgreSQL database.');
  } catch (err) {
    console.warn('[MUSTmart DB] Error configuring Neon PostgreSQL pool:', err.message);
  }
}

// Fallback SQLite storage for local testing & offline execution
const dbFilePath = path.join(__dirname, '..', 'mustmart_dev.db');
sqliteDb = new Database(dbFilePath);
sqliteDb.pragma('journal_mode = WAL');
sqliteDb.pragma('foreign_keys = ON');

// Unified database query helper
async function query(text, params = []) {
  if (isPostgres && pool) {
    try {
      const start = Date.now();
      const res = await pool.query(text, params);
      return res;
    } catch (err) {
      console.error('[MUSTmart Neon PG Query Error]', err.message, '\nQuery:', text);
      // If Postgres query fails, fall back to SQLite
      return runSqliteQuery(text, params);
    }
  } else {
    return runSqliteQuery(text, params);
  }
}

function runSqliteQuery(text, params = []) {
  // Convert postgres $1, $2, etc. placeholders to sqlite ? placeholders
  let sqliteSql = text.replace(/\$(\d+)/g, '?');

  // Strip postgres-specific clauses or syntax for SQLite compatibility
  sqliteSql = sqliteSql.replace(/RETURNING \*/gi, '');
  sqliteSql = sqliteSql.replace(/RETURNING [a-zA-Z0-9_,\s]+/gi, '');

  const trimmed = sqliteSql.trim();
  const isSelect = /^SELECT/i.test(trimmed) || /^WITH/i.test(trimmed);

  try {
    if (isSelect) {
      const stmt = sqliteDb.prepare(sqliteSql);
      const rows = stmt.all(...params);
      return { rows, rowCount: rows.length };
    } else {
      const stmt = sqliteDb.prepare(sqliteSql);
      const info = stmt.run(...params);
      return {
        rows: info.lastInsertRowid ? [{ id: info.lastInsertRowid }] : [],
        rowCount: info.changes,
        lastInsertRowid: info.lastInsertRowid
      };
    }
  } catch (err) {
    console.error('[SQLite Query Error]', err.message, '\nSQL:', sqliteSql);
    throw err;
  }
}

// Schema Initializer
async function initDb() {
  console.log('[MUSTmart DB] Initializing tables...');
  
  if (isPostgres && pool) {
    try {
      const schemaSql = fs.readFileSync(path.join(__dirname, '..', 'schema.sql'), 'utf-8');
      await pool.query(schemaSql);
      console.log('[MUSTmart DB] Neon PostgreSQL tables successfully verified/created.');
      return;
    } catch (err) {
      console.warn('[MUSTmart DB] Neon PG table initialization warning:', err.message);
      console.log('[MUSTmart DB] Proceeding with SQLite fallback...');
      isPostgres = false;
    }
  }

  // SQLite Schema Setup
  const sqliteSchema = `
    CREATE TABLE IF NOT EXISTS users (
      user_id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('consumer', 'owner', 'agent', 'administrator')),
      account_status TEXT NOT NULL DEFAULT 'active' CHECK (account_status IN ('active', 'suspended', 'pending')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS businesses (
      business_id INTEGER PRIMARY KEY AUTOINCREMENT,
      owner_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT,
      location TEXT NOT NULL,
      verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected', 'info_requested')),
      verified_by INTEGER REFERENCES users(user_id),
      verified_at DATETIME
    );

    CREATE TABLE IF NOT EXISTS verification_documents (
      document_id INTEGER PRIMARY KEY AUTOINCREMENT,
      business_id INTEGER NOT NULL REFERENCES businesses(business_id) ON DELETE CASCADE,
      doc_type TEXT NOT NULL CHECK (doc_type IN ('national_id', 'student_id', 'proof_of_ownership', 'agency_agreement', 'business_permit', 'other')),
      file_path TEXT NOT NULL,
      review_status TEXT NOT NULL DEFAULT 'pending' CHECK (review_status IN ('pending', 'approved', 'rejected', 'info_requested')),
      reviewer_note TEXT,
      uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS categories (
      category_id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL
    );

    CREATE TABLE IF NOT EXISTS listings (
      listing_id INTEGER PRIMARY KEY AUTOINCREMENT,
      business_id INTEGER NOT NULL REFERENCES businesses(business_id) ON DELETE CASCADE,
      category_id INTEGER NOT NULL REFERENCES categories(category_id),
      title TEXT NOT NULL,
      description TEXT,
      price_ugx NUMERIC NOT NULL,
      location TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'live', 'rejected', 'archived')),
      featured_until DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS listing_photos (
      photo_id INTEGER PRIMARY KEY AUTOINCREMENT,
      listing_id INTEGER NOT NULL REFERENCES listings(listing_id) ON DELETE CASCADE,
      file_path TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS land_details (
      listing_id INTEGER PRIMARY KEY REFERENCES listings(listing_id) ON DELETE CASCADE,
      plot_size NUMERIC NOT NULL,
      size_unit TEXT NOT NULL DEFAULT 'decimals',
      documents_checked INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS hostel_details (
      listing_id INTEGER PRIMARY KEY REFERENCES listings(listing_id) ON DELETE CASCADE,
      room_type TEXT NOT NULL,
      amenities TEXT,
      rooms_available INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS reviews (
      review_id INTEGER PRIMARY KEY AUTOINCREMENT,
      listing_id INTEGER NOT NULL REFERENCES listings(listing_id) ON DELETE CASCADE,
      reviewer_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
      rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
      comment TEXT,
      status TEXT NOT NULL DEFAULT 'live' CHECK (status IN ('live', 'flagged', 'removed')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (listing_id, reviewer_id)
    );

    CREATE TABLE IF NOT EXISTS moderation_actions (
      action_id INTEGER PRIMARY KEY AUTOINCREMENT,
      admin_id INTEGER NOT NULL REFERENCES users(user_id),
      target_type TEXT NOT NULL CHECK (target_type IN ('business', 'listing', 'review', 'user')),
      target_id INTEGER NOT NULL,
      action TEXT NOT NULL,
      reason TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS conversations (
      conversation_id INTEGER PRIMARY KEY AUTOINCREMENT,
      listing_id INTEGER NOT NULL REFERENCES listings(listing_id) ON DELETE CASCADE,
      buyer_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS messages (
      message_id INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_id INTEGER NOT NULL REFERENCES conversations(conversation_id) ON DELETE CASCADE,
      sender_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
      body TEXT NOT NULL,
      sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      read_at DATETIME
    );

    CREATE TABLE IF NOT EXISTS notifications (
      notification_id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      reference_id INTEGER,
      text TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `;

  sqliteDb.exec(sqliteSchema);
  console.log('[MUSTmart DB] SQLite local database verified and ready (13 tables).');
}

module.exports = {
  query,
  initDb,
  getIsPostgres: () => isPostgres,
  sqliteDb
};
