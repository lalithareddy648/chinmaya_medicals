import React, { useState, useEffect } from 'react';
import axios from 'axios';
import OrderTimeline from '../components/OrderTimeline';

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/orders/myorders');
      setOrders(res.data);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to retrieve order logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem' }}>
        <div className="processing-spinner" style={{ margin: '0 auto' }}></div>
        <p style={{ marginTop: '1.5rem', color: 'var(--text-muted)' }}>Retrieving your order logs...</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="gradient-text" style={{ marginBottom: '2rem' }}>Order History & Tracking 📦</h1>

      {error && (
        <div className="badge badge-danger" style={{ display: 'block', width: '100%', padding: '1rem', marginBottom: '1.5rem', textTransform: 'none', borderRadius: '12px' }}>
          {error}
        </div>
      )}

      {orders.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <h2 style={{ marginBottom: '1rem' }}>No Orders Found</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>You haven't placed any orders yet. Add items to your cart and complete checkout to see them here.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {orders.map((order) => (
            <div key={order._id} className="glass-panel" style={{ borderLeft: '4px solid var(--color-primary)' }}>
              
              {/* Order Info Row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ORDER ID</div>
                  <strong style={{ fontSize: '1.1rem', color: 'var(--color-primary)' }}>#{order._id}</strong>
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>DATE PLACED</div>
                  <strong>{new Date(order.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</strong>
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>PAYMENT METHOD</div>
                  <strong>{order.paymentMethod}</strong>
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>TOTAL PAID</div>
                  <strong style={{ fontSize: '1.2rem', color: 'var(--color-success)' }}>₹{order.totalPrice}</strong>
                </div>
              </div>

              {/* Order Tracking Timeline */}
              <OrderTimeline status={order.deliveryStatus} />

              {/* Order details grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem', marginTop: '1.5rem', borderTop: '1px solid var(--border-glass)', paddingTop: '1.5rem' }}>
                
                {/* Medicines List */}
                <div>
                  <h4 style={{ marginBottom: '1rem', color: 'var(--text-muted)' }}>Purchased Items</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {order.items.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
                        <div>
                          <strong>{item.name}</strong> <span className="badge badge-info" style={{ fontSize: '0.65rem', marginLeft: '5px' }}>{item.category}</span>
                        </div>
                        <div style={{ color: 'var(--color-primary)' }}>
                          ₹{item.price} x {item.quantity} = <strong>₹{item.total}</strong>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Delivery Address */}
                <div className="glass-panel" style={{ background: 'rgba(0,0,0,0.15)', padding: '1.25rem' }}>
                  <h4 style={{ marginBottom: '0.75rem', color: 'var(--text-muted)' }}>Shipping Destination</h4>
                  <p style={{ fontSize: '0.95rem', fontWeight: '500', marginBottom: '0.5rem' }}>Recipient: {order.userName || user?.name}</p>
                  <p style={{ fontSize: '0.9rem', color: '#cbd5e1', whiteSpace: 'pre-wrap', marginBottom: '0.5rem' }}>
                    {order.shippingAddress.address}, {order.shippingAddress.city} - {order.shippingAddress.zipCode}
                  </p>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>📞 Phone: {order.shippingAddress.phone}</p>
                  
                  {order.prescription && (
                    <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-glass)' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Prescription file:</span>
                      <a href={order.prescription} target="_blank" rel="noopener noreferrer" style={{ display: 'block', color: 'var(--color-primary)', fontSize: '0.85rem', fontWeight: '600', textDecoration: 'underline', marginTop: '0.25rem' }}>
                        View Uploaded Prescription 🔗
                      </a>
                    </div>
                  )}
                </div>

              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyOrders;
