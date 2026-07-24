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
const DATA_DIR = path.join(__dirname, '..', 'data');
const SCHEMA_FILE = path.join(__dirname, 'schema.sql');

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

const initializeDB = async () => {
  try {
    // 1. Run schema.sql
    const schemaSql = await fs.readFile(SCHEMA_FILE, 'utf-8');
    await pool.query(schemaSql);
    
    // 2. Seed data if tables are empty
    const tables = ['users', 'medicines', 'orders', 'carts', 'settings'];
    
    for (const table of tables) {
      const res = await pool.query(`SELECT COUNT(*) FROM ${table}`);
      if (parseInt(res.rows[0].count) === 0) {
        try {
          const filePath = path.join(DATA_DIR, `${table}.json`);
          const fileExists = await fs.access(filePath).then(() => true).catch(() => false);
          
          if (fileExists) {
            const content = await fs.readFile(filePath, 'utf-8');
            const data = JSON.parse(content || '[]');
            
            for (const item of data) {
              const { _id, createdAt, updatedAt, ...rest } = item;
              const id = _id || crypto.randomUUID();
              const crAt = createdAt || new Date().toISOString();
              const upAt = updatedAt || new Date().toISOString();
              
              if (table === 'users') {
                await pool.query(
                  `INSERT INTO users (id, name, email, password, is_admin, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                  [id, rest.name, rest.email, rest.password, rest.isAdmin || false, crAt, upAt]
                );
              } else if (table === 'medicines') {
                await pool.query(
                  `INSERT INTO medicines (id, name, category, description, price, discount, stock, needs_prescription, manufacturer, dosage, image, expiry_date, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
                  [
                    id, rest.name, rest.category, rest.description, rest.price, rest.discount || 0, rest.stock || 0, 
                    rest.needsPrescription || false, rest.manufacturer, rest.dosage, rest.image, rest.expiryDate, crAt, upAt
                  ]
                );
              } else if (table === 'settings') {
                await pool.query(
                  `INSERT INTO settings (id, discount_percentage, created_at, updated_at) VALUES ($1, $2, $3, $4)`,
                  [id, rest.discountPercentage || 0, crAt, upAt]
                );
              } else if (table === 'carts') {
                await pool.query(
                  `INSERT INTO carts (id, user_id, items, created_at, updated_at) VALUES ($1, $2, $3, $4, $5)`,
                  [id, rest.userId || null, JSON.stringify(rest.items || []), crAt, upAt]
                );
              } else if (table === 'orders') {
                await pool.query(
                  `INSERT INTO orders (id, user_id, user_name, user_email, total_amount, shipping_address, payment_method, payment_status, delivery_status, prescription_url, customer_coordinates, driver_coordinates, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
                  [
                    id, rest.userId || null, rest.userName, rest.userEmail, rest.totalAmount, 
                    JSON.stringify(rest.shippingAddress || {}), rest.paymentMethod, rest.paymentStatus || 'Pending', 
                    rest.deliveryStatus || 'Processing', rest.prescriptionUrl, JSON.stringify(rest.customerCoordinates || null), 
                    JSON.stringify(rest.driverCoordinates || null), crAt, upAt
                  ]
                );

                // Insert into order_items
                if (rest.items && Array.isArray(rest.items)) {
                  for (const orderItem of rest.items) {
                    const orderItemId = crypto.randomUUID();
                    await pool.query(
                      `INSERT INTO order_items (id, order_id, medicine_id, name, category, price, discount, discounted_price, quantity, total) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
                      [
                        orderItemId, id, orderItem.medicineId, orderItem.name, orderItem.category, 
                        orderItem.price, orderItem.discount, orderItem.discountedPrice, orderItem.quantity, orderItem.total
                      ]
                    );
                  }
                }
              }
            }
            console.log(`Seeded ${table} from JSON to PostgreSQL (Relational)`);
          }
        } catch (e) {
          console.error(`Error seeding table ${table}:`, e);
        }
      }
    }
    console.log('PostgreSQL database initialized');
  } catch (error) {
    console.error('Error initializing PostgreSQL:', error);
  }
};

export { initializeDB };
