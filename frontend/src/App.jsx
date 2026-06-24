import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Home from './pages/Home';
import MedicineDetails from './pages/MedicineDetails';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import MyOrders from './pages/MyOrders';
import AdminDashboard from './pages/AdminDashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import Background3D from './components/Background3D';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app-container">
          <Background3D />
          <Navbar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/medicine/:id" element={<MedicineDetails />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* Protected Customer Routes */}
              <Route path="/cart" element={
                <ProtectedRoute>
                  <Cart />
                </ProtectedRoute>
              } />
              <Route path="/checkout" element={
                <ProtectedRoute>
                  <Checkout />
                </ProtectedRoute>
              } />
              <Route path="/my-orders" element={
                <ProtectedRoute>
                  <MyOrders />
                </ProtectedRoute>
              } />
              
              {/* Protected Admin Routes */}
              <Route path="/admin" element={
                <ProtectedRoute adminOnly={true}>
                  <AdminDashboard />
                </ProtectedRoute>
              } />
            </Routes>
          </main>
          <footer className="footer" style={{ borderTop: '1px solid var(--border-glass)', padding: '2rem 2rem', background: 'var(--bg-card)', marginTop: '3rem', fontSize: '0.9rem', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '2rem', maxWidth: '1280px', margin: '0 auto' }}>
              <div>
                <h4 style={{ color: 'var(--color-primary)', marginBottom: '0.75rem' }}>Chinmaya Medicals 🏥</h4>
                <p style={{ color: 'var(--text-muted)', maxWidth: '300px' }}>Your trusted neighborhood pharmacy now online. Providing quality healthcare, delivered fast.</p>
              </div>
              <div>
                <h4 style={{ marginBottom: '0.75rem' }}>Shop Address 🏠</h4>
                <p style={{ color: 'var(--text-muted)' }}>Rickshaw Center, Prakash Nagar,</p>
                <p style={{ color: 'var(--text-muted)' }}>Narasaraopet, Palnadu District,</p>
                <p style={{ color: 'var(--text-muted)' }}>Andhra Pradesh — PIN: 522601</p>
              </div>
              <div>
                <h4 style={{ marginBottom: '0.75rem' }}>Contact Info 📞</h4>
                <p style={{ color: 'var(--text-muted)' }}>Phone: <strong>+91 9848816705</strong></p>
                <p style={{ color: 'var(--text-muted)' }}>Phone: <strong>+91 9059043387</strong></p>
              </div>
            </div>
            <div style={{ textAlign: 'center', marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-glass)', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              © {new Date().getFullYear()} Chinmaya Medicals. All rights reserved. Full-Stack Online Pharmacy System.
            </div>
          </footer>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
