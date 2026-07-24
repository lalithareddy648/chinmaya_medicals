import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'chinmayamedicalssecretkey12345!';

const generateToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, { expiresIn: '30d' });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Please add all required fields' });
  }

  try {
    const userRes = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    if (userRes.rows.length > 0) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Make the first user or email 'admin@chinmaya.com' an admin
    const allUsersRes = await pool.query('SELECT COUNT(*) FROM users');
    const isFirstUser = parseInt(allUsersRes.rows[0].count) === 0;
    const isAdmin = isFirstUser || email.toLowerCase() === 'admin@chinmaya.com';

    const id = Math.random().toString(36).substring(2, 11);
    
    await pool.query(
      'INSERT INTO users (id, name, email, password, is_admin) VALUES ($1, $2, $3, $4, $5)',
      [id, name, email.toLowerCase(), hashedPassword, isAdmin]
    );

    res.status(201).json({
      _id: id,
      name,
      email: email.toLowerCase(),
      isAdmin,
      token: generateToken(id)
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Please enter both email and password' });
  }

  try {
    const userRes = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    if (userRes.rows.length > 0) {
      const user = userRes.rows[0];
      if (await bcrypt.compare(password, user.password)) {
        res.json({
          _id: user.id,
          name: user.name,
          email: user.email,
          isAdmin: user.is_admin,
          token: generateToken(user.id)
        });
      } else {
        res.status(401).json({ message: 'Invalid email or password' });
      }
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
export const getUserProfile = async (req, res) => {
  try {
    const userRes = await pool.query('SELECT * FROM users WHERE id = $1', [req.user._id]);
    if (userRes.rows.length > 0) {
      const user = userRes.rows[0];
      res.json({
        _id: user.id,
        name: user.name,
        email: user.email,
        isAdmin: user.is_admin,
        shippingAddress: null // Can be added later if schema is updated
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Simulate reset password
// @route   POST /api/auth/reset-password
// @access  Public
export const resetPassword = async (req, res) => {
  const { email, newPassword } = req.body;

  if (!email || !newPassword) {
    return res.status(400).json({ message: 'Please provide email and new password' });
  }

  try {
    const userRes = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ message: 'No account found with this email' });
    }

    const user = userRes.rows[0];

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await pool.query('UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [hashedPassword, user.id]);
    res.json({ message: 'Password has been reset successfully! ✓' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
