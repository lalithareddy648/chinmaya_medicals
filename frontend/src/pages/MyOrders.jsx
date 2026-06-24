import React, { useState, useEffect, useCallback } from 'react';
import api from '../api';
import OrderTimeline from '../components/OrderTimeline';
import LiveTrackingMap from '../components/LiveTrackingMap';
import { Link } from 'react-router-dom';

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [expandedOrder, setExpandedOrder] = useState(null);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/orders/myorders');
      if (Array.isArray(res.data)) {
        setOrders(res.data);
      } else {
        console.error('Invalid orders response format:', res.data);
        setOrders([]);
      }
      setLastUpdated(new Date());
    } catch (err) {
      setError('Failed to retrieve your orders. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    const hasActiveDelivery = orders.some(o => o.deliveryStatus === 'Out For Delivery');
    const intervalTime = hasActiveDelivery ? 5000 : 60000;
    
    const interval = setInterval(fetchOrders, intervalTime);
    return () => clearInterval(interval);
  }, [orders, fetchOrders]);

  const getStatusColor = (status) => {
    const map = {
      'Placed':           '#94a3b8',
      'Confirmed':        '#00f2fe',
      'Packed':           '#4facfe',
      'Out For Delivery': '#f59e0b',
      'Delivered':        '#10b981',
    };
    return map[status] || '#94a3b8';
  };

  const getStatusEmoji = (status) => {
    const map = {
      'Placed': '📋', 'Confirmed': '✅', 'Packed': '📦',
      'Out For Delivery': '🚚', 'Delivered': '🎉',
    };
    return map[status] || '📋';
  };

  if (loading && orders.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem' }}>
        <div className="processing-spinner" style={{ margin: '0 auto' }} />
        <p style={{ marginTop: '1.5rem', color: 'var(--text-muted)' }}>Loading your order history...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 className="gradient-text">My Orders & Tracking 📦</h1>
          {lastUpdated && (
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Last refreshed: {lastUpdated.toLocaleTimeString()} &nbsp;•&nbsp; Auto-refreshes every 60s
            </p>
          )}
        </div>
        <button className="btn btn-secondary btn-sm" onClick={fetchOrders} disabled={loading}>
          {loading ? '⏳ Refreshing...' : '🔄 Refresh Status'}
        </button>
      </div>

      {error && (
        <div className="badge badge-danger" style={{ display: 'block', width: '100%', padding: '1rem', marginBottom: '1.5rem', textTransform: 'none', borderRadius: '12px' }}>
          {error}
        </div>
      )}

      {orders.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '5rem 2rem' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🛒</div>
          <h2 style={{ marginBottom: '0.75rem' }}>No Orders Yet</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
            You haven't placed any orders. Browse our catalog to get started!
          </p>
          <Link to="/" className="btn btn-primary">Browse Medicines</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          {orders.map((order) => {
            const isExpanded = expandedOrder === order._id;
            const statusColor = getStatusColor(order.deliveryStatus);
            return (
              <div key={order._id} className="glass-panel" style={{
                borderLeft: `4px solid ${statusColor}`,
                boxShadow: `0 0 20px rgba(0,0,0,0.3), -4px 0 15px ${statusColor}33`
              }}>
                {/* ── Top Summary Row ── */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ fontSize: '2.5rem' }}>{getStatusEmoji(order.deliveryStatus)}</span>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Order ID</div>
                      <div style={{ fontWeight: '700', color: 'var(--color-primary)', fontSize: '1rem' }}>#{order._id}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                        {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Items</div>
                      <div style={{ fontWeight: '700' }}>{order.items.length} item{order.items.length !== 1 ? 's' : ''}</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Payment</div>
                      <div style={{ fontWeight: '600', fontSize: '0.85rem' }}>{order.paymentMethod}</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total</div>
                      <div style={{ fontWeight: '800', fontSize: '1.3rem', color: 'var(--color-success)' }}>₹{order.totalPrice}</div>
                    </div>
                    <div style={{
                      padding: '0.5rem 1.25rem',
                      borderRadius: '9999px',
                      background: `${statusColor}18`,
                      border: `1px solid ${statusColor}50`,
                      color: statusColor,
                      fontWeight: '700',
                      fontSize: '0.85rem',
                      whiteSpace: 'nowrap'
                    }}>
                      {getStatusEmoji(order.deliveryStatus)} {order.deliveryStatus}
                    </div>
                  </div>
                </div>

                {/* ── Delivery Timeline ── */}
                <div style={{ marginTop: '1.5rem' }}>
                  <OrderTimeline status={order.deliveryStatus} />
                  
                  {/* Live GPS Tracking map logic */}
                  {(order.deliveryStatus === 'Out For Delivery' || order.deliveryStatus === 'Delivered') && isExpanded && (
                    <LiveTrackingMap 
                      status={order.deliveryStatus} 
                      customerCoordinates={order.customerCoordinates}
                      driverCoordinates={order.driverCoordinates}
                    />
                  )}
                </div>

                {/* ── Toggle Details ── */}
                <button
                  className="btn btn-secondary btn-sm"
                  style={{ marginTop: '0.5rem', width: '100%' }}
                  onClick={() => setExpandedOrder(isExpanded ? null : order._id)}
                >
                  {isExpanded ? '▲ Hide Order Details' : '▼ View Order Details'}
                </button>

                {isExpanded && (
                  <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-glass)', display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem' }}>

                    {/* Items List */}
                    <div>
                      <h4 style={{ marginBottom: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Purchased Medicines
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {order.items.map((item, idx) => (
                          <div key={idx} style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            background: 'rgba(255,255,255,0.02)', padding: '0.85rem 1.1rem',
                            borderRadius: '10px', border: '1px solid var(--border-glass)'
                          }}>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                <span style={{ fontWeight: '600' }}>{item.name}</span>
                                <span className="badge badge-info" style={{ fontSize: '0.65rem' }}>{item.category}</span>
                                {item.discount > 0 && (
                                  <span className="badge badge-success" style={{ fontSize: '0.6rem' }}>{item.discount}% OFF</span>
                                )}
                              </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                {item.discount > 0 ? (
                                  <>
                                    <span style={{ textDecoration: 'line-through', marginRight: '0.4rem' }}>₹{item.price}</span>
                                    <span>₹{item.discountedPrice} × {item.quantity}</span>
                                  </>
                                ) : (
                                  <span>₹{item.price} × {item.quantity}</span>
                                )}
                              </div>
                              <div style={{ fontWeight: '700', color: 'var(--color-primary)' }}>₹{item.total}</div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Price Breakdown */}
                      <div style={{ marginTop: '1.25rem', padding: '1rem', borderRadius: '10px', background: 'rgba(0,0,0,0.15)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Subtotal</span>
                          <span>₹{order.itemsPrice}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                          <span style={{ color: 'var(--color-success)' }}>Discount Applied</span>
                          <span style={{ color: 'var(--color-success)' }}>-₹{order.discount}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Delivery ({order.deliveryType || 'Local'})</span>
                          <span>{order.deliveryCharge > 0 ? `₹${order.deliveryCharge}` : 'FREE'}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.5rem', borderTop: '1px solid var(--border-glass)', fontWeight: '800', fontSize: '1.1rem' }}>
                          <span>Total Paid</span>
                          <span style={{ color: 'var(--color-success)' }}>₹{order.totalPrice}</span>
                        </div>
                      </div>
                    </div>

                    {/* Shipping Info */}
                    <div className="glass-panel" style={{ background: 'rgba(0,0,0,0.15)', padding: '1.25rem' }}>
                      <h4 style={{ marginBottom: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Delivery Address
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <span>🏠</span>
                          <span style={{ fontSize: '0.92rem' }}>{order.shippingAddress.address}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <span>🏙️</span>
                          <span style={{ fontSize: '0.92rem' }}>{order.shippingAddress.city} — {order.shippingAddress.zipCode}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <span>📞</span>
                          <span style={{ fontSize: '0.92rem' }}>{order.shippingAddress.phone}</span>
                        </div>
                      </div>

                      {order.prescription && (
                        <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-glass)' }}>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>📎 Prescription Attached</div>
                          <a href={order.prescription} target="_blank" rel="noopener noreferrer"
                            style={{ color: 'var(--color-primary)', fontSize: '0.85rem', fontWeight: '600', textDecoration: 'underline' }}>
                            View Uploaded File 🔗
                          </a>
                        </div>
                      )}

                      <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-glass)' }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>💳 Payment Method</div>
                        <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>{order.paymentMethod}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyOrders;
