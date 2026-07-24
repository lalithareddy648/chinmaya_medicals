import { pool } from '../config/db.js';
import crypto from 'crypto';

// Get settings
export const getSettings = async (req, res) => {
  try {
    let settingsRes = await pool.query('SELECT * FROM settings LIMIT 1');
    if (settingsRes.rows.length === 0) {
      // Create default settings if they don't exist
      const id = crypto.randomUUID();
      await pool.query('INSERT INTO settings (id, discount_percentage) VALUES ($1, $2)', [id, 15]);
      res.json({ _id: id, discountPercentage: 15 });
    } else {
      const row = settingsRes.rows[0];
      res.json({ _id: row.id, discountPercentage: Number(row.discount_percentage) });
    }
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update settings (Admin only)
export const updateSettings = async (req, res) => {
  const { discountPercentage } = req.body;

  if (discountPercentage === undefined || isNaN(discountPercentage)) {
    return res.status(400).json({ message: 'Please provide a valid discount percentage' });
  }

  try {
    let settingsRes = await pool.query('SELECT * FROM settings LIMIT 1');
    if (settingsRes.rows.length === 0) {
      const id = crypto.randomUUID();
      await pool.query('INSERT INTO settings (id, discount_percentage) VALUES ($1, $2)', [id, Number(discountPercentage)]);
      res.json({ _id: id, discountPercentage: Number(discountPercentage) });
    } else {
      const row = settingsRes.rows[0];
      await pool.query('UPDATE settings SET discount_percentage = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [Number(discountPercentage), row.id]);
      res.json({ _id: row.id, discountPercentage: Number(discountPercentage) });
    }
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
