import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const Home = () => {
  const { user } = useContext(AuthContext);
  const [medicines, setMedicines] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState(null);
  const navigate = useNavigate();

  const fetchMedicines = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/medicines', {
        params: { search, category }
      });
      setMedicines(res.data);
    } catch (err) {
      console.error('Error fetching medicines:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedicines();
  }, [search, category]);

  const handleAddToCart = async (medId) => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      await axios.post('/api/cart', { medicineId: medId, quantity: 1 });
      
      // Dispatch global cart update event
      window.dispatchEvent(new Event('cart-updated'));

      setActionMessage({ id: medId, text: 'Added to cart successfully! ✓', type: 'success' });
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to add item';
      setActionMessage({ id: medId, text: errMsg, type: 'error' });
      setTimeout(() => setActionMessage(null), 4000);
    }
  };

  const getStockBadge = (stock) => {
    if (stock <= 0) {
      return <span className="badge badge-danger">Out Of Stock</span>;
    } else if (stock < 15) {
      return <span className="badge badge-warning">Only {stock} Left</span>;
    } else {
      return <span className="badge badge-success">In Stock</span>;
    }
  };

  return (
    <div>
      {/* Hero Banner */}
      <div className="hero-banner">
        <div className="hero-text">
          <h1>Quality Healthcare, <br/><span className="gradient-text">Delivered Fast.</span></h1>
          <p>Order prescription and over-the-counter medicines online. Enjoy a flat 15% discount on all orders, secure simulated checkout, and real-time delivery status tracking.</p>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <a href="#catalog" className="btn btn-primary">Browse Medicines</a>
            {user?.isAdmin && <Link to="/admin" className="btn btn-secondary">Go to Admin Panel</Link>}
          </div>
        </div>
        <div className="hero-image">
          {/* Stunning Inline Medical SVG */}
          <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="svgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00f2fe" />
                <stop offset="100%" stopColor="#4facfe" />
              </linearGradient>
            </defs>
            <circle cx="100" cy="100" r="80" fill="rgba(0, 242, 254, 0.05)" stroke="url(#svgGrad)" strokeWidth="2" strokeDasharray="5,5" />
            <path d="M70,100 L130,100 M100,70 L100,130" stroke="url(#svgGrad)" strokeWidth="16" strokeLinecap="round" />
            <circle cx="100" cy="100" r="12" fill="#10b981" />
            <path d="M40,140 Q100,180 160,140" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="4" />
          </svg>
        </div>
      </div>

      {/* Catalog Section */}
      <div id="catalog" className="catalog-section">
        <div className="controls-row">
          {/* Live Search Bar */}
          <div className="search-bar">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              className="form-control"
              placeholder="Search medicines by name or manufacturer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Category Filter Pills */}
          <div className="category-pills">
            {['All', 'Tablet', 'Syrup', 'Injection'].map((cat) => (
              <button
                key={cat}
                className={`category-pill ${category === cat ? 'active' : ''}`}
                onClick={() => setCategory(cat)}
              >
                {cat}s
              </button>
            ))}
          </div>
        </div>

        {/* Medicines Catalog Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div className="processing-spinner" style={{ margin: '0 auto' }}></div>
            <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Loading catalog...</p>
          </div>
        ) : medicines.length === 0 ? (
          <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <h3 style={{ marginBottom: '0.5rem' }}>No medicines found</h3>
            <p style={{ color: 'var(--text-muted)' }}>We couldn't find any medicines matching your filters. Try checking your spelling or selecting another category.</p>
          </div>
        ) : (
          <div className="medicines-grid">
            {medicines.map((med) => {
              const originalPrice = Math.round(med.price / 0.85);
              return (
                <div key={med._id} className="glass-panel glass-panel-hover medicine-card">
                  <div className="medicine-card-header">
                    <span className="badge badge-info">{med.category}</span>
                    {getStockBadge(med.stock)}
                  </div>
                  
                  <Link to={`/medicine/${med._id}`}>
                    <h3 className="medicine-name">{med.name}</h3>
                  </Link>
                  {med.manufacturer && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                      By {med.manufacturer}
                    </div>
                  )}
                  <p className="medicine-desc">{med.description}</p>
                  
                  {med.needsPrescription && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--color-warning)', fontSize: '0.8rem', fontWeight: '600', marginBottom: '1rem' }}>
                      <span>⚠️</span> Requires Prescription
                    </div>
                  )}

                  <div className="medicine-footer">
                    <div className="price-box">
                      <span className="original-price">₹{originalPrice}</span>
                      <span className="discounted-price">₹{med.price}</span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--color-success)', fontWeight: '600' }}>15% OFF Applied</span>
                    </div>

                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handleAddToCart(med._id)}
                      disabled={med.stock <= 0}
                    >
                      Add to Cart 🛒
                    </button>
                  </div>
                  
                  {actionMessage && actionMessage.id === med._id && (
                    <div style={{
                      marginTop: '0.75rem',
                      fontSize: '0.85rem',
                      textAlign: 'center',
                      fontWeight: '600',
                      color: actionMessage.type === 'success' ? 'var(--color-success)' : 'var(--color-danger)'
                    }}>
                      {actionMessage.text}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
