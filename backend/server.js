import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import multer from 'multer';

// Controllers
import { registerUser, loginUser, getUserProfile } from './controllers/authController.js';
import { getMedicines, getMedicineById, createMedicine, updateMedicine, deleteMedicine } from './controllers/medicineController.js';
import { getCart, addToCart, updateCartItem, removeCartItem, clearCart } from './controllers/cartController.js';
import { placeOrder, getMyOrders, getOrderById, getAllOrders, updateOrderStatus } from './controllers/orderController.js';
import { getSettings, updateSettings } from './controllers/settingsController.js';

// Middleware
import { protect, admin } from './middleware/authMiddleware.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Resolve paths for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors());
app.use(express.json());

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, 'uploads');
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
  fileFilter(req, file, cb) {
    const filetypes = /jpg|jpeg|png|pdf/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only Images (JPG/JPEG/PNG) and PDFs are allowed!'));
    }
  }
});

// API Routes

// Authentication Routes
app.post('/api/auth/register', registerUser);
app.post('/api/auth/login', loginUser);
app.get('/api/auth/profile', protect, getUserProfile);

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

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}...`);
});
