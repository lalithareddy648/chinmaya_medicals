import crypto from 'crypto';
import { pool } from '../config/db.js';

// --- PILL REMINDERS ---

export const getReminders = async (req, res) => {
  try {
    const userId = req.user._id;
    const result = await pool.query(
      `SELECT pr.*, m.name as medicine_name, m.image as medicine_image 
       FROM pill_reminders pr 
       JOIN medicines m ON pr.medicine_id = m.id 
       WHERE pr.user_id = $1`,
      [userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching reminders:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const createReminder = async (req, res) => {
  try {
    const userId = req.user._id;
    const { medicineId, reminderTime, frequency } = req.body;
    
    if (!medicineId || !reminderTime) {
      return res.status(400).json({ message: 'Medicine ID and time are required' });
    }

    const id = crypto.randomUUID();
    const result = await pool.query(
      `INSERT INTO pill_reminders (id, user_id, medicine_id, reminder_time, frequency) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [id, userId, medicineId, reminderTime, frequency || 'Daily']
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating reminder:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteReminder = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const result = await pool.query(
      `DELETE FROM pill_reminders WHERE id = $1 AND user_id = $2 RETURNING *`,
      [id, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Reminder not found' });
    }

    res.json({ message: 'Reminder deleted successfully' });
  } catch (error) {
    console.error('Error deleting reminder:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// --- SUBSCRIPTIONS ---

export const getSubscriptions = async (req, res) => {
  try {
    const userId = req.user._id;
    const result = await pool.query(
      `SELECT s.*, m.name as medicine_name, m.price, m.image as medicine_image 
       FROM subscriptions s 
       JOIN medicines m ON s.medicine_id = m.id 
       WHERE s.user_id = $1`,
      [userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const createSubscription = async (req, res) => {
  try {
    const userId = req.user._id;
    const { medicineId, quantity, frequencyDays } = req.body;

    if (!medicineId) {
      return res.status(400).json({ message: 'Medicine ID is required' });
    }

    const id = crypto.randomUUID();
    
    // Calculate next refill date (today + frequencyDays)
    const nextRefillDate = new Date();
    nextRefillDate.setDate(nextRefillDate.getDate() + (frequencyDays || 30));

    const result = await pool.query(
      `INSERT INTO subscriptions (id, user_id, medicine_id, quantity, frequency_days, next_refill_date) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [id, userId, medicineId, quantity || 1, frequencyDays || 30, nextRefillDate]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating subscription:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateSubscriptionStatus = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    const { status } = req.body; // 'Active', 'Paused', 'Cancelled'

    const result = await pool.query(
      `UPDATE subscriptions SET status = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2 AND user_id = $3 RETURNING *`,
      [status, id, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Subscription not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating subscription:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
