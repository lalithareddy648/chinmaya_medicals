import { jest } from '@jest/globals';
import supertest from 'supertest';
import app from '../server.js';
import { pool } from '../config/db.js';
import bcrypt from 'bcryptjs';

const request = supertest(app);

// Mock the pg pool
jest.unstable_mockModule('../config/db.js', () => ({
  pool: {
    query: jest.fn(),
    connect: jest.fn()
  }
}));

describe('API Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Auth', () => {
    it('register rejects duplicate email', async () => {
      // Mock finding an existing user
      pool.query.mockResolvedValueOnce({ rows: [{ id: '123', email: 'test@test.com' }] });

      const res = await request.post('/api/auth/register')
        .send({ name: 'Test', email: 'test@test.com', password: 'password123' });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('User already exists with this email');
    });

    it('login rejects wrong password', async () => {
      const mockHash = await bcrypt.hash('realpassword', 10);
      pool.query.mockResolvedValueOnce({ rows: [{ id: '123', password: mockHash }] });

      const res = await request.post('/api/auth/login')
        .send({ email: 'test@test.com', password: 'wrongpassword' });

      expect(res.status).toBe(401);
      expect(res.body.message).toBe('Invalid email or password');
    });

    it('protected routes reject requests without JWT', async () => {
      const res = await request.get('/api/cart');
      expect(res.status).toBe(401);
      expect(res.body.message).toBe('Not authorized, no token provided');
    });
  });

  describe('Cart', () => {
    it('cannot add a nonexistent medicineId', async () => {
      // Create a valid JWT to bypass auth
      const jwt = (await import('jsonwebtoken')).default;
      const token = jwt.sign({ id: 'user123' }, process.env.JWT_SECRET || 'secret');

      // Mock user lookup for auth middleware
      pool.query.mockResolvedValueOnce({ rows: [{ id: 'user123' }] });
      
      // Mock medicine lookup (not found)
      pool.query.mockResolvedValueOnce({ rows: [] });

      const res = await request.post('/api/cart')
        .set('Authorization', `Bearer ${token}`)
        .send({ medicineId: 'invalid-id', quantity: 1 });

      expect(res.status).toBe(404);
      expect(res.body.message).toContain('Medicine not found');
    });
  });

  describe('Orders', () => {
    it('fails and rolls back on insufficient stock', async () => {
      // Create a valid JWT
      const jwt = (await import('jsonwebtoken')).default;
      const token = jwt.sign({ id: 'user123' }, process.env.JWT_SECRET || 'secret');

      const mockClient = {
        query: jest.fn(),
        release: jest.fn()
      };
      pool.connect.mockResolvedValue(mockClient);

      // Mock user lookup for auth middleware
      pool.query.mockResolvedValueOnce({ rows: [{ id: 'user123' }] });

      // Mock cart fetch inside transaction
      mockClient.query.mockResolvedValueOnce({ 
        rows: [{ id: 'cart1', items: [{ medicineId: 'med1', quantity: 10 }] }] 
      });

      // Mock medicine lookup (found)
      mockClient.query.mockResolvedValueOnce({ 
        rows: [{ id: 'med1', name: 'Aspirin', stock: 5, price: 10, discount: 0 }] 
      });

      // The controller will now see stock (5) < requested (10)
      const res = await request.post('/api/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({ 
          shippingAddress: { address: '123', city: 'City', zipCode: '000', phone: '123' }, 
          paymentMethod: 'Cash', 
          deliveryType: 'Local' 
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Insufficient stock');
      
      // Verify rollback was called
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    });
  });
});
