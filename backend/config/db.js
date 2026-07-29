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
