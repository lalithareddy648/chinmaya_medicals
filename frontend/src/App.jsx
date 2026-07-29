import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import { Toaster } from 'react-hot-toast';

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
import MedicalAgent from './components/MedicalAgent';
import HealthDashboard from './pages/HealthDashboard';
import ARScanner from './components/ARScanner';
import { useState } from 'react';

function App() {
  const [showAR, setShowAR] = useState(false);
  return (
    <AuthProvider>
      <Router>
        <div className="app-container">
          <Toaster position="bottom-right" toastOptions={{
            style: {
              background: 'rgba(15, 23, 42, 0.95)',
              color: '#fff',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px'
            }
          }}/>
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
              <Route path="/health-dashboard" element={
                <ProtectedRoute>
                  <HealthDashboard />
                </ProtectedRoute>
              } />
              
              {/* Protected Admin Routes */}
              <Route path="/admin" element={
                <ProtectedRoute adminOnly={true}>
                  <AdminDashboard />
                </ProtectedRoute>
              } />
            </Routes>
            <MedicalAgent />
            <button 
              onClick={() => setShowAR(true)}
              style={{
                position: 'fixed',
                bottom: '100px',
                right: '20px',
                width: '60px',
                height: '60px',
                borderRadius: '30px',
                backgroundColor: 'rgba(6, 182, 212, 0.9)',
                color: 'white',
                border: '2px solid rgba(255,255,255,0.2)',
                boxShadow: '0 0 20px rgba(6, 182, 212, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                cursor: 'pointer',
                zIndex: 99
              }}
              title="AR Medicine Scanner"
            >
              📷
            </button>
            {showAR && <ARScanner onClose={() => setShowAR(false)} />}
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
