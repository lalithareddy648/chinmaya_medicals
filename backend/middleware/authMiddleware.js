import jwt from 'jsonwebtoken';
import { pool } from '../config/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'chinmayamedicalssecretkey12345!';

export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);

      const userRes = await pool.query('SELECT * FROM users WHERE id = $1', [decoded.id]);
      if (userRes.rows.length === 0) {
        return res.status(401).json({ message: 'User not found in system' });
      }

      const user = userRes.rows[0];

      // Append user to request object
      req.user = {
        _id: user.id,
        name: user.name,
        email: user.email,
        isAdmin: user.is_admin
      };

      next();
    } catch (error) {
      console.error('JWT Verification Error:', error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
    res.status(401).json({ message: 'Not authorized, no token provided' });
  }
};

export const admin = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as an admin' });
  }
};
