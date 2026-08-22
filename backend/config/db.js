import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import pkg from 'pg';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();
const { Pool } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SCHEMA_FILE = path.join(__dirname, 'schema.sql');

// Safe production startup diagnostic
console.log(`DATABASE_URL configured: ${!!process.env.DATABASE_URL}`);
if (process.env.DATABASE_URL) {
  try {
    const parsedUrl = new URL(process.env.DATABASE_URL);
    console.log(`Database host: ${parsedUrl.hostname}`);
    console.log(`Database port: ${parsedUrl.port || 5432}`);
  } catch (e) {
    console.error("Error parsing DATABASE_URL for diagnostics.");
  }
} else {
  console.error("CRITICAL ERROR: DATABASE_URL is not set in the environment variables!");
  // In production, we should not proceed if we can't connect to the DB
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

const initializeDB = async () => {
  try {
    // 1. Optional Destructive Reset
    if (process.env.RESET_DB === 'true') {
      console.warn('RESET_DB is true: Dropping all tables before initialization...');
      await pool.query(`
        DROP TABLE IF EXISTS pill_reminders CASCADE;
        DROP TABLE IF EXISTS subscriptions CASCADE;
        DROP TABLE IF EXISTS order_items CASCADE;
        DROP TABLE IF EXISTS orders CASCADE;
        DROP TABLE IF EXISTS carts CASCADE;
        DROP TABLE IF EXISTS medicines CASCADE;
        DROP TABLE IF EXISTS users CASCADE;
        DROP TABLE IF EXISTS settings CASCADE;
      `);
    }

    // 2. Safe Migration (creates tables if missing)
    const schemaSql = await fs.readFile(SCHEMA_FILE, 'utf-8');
    await pool.query(schemaSql);
    
    console.log('PostgreSQL database initialized');
  } catch (error) {
    console.error('Error initializing PostgreSQL:', error);
  }
};

export { initializeDB };
