import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { pool } from '../config/db.js';

const getJwtSecret = () => {
  if (!process.env.JWT_SECRET) {
    throw new Error('FATAL ERROR: JWT_SECRET is not defined.');
  }
  return process.env.JWT_SECRET;
};

const generateToken = (id) => {
  return jwt.sign({ id }, getJwtSecret(), { expiresIn: '30d' });
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

    const id = crypto.randomUUID();
    
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

// @desc    Generate reset password token
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Please provide an email' });
  }

  try {
    const userRes = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ message: 'No account found with this email' });
    }

    const user = userRes.rows[0];

    // Generate token
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Hash token for saving in DB
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    
    // Set expiration to 15 minutes from now
    const resetTokenExpires = new Date(Date.now() + 15 * 60 * 1000);

    await pool.query('UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE id = $3', 
      [resetTokenHash, resetTokenExpires, user.id]);

    // Simulate sending email
    console.log(`\n\n[EMAIL SIMULATION]`);
    console.log(`To: ${user.email}`);
    console.log(`Subject: Password Reset Request`);
    console.log(`Body: Use this token to reset your password: ${resetToken}`);
    console.log(`\n\n`);

    res.json({ message: 'Password reset token has been sent to email (check server logs)' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Reset password with token
// @route   POST /api/auth/reset-password
// @access  Public
export const resetPassword = async (req, res) => {
  const { resetToken, newPassword } = req.body;

  if (!resetToken || !newPassword) {
    return res.status(400).json({ message: 'Please provide reset token and new password' });
  }

  try {
    // Hash the provided token to match DB
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    const userRes = await pool.query(
      'SELECT * FROM users WHERE reset_token = $1 AND reset_token_expires > CURRENT_TIMESTAMP', 
      [resetTokenHash]
    );

    if (userRes.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    const user = userRes.rows[0];

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password and clear token fields
    await pool.query(
      'UPDATE users SET password = $1, reset_token = NULL, reset_token_expires = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = $2', 
      [hashedPassword, user.id]
    );

    res.json({ message: 'Password has been reset successfully! ✓' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
