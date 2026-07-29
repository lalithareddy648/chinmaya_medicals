import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import multer from 'multer';
import rateLimit from 'express-rate-limit';

// Controllers
import { registerUser, loginUser, getUserProfile, resetPassword, forgotPassword } from './controllers/authController.js';
import { getMedicines, getMedicineById, createMedicine, updateMedicine, deleteMedicine } from './controllers/medicineController.js';
import { getCart, addToCart, updateCartItem, removeCartItem, clearCart } from './controllers/cartController.js';
import { placeOrder, getMyOrders, getOrderById, getAllOrders, updateOrderStatus } from './controllers/orderController.js';
import { getSettings, updateSettings } from './controllers/settingsController.js';
import { handleAgentChat, readPrescription } from './controllers/agentController.js';
import { getReminders, createReminder, deleteReminder, getSubscriptions, createSubscription, updateSubscriptionStatus } from './controllers/healthController.js';
import { initializeDB } from './config/db.js';

// Middleware
import { protect, admin } from './middleware/authMiddleware.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Resolve paths for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://chinmaya-medicals.vercel.app'] 
    : '*'
}));
app.use(express.json());

// Rate Limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 auth requests per windowMs
  message: 'Too many authentication attempts from this IP, please try again later.'
});

const agentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // limit each IP to 50 agent requests per windowMs
  message: 'Too many requests to the AI agent, please try again later.'
});

// Ensure uploads folder exists
const uploadsDir = process.env.VERCEL
  ? path.join('/tmp', 'uploads')
  : path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve uploaded prescription files statically
app.use('/uploads', express.static(uploadsDir));

// Multer Storage Configuration for uploads
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, uploadsDir);
  },
  filename(req, file, cb) {
    cb(
      null,
      `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`
    );
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter(req, file, cb) {
    if (file.fieldname === 'prescription' || file.fieldname === 'prescriptionImage') {
      const filetypes = /png|pdf/;
      const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
      const mimetype = filetypes.test(file.mimetype);

      if (extname && mimetype) {
        return cb(null, true);
      } else {
        cb(new Error('Only PNG and PDF files are allowed for prescriptions!'));
      }
    } else {
      const filetypes = /jpg|jpeg|png|pdf/;
      const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
      const mimetype = filetypes.test(file.mimetype);

      if (extname && mimetype) {
        return cb(null, true);
      } else {
        cb(new Error('Only Images (JPG/JPEG/PNG) and PDFs are allowed!'));
      }
    }
  }
});

// API Routes

// Authentication Routes
app.post('/api/auth/register', authLimiter, registerUser);
app.post('/api/auth/login', authLimiter, loginUser);
app.get('/api/auth/profile', protect, getUserProfile);
app.post('/api/auth/forgot-password', authLimiter, forgotPassword);
app.post('/api/auth/reset-password', authLimiter, resetPassword);

// Medicines Catalog Routes
app.get('/api/medicines', getMedicines);
app.get('/api/medicines/:id', getMedicineById);
app.post('/api/medicines', protect, admin, createMedicine);
app.put('/api/medicines/:id', protect, admin, updateMedicine);
app.delete('/api/medicines/:id', protect, admin, deleteMedicine);

// Cart Routes
app.get('/api/cart', protect, getCart);
app.post('/api/cart', protect, addToCart);
app.put('/api/cart', protect, updateCartItem);
app.delete('/api/cart/:medicineId', protect, removeCartItem);
app.delete('/api/cart', protect, clearCart);

// Orders Routes
app.post('/api/orders', protect, placeOrder);
app.get('/api/orders/myorders', protect, getMyOrders);
app.get('/api/orders/:id', protect, getOrderById);
app.get('/api/orders', protect, admin, getAllOrders);
app.put('/api/orders/:id/status', protect, admin, updateOrderStatus);

// Settings Routes
app.get('/api/settings', protect, getSettings);
app.put('/api/settings', protect, admin, updateSettings);

// Agent Routes
app.post('/api/agent/chat', agentLimiter, handleAgentChat);
app.post('/api/agent/read-prescription', protect, upload.single('prescriptionImage'), readPrescription);

// Health Routes (Reminders & Subscriptions)
app.get('/api/health/reminders', protect, getReminders);
app.post('/api/health/reminders', protect, createReminder);
app.delete('/api/health/reminders/:id', protect, deleteReminder);
app.get('/api/health/subscriptions', protect, getSubscriptions);
app.post('/api/health/subscriptions', protect, createSubscription);
app.put('/api/health/subscriptions/:id/status', protect, updateSubscriptionStatus);

// Prescription Upload Route
app.post('/api/upload', protect, upload.single('prescription'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  res.json({
    message: 'Prescription uploaded successfully',
    filePath: `/uploads/${req.file.filename}`
  });
});

// Generic Image Upload Route
app.post('/api/upload/image', protect, admin, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  // Format the path properly for URLs
  res.json({
    message: 'Image uploaded successfully',
    filePath: `/uploads/${req.file.filename}`
  });
});

// Root check
app.get('/', (req, res) => {
  res.send('Chinmaya Medicals API is running smoothly.');
});

// Error handling middleware
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode);
  res.json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
});

if (!process.env.VERCEL) {
  initializeDB().then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}...`);
    });
  });
}

export default app;
