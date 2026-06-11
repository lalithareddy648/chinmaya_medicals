import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { AuthContext } from '../context/AuthContext';

const Cart = () => {
  const { user } = useContext(AuthContext);
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [prescriptionFile, setPrescriptionFile] = useState(null);
  const [prescriptionPath, setPrescriptionPath] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [discountPercentage, setDiscountPercentage] = useState(15);
  const navigate = useNavigate();

  const fetchCart = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/cart');
      setCart(res.data);
    } catch (err) {
      console.error('Error fetching cart:', err);
      setErrorMessage('Failed to load cart contents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
    const fetchSettings = async () => {
      try {
        const res = await api.get('/api/settings');
        setDiscountPercentage(res.data.discountPercentage || 15);
      } catch (err) {
        console.error('Error fetching settings:', err);
      }
    };
    fetchSettings();
  }, []);

  const handleUpdateQty = async (medId, newQty) => {
    try {
      const res = await api.put('/api/cart', { medicineId: medId, quantity: newQty });
      setCart(res.data);
      window.dispatchEvent(new Event('cart-updated'));
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating quantity');
    }
  };

  const handleRemoveItem = async (medId) => {
    try {
      const res = await api.delete(`/api/cart/${medId}`);
      setCart(res.data);
      window.dispatchEvent(new Event('cart-updated'));
    } catch (err) {
      alert(err.response?.data?.message || 'Error removing item');
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Invalid file type! Only JPG, JPEG, PNG, and PDF are allowed.');
      return;
    }

    setUploadError('');
    setPrescriptionFile(file);
    setUploading(true);

    const formData = new FormData();
    formData.append('prescription', file);

    try {
      const res = await api.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setPrescriptionPath(res.data.filePath);
    } catch (err) {
      setUploadError(err.response?.data?.message || 'Failed to upload prescription');
      setPrescriptionFile(null);
    } finally {
      setUploading(false);
    }
  };

  const handleCheckout = () => {
    if (cart.hasPrescriptionRequiredItems && !prescriptionPath) {
      setErrorMessage('Prescription file is required before you can check out.');
      return;
    }
    navigate('/checkout', { state: { prescriptionPath } });
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem' }}>
        <div className="processing-spinner" style={{ margin: '0 auto' }}></div>
        <p style={{ marginTop: '1.5rem', color: 'var(--text-muted)' }}>Loading your shopping cart...</p>
      </div>
    );
  }

  const isCartEmpty = !cart || cart.items.length === 0;

  return (
    <div>
      <h1 className="gradient-text" style={{ marginBottom: '2rem' }}>Shopping Cart 🛒</h1>

      {errorMessage && (
        <div className="badge badge-danger" style={{ display: 'block', width: '100%', padding: '1rem', marginBottom: '1.5rem', textTransform: 'none', borderRadius: '12px' }}>
          {errorMessage}
        </div>
      )}

      {isCartEmpty ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <h2 style={{ marginBottom: '1rem' }}>Your Cart is Empty</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>You haven't added any medicines to your cart yet. Explore our collection to find what you need.</p>
          <Link to="/" className="btn btn-primary">Go Browse Catalog</Link>
        </div>
      ) : (
        <div className="cart-layout">
          {/* Cart Items List */}
          <div className="cart-items-list">
            {cart.items.map((item) => {
              const itemOrigPrice = Math.round(item.price / (1 - discountPercentage / 100));
              return (
                <div key={item.medicineId} className="glass-panel cart-item">
                  <div className="cart-item-icon">
                    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="50" cy="50" r="45" fill="rgba(0, 242, 254, 0.08)" stroke="var(--color-primary)" strokeWidth="2" />
                      <path d="M40,50 L60,50 M50,40 L50,60" stroke="var(--color-primary)" strokeWidth="6" strokeLinecap="round" />
                    </svg>
                  </div>

                  <div className="cart-item-info">
                    <Link to={`/medicine/${item.medicineId}`}>
                      <div className="item-name">{item.name}</div>
                    </Link>
                    <div className="item-cat">{item.category}</div>
                    {item.needsPrescription && (
                      <span className="badge badge-warning" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem', marginTop: '0.25rem' }}>Prescription Req.</span>
                    )}
                  </div>

                  <div className="qty-selector">
                    <button className="qty-btn" onClick={() => handleUpdateQty(item.medicineId, item.quantity - 1)}>-</button>
                    <div className="qty-val">{item.quantity}</div>
                    <button className="qty-btn" onClick={() => handleUpdateQty(item.medicineId, item.quantity + 1)}>+</button>
                  </div>

                  <div className="cart-item-price">
                    ₹{item.total}
                    <div style={{ fontSize: '0.75rem', textDecoration: 'line-through', color: 'var(--text-muted)', fontWeight: '400' }}>
                      ₹{itemOrigPrice * item.quantity}
                    </div>
                  </div>

                  <button className="btn btn-danger btn-sm" onClick={() => handleRemoveItem(item.medicineId)}>
                    ✕
                  </button>
                </div>
              );
            })}
          </div>

          {/* Cart Pricing Summary Sidebar */}
          <div className="glass-panel summary-card">
            <h3 className="summary-title">Order Summary</h3>
            
            <div className="summary-row">
              <span>Items Total (Pre-discount)</span>
              <span>₹{Math.round(cart.itemsPrice / (1 - discountPercentage / 100))}</span>
            </div>

            <div className="summary-row discount">
              <span>{discountPercentage}% Flat Discount</span>
              <span>-₹{cart.discount}</span>
            </div>

            <div className="summary-row">
              <span>Delivery Charges</span>
              <span style={{ color: 'var(--color-success)', fontWeight: '600' }}>FREE</span>
            </div>

            <div className="summary-row total">
              <span>Total Price</span>
              <span>₹{cart.totalPrice}</span>
            </div>

            {/* Prescription Warning / Upload Box */}
            {cart.hasPrescriptionRequiredItems && (
              <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-glass)' }}>
                <div style={{ color: 'var(--color-warning)', fontWeight: '600', fontSize: '0.85rem', marginBottom: '0.75rem', display: 'flex', gap: '0.25rem' }}>
                  <span>⚠️</span> PRESCRIPTION REQUIRED
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                  This order contains medicines that cannot be sold without a valid doctor's prescription. Please upload your prescription below:
                </p>

                {prescriptionPath ? (
                  <div className="badge badge-success" style={{ display: 'flex', flexDirection: 'column', padding: '1rem', textTransform: 'none', borderRadius: '8px', gap: '0.5rem', width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontWeight: '700' }}>
                      <span>✓ Prescription Uploaded</span>
                      <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'inherit' }} onClick={() => setPrescriptionPath('')}>Remove</button>
                    </div>
                    <span style={{ fontSize: '0.75rem', opacity: 0.8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      File: {prescriptionFile?.name}
                    </span>
                  </div>
                ) : (
                  <div className="prescription-upload-box">
                    <input
                      type="file"
                      id="prescription-file-input"
                      style={{ display: 'none' }}
                      onChange={handleFileUpload}
                      accept=".jpg,.jpeg,.png,.pdf"
                    />
                    <label htmlFor="prescription-file-input" style={{ cursor: 'pointer', display: 'block' }}>
                      {uploading ? (
                        <>
                          <div className="processing-spinner" style={{ width: '30px', height: '30px', margin: '0 auto 0.5rem auto' }}></div>
                          <span>Uploading file...</span>
                        </>
                      ) : (
                        <>
                          <span style={{ fontSize: '1.8rem', display: 'block', marginBottom: '0.5rem' }}>📤</span>
                          <span style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--color-primary)' }}>Choose Prescription File</span>
                          <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>JPG, JPEG, PNG, or PDF</span>
                        </>
                      )}
                    </label>
                  </div>
                )}

                {uploadError && (
                  <div style={{ color: 'var(--color-danger)', fontSize: '0.8rem', marginTop: '0.5rem', fontWeight: '600' }}>
                    {uploadError}
                  </div>
                )}
              </div>
            )}

            <button
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '1.5rem' }}
              onClick={handleCheckout}
              disabled={cart.hasPrescriptionRequiredItems && !prescriptionPath}
            >
              Proceed to Checkout ➔
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
