import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { AuthContext } from '../context/AuthContext';

import { toast } from 'react-hot-toast';

const MedicineDetails = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const [medicine, setMedicine] = useState(null);
  const [relatedMedicines, setRelatedMedicines] = useState([]);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [globalDiscount, setGlobalDiscount] = useState(15);
  const [reminderTime, setReminderTime] = useState('08:00');
  const [showReminderForm, setShowReminderForm] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMedicine = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/api/medicines/${id}`);
        setMedicine(res.data);
        
        // Fetch related medicines
        const relatedRes = await api.get('/api/medicines', { params: { category: res.data.category } });
        // Filter out the current medicine and take up to 4
        const filtered = relatedRes.data.filter(m => m._id !== res.data._id).slice(0, 4);
        setRelatedMedicines(filtered);
      } catch (err) {
        setError(err.response?.data?.message || 'Medicine not found');
      } finally {
        setLoading(false);
      }
    };
    const fetchSettings = async () => {
      try {
        const res = await api.get('/api/settings');
        setGlobalDiscount(res.data.discountPercentage || 15);
      } catch (err) {
        console.error('Error fetching settings:', err);
      }
    };
    fetchMedicine();
    fetchSettings();
  }, [id]);

  const incrementQty = () => {
    if (qty < medicine.stock) {
      setQty(qty + 1);
    }
  };

  const decrementQty = () => {
    if (qty > 1) {
      setQty(qty - 1);
    }
  };

  const handleAddToCart = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      await api.post('/api/cart', { medicineId: medicine._id, quantity: qty });
      
      // Sync navbar cart
      window.dispatchEvent(new Event('cart-updated'));

      toast.success(`Successfully added ${qty} item(s) to cart! ✓`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add to cart');
    }
  };

  const handleSetReminder = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      await api.post('/api/health/reminders', {
        medicineId: medicine._id,
        reminderTime,
        frequency: 'Daily'
      });
      toast.success('Pill reminder set successfully! Manage it in Health Dashboard.');
      setShowReminderForm(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to set reminder');
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem' }}>
        <div className="processing-spinner" style={{ margin: '0 auto' }}></div>
        <p style={{ marginTop: '1.5rem', color: 'var(--text-muted)' }}>Loading medicine details...</p>
      </div>
    );
  }

  if (error || !medicine) {
    return (
      <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
        <h2 style={{ color: 'var(--color-danger)', marginBottom: '1rem' }}>Error Loading Details</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>{error || 'The medicine details could not be loaded.'}</p>
        <Link to="/" className="btn btn-primary">Back to Home</Link>
      </div>
    );
  }

  const discPct = (medicine.discount !== undefined && medicine.discount > 0) ? Number(medicine.discount) : globalDiscount;
  const discountedPrice = Math.round(medicine.price - (medicine.price * (discPct / 100)));

  return (
    <div>
      <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary)', fontWeight: '600', marginBottom: '2rem' }}>
        ← Back to Catalog
      </Link>

      <div className="glass-panel details-container">
        {/* Visual Graphic representation */}
        <div className="details-visual" style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          {medicine.image ? (
            <img src={medicine.image} alt={medicine.name} style={{ width: '100%', height: '100%', objectFit: 'contain', maxHeight: '300px' }} />
          ) : (
            <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style={{ maxHeight: '200px' }}>
              <defs>
                <linearGradient id="detailGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#00f2fe" />
                  <stop offset="100%" stopColor="#4facfe" />
                </linearGradient>
              </defs>
              {medicine.category === 'Tablet' ? (
                <g transform="rotate(-45 50 50)">
                  <rect x="35" y="25" width="30" height="50" rx="15" fill="url(#detailGrad)" />
                  <rect x="35" y="25" width="30" height="25" rx="15" fill="rgba(255,255,255,0.25)" />
                  <line x1="35" y1="50" x2="65" y2="50" stroke="var(--bg-secondary)" strokeWidth="2" />
                </g>
              ) : medicine.category === 'Syrup' ? (
                <g>
                  <path d="M40,35 L60,35 L60,45 L65,45 L65,85 L35,85 L35,45 L40,45 Z" fill="url(#detailGrad)" />
                  <rect x="43" y="25" width="14" height="10" fill="rgba(255,255,255,0.3)" />
                  <rect x="42" y="55" width="16" height="20" fill="rgba(255,255,255,0.7)" />
                  <circle cx="50" cy="65" r="3" fill="var(--color-danger)" />
                </g>
              ) : (
                <g transform="rotate(45 50 50)">
                  <rect x="45" y="10" width="10" height="50" rx="2" fill="rgba(255,255,255,0.3)" stroke="url(#detailGrad)" strokeWidth="2" />
                  <line x1="50" y1="60" x2="50" y2="85" stroke="url(#detailGrad)" strokeWidth="3" />
                  <rect x="48" y="20" width="4" height="30" fill="url(#detailGrad)" />
                  <rect x="40" y="85" width="20" height="4" fill="rgba(255,255,255,0.5)" />
                </g>
              )}
            </svg>
          )}
          <span className="badge badge-info" style={{ marginTop: '1rem' }}>{medicine.category}</span>
        </div>

        {/* Detailed specs & details */}
        <div className="details-info">
          <h1>{medicine.name}</h1>
          <p className="manufacturer">Manufactured by: <strong>{medicine.manufacturer || 'General Pharma'}</strong></p>
          
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
            {medicine.stock > 0 ? (
              <span className="badge badge-success">In Stock ({medicine.stock} units)</span>
            ) : (
              <span className="badge badge-danger">Out Of Stock</span>
            )}
            {medicine.needsPrescription && (
              <span className="badge badge-warning">Prescription Required</span>
            )}
          </div>

          <p className="details-desc">{medicine.description}</p>

          <div className="specs-grid">
            {discPct > 0 && (
              <div className="spec-item">
                <div className="spec-label">Original MRP</div>
                <div className="spec-value" style={{ textDecoration: 'line-through', color: 'var(--text-muted)' }}>
                  ₹{medicine.price}
                </div>
              </div>
            )}
            <div className="spec-item">
              <div className="spec-label">Offer Price</div>
              <div className="spec-value" style={{ color: 'var(--color-primary)', fontSize: '1.4rem' }}>
                ₹{discountedPrice}
                {discPct > 0 && (
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-success)', fontWeight: '600' }}> ({discPct}% OFF)</span>
                )}
              </div>
            </div>
            <div className="spec-item">
              <div className="spec-label">Recommended Dosage</div>
              <div className="spec-value">{medicine.dosage || 'Take as directed by doctor'}</div>
            </div>
            {medicine.expiryDate && (
              <div className="spec-item">
                <div className="spec-label">Expiry Date</div>
                <div className="spec-value" style={{ color: 'var(--color-danger)' }}>
                  {medicine.expiryDate}
                </div>
              </div>
            )}
          </div>

          <div className="purchase-actions">
            {medicine.stock > 0 && (
              <div className="qty-selector">
                <button className="qty-btn" onClick={decrementQty}>-</button>
                <div className="qty-val">{qty}</div>
                <button className="qty-btn" onClick={incrementQty}>+</button>
              </div>
            )}

            <button
              className="btn btn-primary"
              style={{ flexGrow: 1 }}
              onClick={handleAddToCart}
              disabled={medicine.stock <= 0}
            >
              Add to Shopping Cart 🛒
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => setShowReminderForm(!showReminderForm)}
            >
              ⏰ Set Reminder
            </button>
          </div>

          {showReminderForm && (
            <div className="glass-panel" style={{ marginTop: '1rem', padding: '1rem' }}>
              <h4 style={{ marginBottom: '0.5rem' }}>Daily Pill Reminder</h4>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <input 
                  type="time" 
                  value={reminderTime} 
                  onChange={(e) => setReminderTime(e.target.value)}
                  style={{ background: 'var(--bg-secondary)', color: 'white', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-glass)' }}
                />
                <button className="btn btn-primary btn-sm" onClick={handleSetReminder}>Save</button>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Reviews Section */}
      <div className="glass-panel" style={{ marginTop: '2.5rem' }}>
        <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.5rem' }}>
          Customer Reviews & Ratings ⭐
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2.5fr', gap: '2rem' }}>
          {/* Rating Breakdown */}
          <div style={{ textAlign: 'center', borderRight: '1px solid var(--border-glass)', paddingRight: '2rem' }}>
            <h1 style={{ fontSize: '3.5rem', color: 'var(--color-primary)' }}>4.8</h1>
            <div style={{ color: 'var(--color-warning)', fontSize: '1.2rem', marginBottom: '0.5rem' }}>⭐⭐⭐⭐⭐</div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Based on 42 customer purchases</p>
          </div>

          {/* User Reviews */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <strong style={{ fontSize: '0.95rem' }}>Rahul K.</strong>
                <span style={{ color: 'var(--color-warning)', fontSize: '0.85rem' }}>⭐⭐⭐⭐⭐</span>
              </div>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>"Prompt delivery! The discount was automatically applied. Very convenient to order on this platform."</p>
            </div>
            
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <strong style={{ fontSize: '0.95rem' }}>Dr. Anita Desai</strong>
                <span style={{ color: 'var(--color-warning)', fontSize: '0.85rem' }}>⭐⭐⭐⭐★</span>
              </div>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>"Good quality medicines from trusted manufacturers. Highly recommend for regular family prescriptions."</p>
            </div>
          </div>
        </div>
      </div>

      {/* Related Medicines Section */}
      {relatedMedicines.length > 0 && (
        <div style={{ marginTop: '3rem' }}>
          <h3 style={{ marginBottom: '1.5rem', fontSize: '1.4rem' }}>You Might Also Need</h3>
          <div className="medicines-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
            {relatedMedicines.map((med) => {
              const rDiscPct = (med.discount !== undefined && med.discount > 0) ? Number(med.discount) : globalDiscount;
              const rDiscountedPrice = Math.round(med.price - (med.price * (rDiscPct / 100)));
              
              return (
                <div key={med._id} className="medicine-card" style={{ padding: '0', overflow: 'hidden' }}>
                  <div style={{ height: '160px', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                    {med.image ? (
                      <img src={med.image} alt={med.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                    ) : (
                      <span style={{ fontSize: '3rem' }}>{med.category === 'Tablet' ? '💊' : med.category === 'Syrup' ? '🍶' : '💉'}</span>
                    )}
                  </div>
                  <div style={{ padding: '1rem' }}>
                    <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{med.name}</h4>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                      <span style={{ fontWeight: '700', color: 'var(--color-primary)' }}>₹{rDiscountedPrice}</span>
                      <Link to={`/medicine/${med._id}`} className="btn btn-secondary btn-sm" style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem' }}>View</Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicineDetails;
