import React, { useState, useEffect, useContext } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { AuthContext } from '../context/AuthContext';

const Checkout = () => {
  const { user } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();
  
  const prescriptionPath = location.state?.prescriptionPath || '';

  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [shippingAddress, setShippingAddress] = useState({
    address: '',
    city: '',
    zipCode: '',
    phone: ''
  });
  const [deliveryType, setDeliveryType] = useState('Local');
  const [discountPercentage, setDiscountPercentage] = useState(15);
  const [paymentMethod, setPaymentMethod] = useState('Cash on Delivery');
  
  // Card details
  const [cardDetails, setCardDetails] = useState({
    number: '',
    expiry: '',
    cvv: ''
  });
  // UPI details
  const [upiId, setUpiId] = useState('');

  // Processing state
  const [processing, setProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (user && user.shippingAddress) {
      setShippingAddress({
        address: user.shippingAddress.address || '',
        city: user.shippingAddress.city || '',
        zipCode: user.shippingAddress.zipCode || '',
        phone: user.shippingAddress.phone || ''
      });
    }
  }, [user]);

  useEffect(() => {
    const fetchCart = async () => {
      try {
        const res = await api.get('/api/cart');
        setCart(res.data);
        if (res.data.items.length === 0) {
          navigate('/cart');
        }
      } catch (err) {
        console.error('Error fetching cart:', err);
        setErrorMessage('Failed to load order totals');
      } finally {
        setLoading(false);
      }
    };
    const fetchSettings = async () => {
      try {
        const res = await api.get('/api/settings');
        setDiscountPercentage(res.data.discountPercentage || 15);
      } catch (err) {
        console.error('Error fetching settings:', err);
      }
    };
    fetchCart();
    fetchSettings();
  }, [navigate]);

  const handleInputChange = (e) => {
    setShippingAddress({
      ...shippingAddress,
      [e.target.name]: e.target.value
    });
  };

  const handleCardChange = (e) => {
    setCardDetails({
      ...cardDetails,
      [e.target.name]: e.target.value
    });
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();

    if (!shippingAddress.address || !shippingAddress.city || !shippingAddress.zipCode || !shippingAddress.phone) {
      setErrorMessage('Please fill out all shipping fields.');
      return;
    }

    if (paymentMethod === 'Simulated Card') {
      if (!cardDetails.number || !cardDetails.expiry || !cardDetails.cvv) {
        setErrorMessage('Please enter card details for online payment simulation.');
        return;
      }
    } else if (paymentMethod === 'Simulated UPI') {
      if (!upiId) {
        setErrorMessage('Please enter your UPI ID for online payment simulation.');
        return;
      }
    }

    setErrorMessage('');
    setProcessing(true);

    // Micro-animation pipeline step 1
    setProcessingStep('Connecting to secure payment gateway...');
    
    setTimeout(() => {
      // Step 2
      setProcessingStep('Authorizing payment transaction...');
      
      setTimeout(() => {
        // Step 3
        setProcessingStep('Deducting medicine inventory stock & placing order...');
        
        setTimeout(async () => {
          try {
            // POST request to create the order
            await api.post('/api/orders', {
              shippingAddress,
              paymentMethod,
              prescriptionPath,
              deliveryType
            });

            // Trigger navbar update
            window.dispatchEvent(new Event('cart-updated'));
            setProcessing(false);
            navigate('/my-orders');
          } catch (err) {
            setProcessing(false);
            setErrorMessage(err.response?.data?.message || 'Failed to place order. Please try again.');
          }
        }, 1000);
      }, 1000);
    }, 1000);
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem' }}>
        <div className="processing-spinner" style={{ margin: '0 auto' }}></div>
        <p style={{ marginTop: '1.5rem', color: 'var(--text-muted)' }}>Preparing checkout layout...</p>
      </div>
    );
  }

  return (
    <div>
      {/* simulated payment processing screen */}
      {processing && (
        <div className="processing-overlay">
          <div className="processing-spinner"></div>
          <div style={{ textAlign: 'center' }}>
            <h2 className="gradient-text" style={{ marginBottom: '0.5rem' }}>Processing Checkout</h2>
            <p style={{ fontWeight: '600', color: 'var(--text-main)', fontSize: '1.1rem' }}>{processingStep}</p>
          </div>
        </div>
      )}

      <h1 className="gradient-text" style={{ marginBottom: '2rem' }}>Checkout Details 💳</h1>

      {errorMessage && (
        <div className="badge badge-danger" style={{ display: 'block', width: '100%', padding: '1rem', marginBottom: '1.5rem', textTransform: 'none', borderRadius: '12px' }}>
          {errorMessage}
        </div>
      )}

      <div className="cart-layout">
        {/* Checkout Forms */}
        <form onSubmit={handlePlaceOrder} className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <h3 style={{ borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.5rem' }}>Shipping Information</h3>
          
          <div className="form-group">
            <label className="form-label">Phone Number</label>
            <input
              type="tel"
              name="phone"
              className="form-control"
              placeholder="e.g., +91 9876543210"
              value={shippingAddress.phone}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Full Street Address</label>
            <textarea
              name="address"
              className="form-control"
              placeholder="e.g., Flat 104, Blue Ridge Towers, Phase 1"
              value={shippingAddress.address}
              onChange={handleInputChange}
              rows="3"
              required
            ></textarea>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">City</label>
              <input
                type="text"
                name="city"
                className="form-control"
                placeholder="e.g., Pune"
                value={shippingAddress.city}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Postal Zip Code</label>
              <input
                type="text"
                name="zipCode"
                className="form-control"
                placeholder="e.g., 411057"
                value={shippingAddress.zipCode}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <h3 style={{ borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.5rem', marginTop: '1rem' }}>Delivery Mode</h3>
          <div className="form-group">
            <label className="form-label">Delivery Destination</label>
            <select
              name="deliveryType"
              className="form-control form-select"
              value={deliveryType}
              onChange={(e) => setDeliveryType(e.target.value)}
            >
              <option value="Local">Local Delivery (Free)</option>
              <option value="Non-local">Non-local Delivery (Free above ₹500, otherwise ₹50)</option>
            </select>
          </div>

          <h3 style={{ borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.5rem', marginTop: '1rem' }}>Payment Method</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <label className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', cursor: 'pointer', borderColor: paymentMethod === 'Cash on Delivery' ? 'var(--color-primary)' : 'var(--border-glass)' }}>
              <input
                type="radio"
                name="paymentMethod"
                value="Cash on Delivery"
                checked={paymentMethod === 'Cash on Delivery'}
                onChange={() => setPaymentMethod('Cash on Delivery')}
              />
              <div>
                <strong>Cash on Delivery (COD)</strong>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Pay cash at your doorstep upon medicine delivery (Default).</p>
              </div>
            </label>

            <label className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', cursor: 'pointer', borderColor: paymentMethod === 'Simulated Card' ? 'var(--color-primary)' : 'var(--border-glass)' }}>
              <input
                type="radio"
                name="paymentMethod"
                value="Simulated Card"
                checked={paymentMethod === 'Simulated Card'}
                onChange={() => setPaymentMethod('Simulated Card')}
              />
              <div>
                <strong>Credit / Debit Card (Simulated)</strong>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Simulate instant card payment processing with glowing animations.</p>
              </div>
            </label>

            <label className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', cursor: 'pointer', borderColor: paymentMethod === 'Simulated UPI' ? 'var(--color-primary)' : 'var(--border-glass)' }}>
              <input
                type="radio"
                name="paymentMethod"
                value="Simulated UPI"
                checked={paymentMethod === 'Simulated UPI'}
                onChange={() => setPaymentMethod('Simulated UPI')}
              />
              <div>
                <strong>UPI Payment (Simulated)</strong>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Pay using standard UPI IDs with instant sandbox feedback.</p>
              </div>
            </label>
          </div>

          {/* Conditional Payment Details */}
          {paymentMethod === 'Simulated Card' && (
            <div className="glass-panel" style={{ background: 'rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Card Number</label>
                <input
                  type="text"
                  name="number"
                  className="form-control"
                  placeholder="4111 2222 3333 4444"
                  value={cardDetails.number}
                  onChange={handleCardChange}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Expiry (MM/YY)</label>
                  <input
                    type="text"
                    name="expiry"
                    className="form-control"
                    placeholder="12/28"
                    value={cardDetails.expiry}
                    onChange={handleCardChange}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">CVV</label>
                  <input
                    type="password"
                    name="cvv"
                    className="form-control"
                    placeholder="***"
                    maxLength="3"
                    value={cardDetails.cvv}
                    onChange={handleCardChange}
                  />
                </div>
              </div>
            </div>
          )}

          {paymentMethod === 'Simulated UPI' && (
            <div className="glass-panel" style={{ background: 'rgba(0,0,0,0.1)' }}>
              <div className="form-group">
                <label className="form-label">UPI ID</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. user@okaxis"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                />
              </div>
            </div>
          )}
        </form>

        {/* Totals Summary sidebar */}
        {cart && (
          <div className="glass-panel summary-card" style={{ height: 'fit-content' }}>
            <h3 className="summary-title">Order Overview</h3>
            
            <div style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {cart.items.map((item) => (
                <div key={item.medicineId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{item.name} <strong>x{item.quantity}</strong></span>
                  <span>₹{item.total}</span>
                </div>
              ))}
            </div>

            <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div className="summary-row">
                <span>Items Subtotal</span>
                <span>₹{cart.itemsPrice}</span>
              </div>
              <div className="summary-row discount">
                <span>{discountPercentage}% Flat Discount</span>
                <span>-₹{cart.discount}</span>
              </div>
              <div className="summary-row">
                <span>Delivery Charge</span>
                {((deliveryType === 'Non-local' && (cart.itemsPrice - cart.discount) < 500) ? 50 : 0) > 0 ? (
                  <span>₹50</span>
                ) : (
                  <span style={{ color: 'var(--color-success)', fontWeight: '600' }}>FREE</span>
                )}
              </div>
              <div className="summary-row total">
                <span>Total Billing</span>
                <span>₹{cart.itemsPrice - cart.discount + ((deliveryType === 'Non-local' && (cart.itemsPrice - cart.discount) < 500) ? 50 : 0)}</span>
              </div>
            </div>

            {prescriptionPath && (
              <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--color-success)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <span>✓</span> Prescription image attached.
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '1.5rem' }}
              onClick={handlePlaceOrder}
            >
              Place Simulated Order (₹{cart.itemsPrice - cart.discount + ((deliveryType === 'Non-local' && (cart.itemsPrice - cart.discount) < 500) ? 50 : 0)}) ➔
            </button>

            <Link to="/cart" className="btn btn-secondary" style={{ width: '100%', marginTop: '0.75rem' }}>
              Return to Cart
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Checkout;
