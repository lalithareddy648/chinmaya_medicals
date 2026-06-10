import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const CATEGORY_ICONS = { All: '💊', Tablet: '💊', Syrup: '🍶', Injection: '💉' };

const Home = () => {
  const { user } = useContext(AuthContext);
  const [medicines, setMedicines] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState(null);
  const [addingIds, setAddingIds] = useState(new Set());
  const navigate = useNavigate();

  const fetchMedicines = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/medicines', { params: { search, category } });
      setMedicines(res.data);
    } catch (err) {
      console.error('Error fetching medicines:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(fetchMedicines, 300); // debounce search
    return () => clearTimeout(timer);
  }, [search, category]);

  const handleAddToCart = async (medId) => {
    if (!user) { navigate('/login'); return; }
    setAddingIds(prev => new Set(prev).add(medId));
    try {
      await axios.post('/api/cart', { medicineId: medId, quantity: 1 });
      window.dispatchEvent(new Event('cart-updated'));
      setActionMessage({ id: medId, text: '✓ Added to cart!', type: 'success' });
    } catch (err) {
      setActionMessage({ id: medId, text: err.response?.data?.message || 'Failed to add', type: 'error' });
    } finally {
      setAddingIds(prev => { const s = new Set(prev); s.delete(medId); return s; });
      setTimeout(() => setActionMessage(null), 3000);
    }
  };

  const getStockInfo = (stock) => {
    if (stock <= 0)  return { label: 'Out Of Stock', cls: 'badge-danger',   pct: 0 };
    if (stock < 15)  return { label: `${stock} Left`,  cls: 'badge-warning', pct: Math.min((stock / 15) * 100, 100) };
    return           { label: 'In Stock',              cls: 'badge-success', pct: 100 };
  };

  const inStockCount  = medicines.filter(m => m.stock > 0).length;
  const outStockCount = medicines.filter(m => m.stock <= 0).length;

  return (
    <div>
      {/* ──────── HERO BANNER ──────── */}
      <div className="hero-banner" style={{ minHeight: '280px' }}>
        <div className="hero-text">
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 0.9rem', borderRadius: '9999px', background: 'rgba(0,242,254,0.1)', border: '1px solid rgba(0,242,254,0.3)', fontSize: '0.8rem', fontWeight: '700', color: 'var(--color-primary)', marginBottom: '1rem', letterSpacing: '0.05em' }}>
            🏥 TRUSTED ONLINE PHARMACY
          </div>
          <h1>Quality Healthcare, <br /><span className="gradient-text">Delivered Fast.</span></h1>
          <p>Order prescription & OTC medicines with a flat <strong style={{ color: 'var(--color-primary)' }}>15% discount</strong> on every order. Real-time delivery tracking included.</p>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <a href="#catalog" className="btn btn-primary">Browse Medicines 💊</a>
            {user ? (
              <Link to="/my-orders" className="btn btn-secondary">Track My Orders 🚚</Link>
            ) : (
              <Link to="/register" className="btn btn-secondary">Sign Up Free</Link>
            )}
          </div>
        </div>
        <div className="hero-image">
          <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="hGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00f2fe" /><stop offset="100%" stopColor="#4facfe" />
              </linearGradient>
            </defs>
            <circle cx="100" cy="100" r="82" fill="rgba(0,242,254,0.04)" stroke="url(#hGrad)" strokeWidth="1.5" strokeDasharray="6,4" />
            <circle cx="100" cy="100" r="60" fill="rgba(0,242,254,0.06)" stroke="url(#hGrad)" strokeWidth="1" strokeDasharray="3,5" />
            <rect x="85" y="72" width="30" height="56" rx="14" fill="url(#hGrad)" opacity="0.9" />
            <rect x="72" y="85" width="56" height="30" rx="14" fill="url(#hGrad)" opacity="0.9" />
            <circle cx="100" cy="100" r="10" fill="white" opacity="0.9" />
            <circle cx="145" cy="60"  r="18" fill="rgba(16,185,129,0.25)"  stroke="#10b981" strokeWidth="1.5" />
            <text x="145" y="65" textAnchor="middle" fill="#10b981" fontSize="14">💊</text>
            <circle cx="55"  cy="145" r="18" fill="rgba(245,158,11,0.2)" stroke="#f59e0b" strokeWidth="1.5" />
            <text x="55" y="150" textAnchor="middle" fill="#f59e0b" fontSize="14">🍶</text>
            <circle cx="148" cy="145" r="18" fill="rgba(79,172,254,0.2)"  stroke="#4facfe" strokeWidth="1.5" />
            <text x="148" y="150" textAnchor="middle" fill="#4facfe" fontSize="14">💉</text>
          </svg>
        </div>
      </div>

      {/* ──────── QUICK STATS ──────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem', marginBottom: '2.5rem' }}>
        {[
          { icon: '💊', label: 'Total Products', value: medicines.length, color: 'var(--color-primary)' },
          { icon: '✅', label: 'In Stock',        value: inStockCount,    color: 'var(--color-success)' },
          { icon: '⚠️', label: 'Out of Stock',    value: outStockCount,   color: 'var(--color-warning)' },
        ].map(s => (
          <div key={s.label} className="glass-panel" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '1.8rem' }}>{s.icon}</span>
            <div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
              <div style={{ fontSize: '1.7rem', fontWeight: '800', color: s.color }}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ──────── CATALOG SECTION ──────── */}
      <div id="catalog" className="catalog-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.5rem' }}>Medicine Catalog</h2>
          <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            Showing <strong style={{ color: 'var(--text-main)' }}>{medicines.length}</strong> result{medicines.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="controls-row">
          <div className="search-bar">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              className="form-control"
              placeholder="Search by name, description or manufacturer..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="category-pills">
            {['All', 'Tablet', 'Syrup', 'Injection'].map(cat => (
              <button key={cat} className={`category-pill ${category === cat ? 'active' : ''}`} onClick={() => setCategory(cat)}>
                {CATEGORY_ICONS[cat]} {cat}s
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem' }}>
            <div className="processing-spinner" style={{ margin: '0 auto' }} />
            <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Loading medicines...</p>
          </div>
        ) : medicines.length === 0 ? (
          <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔎</div>
            <h3 style={{ marginBottom: '0.5rem' }}>No Medicines Found</h3>
            <p style={{ color: 'var(--text-muted)' }}>Try a different search term or category.</p>
          </div>
        ) : (
          <div className="medicines-grid">
            {medicines.map((med) => {
              const originalPrice = Math.round(med.price / 0.85);
              const stockInfo = getStockInfo(med.stock);
              const isAdding = addingIds.has(med._id);

              return (
                <div key={med._id} className="glass-panel glass-panel-hover medicine-card"
                  style={{ position: 'relative', overflow: 'hidden' }}>

                  {/* Prescription ribbon */}
                  {med.needsPrescription && (
                    <div style={{
                      position: 'absolute', top: '14px', right: '-22px',
                      background: '#f59e0b', color: '#0f172a', fontSize: '0.62rem',
                      fontWeight: '800', padding: '0.2rem 2rem', transform: 'rotate(40deg)',
                      letterSpacing: '0.05em', zIndex: 1
                    }}>Rx</div>
                  )}

                  <div className="medicine-card-header">
                    <span className="badge badge-info">{CATEGORY_ICONS[med.category]} {med.category}</span>
                    <span className={`badge ${stockInfo.cls}`}>{stockInfo.label}</span>
                  </div>

                  {/* Stock progress bar */}
                  {med.stock > 0 && med.stock < 50 && (
                    <div style={{ marginBottom: '0.75rem' }}>
                      <div style={{ height: '4px', background: 'var(--bg-secondary)', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', borderRadius: '2px', transition: 'width 0.6s ease',
                          width: `${Math.min((med.stock / 50) * 100, 100)}%`,
                          background: med.stock < 15 ? 'var(--color-warning)' : 'var(--color-success)'
                        }} />
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                        Stock: {med.stock} units remaining
                      </div>
                    </div>
                  )}

                  <Link to={`/medicine/${med._id}`}>
                    <h3 className="medicine-name" style={{ transition: 'color 0.2s' }}>{med.name}</h3>
                  </Link>
                  {med.manufacturer && (
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                      🏭 {med.manufacturer}
                    </div>
                  )}
                  <p className="medicine-desc">{med.description}</p>

                  <div className="medicine-footer">
                    <div className="price-box">
                      <span className="original-price">MRP ₹{originalPrice}</span>
                      <span className="discounted-price">₹{med.price}</span>
                      <span style={{ fontSize: '0.68rem', color: 'var(--color-success)', fontWeight: '700' }}>
                        ● 15% OFF APPLIED
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', alignItems: 'flex-end' }}>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleAddToCart(med._id)}
                        disabled={med.stock <= 0 || isAdding}
                        style={{ minWidth: '110px' }}
                      >
                        {isAdding ? '⏳ Adding...' : med.stock <= 0 ? '❌ Out of Stock' : '🛒 Add to Cart'}
                      </button>
                      <Link to={`/medicine/${med._id}`} style={{ fontSize: '0.78rem', color: 'var(--color-primary)', textDecoration: 'underline' }}>
                        View Details →
                      </Link>
                    </div>
                  </div>

                  {actionMessage?.id === med._id && (
                    <div style={{
                      marginTop: '0.75rem', fontSize: '0.82rem', textAlign: 'center', fontWeight: '600',
                      padding: '0.4rem', borderRadius: '8px',
                      color: actionMessage.type === 'success' ? 'var(--color-success)' : 'var(--color-danger)',
                      background: actionMessage.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
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
