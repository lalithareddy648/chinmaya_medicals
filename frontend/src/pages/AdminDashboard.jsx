import React, { useState, useEffect } from 'react';
import api from '../api';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview'); // overview, orders, inventory
  const [orders, setOrders] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [stats, setStats] = useState({
    revenue: 0,
    ordersCount: 0,
    outOfStock: 0,
    totalMedicines: 0
  });

  // Modal / Form States
  const [showMedModal, setShowMedModal] = useState(false);
  const [editMed, setEditMed] = useState(null); // null means adding a new medicine
  const [medForm, setMedForm] = useState({
    name: '',
    category: 'Tablet',
    description: '',
    price: '',
    discount: 0,
    stock: '',
    needsPrescription: false,
    manufacturer: '',
    dosage: ''
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [discountPercentage, setDiscountPercentage] = useState(15);

  const loadData = async () => {
    try {
      setLoading(true);
      const ordersRes = await api.get('/api/orders');
      const medsRes = await api.get('/api/medicines');
      const settingsRes = await api.get('/api/settings');
      
      setOrders(ordersRes.data);
      setMedicines(medsRes.data);
      setDiscountPercentage(settingsRes.data.discountPercentage || 15);

      // Compute stats
      const totalRev = ordersRes.data.reduce((sum, order) => sum + order.totalPrice, 0);
      const outStock = medsRes.data.filter(med => med.stock <= 0).length;

      setStats({
        revenue: totalRev,
        ordersCount: ordersRes.data.length,
        outOfStock: outStock,
        totalMedicines: medsRes.data.length
      });
      
    } catch (err) {
      console.error(err);
      setError('Failed to fetch administrative data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await api.put(`/api/orders/${orderId}/status`, { status: newStatus });
      setMessage(`Order #${orderId} status updated to ${newStatus} successfully! ✓`);
      setTimeout(() => setMessage(''), 3000);
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating status');
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      await api.put('/api/settings', { discountPercentage });
      setMessage('Global store discount updated successfully! ✓');
      setTimeout(() => setMessage(''), 3000);
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving settings');
    }
  };

  const handleMedFormChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setMedForm({
      ...medForm,
      [e.target.name]: value
    });
  };

  const handleOpenAddModal = () => {
    setEditMed(null);
    setMedForm({
      name: '',
      category: 'Tablet',
      description: '',
      price: '',
      discount: 0,
      stock: '',
      needsPrescription: false,
      manufacturer: '',
      dosage: ''
    });
    setShowMedModal(true);
  };

  const handleOpenEditModal = (med) => {
    setEditMed(med);
    setMedForm({
      name: med.name,
      category: med.category,
      description: med.description || '',
      price: med.price,
      discount: med.discount !== undefined ? med.discount : 0,
      stock: med.stock,
      needsPrescription: med.needsPrescription || false,
      manufacturer: med.manufacturer || '',
      dosage: med.dosage || ''
    });
    setShowMedModal(true);
  };

  const handleSaveMedicine = async (e) => {
    e.preventDefault();

    if (!medForm.name || !medForm.price || medForm.stock === '') {
      alert('Please fill out name, price, and stock fields.');
      return;
    }

    const discount = Number(medForm.discount) || 0;
    if (discount < 0 || discount > 100) {
      alert('Discount must be between 0 and 100.');
      return;
    }

    try {
      const payload = { ...medForm, discount };
      if (editMed) {
        await api.put(`/api/medicines/${editMed._id}`, payload);
        setMessage(`Medicine "${medForm.name}" updated successfully! ✓`);
      } else {
        await api.post('/api/medicines', payload);
        setMessage(`New medicine "${medForm.name}" added successfully! ✓`);
      }

      setShowMedModal(false);
      setTimeout(() => setMessage(''), 3000);
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving medicine details');
    }
  };

  const handleDeleteMedicine = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}" from inventory?`)) return;

    try {
      await api.delete(`/api/medicines/${id}`);
      setMessage(`Medicine "${name}" deleted successfully from inventory. ✓`);
      setTimeout(() => setMessage(''), 3000);
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error deleting medicine');
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem' }}>
        <div className="processing-spinner" style={{ margin: '0 auto' }}></div>
        <p style={{ marginTop: '1.5rem', color: 'var(--text-muted)' }}>Loading administrative system data...</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="gradient-text" style={{ marginBottom: '2.5rem' }}>Admin Control Center 🧑💼</h1>

      {message && (
        <div className="badge badge-success" style={{ display: 'block', width: '100%', padding: '1rem', marginBottom: '1.5rem', textTransform: 'none', borderRadius: '12px', textAlign: 'center' }}>
          {message}
        </div>
      )}

      {error && (
        <div className="badge badge-danger" style={{ display: 'block', width: '100%', padding: '1rem', marginBottom: '1.5rem', textTransform: 'none', borderRadius: '12px', textAlign: 'center' }}>
          {error}
        </div>
      )}

      <div className="admin-grid">
        {/* Admin Navigation Sidebar */}
        <div className="glass-panel admin-sidebar">
          <button className={`admin-sidebar-btn ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
            📊 Dashboard Overview
          </button>
          <button className={`admin-sidebar-btn ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>
            📦 Manage Orders
          </button>
          <button className={`admin-sidebar-btn ${activeTab === 'inventory' ? 'active' : ''}`} onClick={() => setActiveTab('inventory')}>
            💊 Manage Inventory
          </button>
          <button className={`admin-sidebar-btn ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
            ⚙️ Store Settings
          </button>
        </div>

        {/* Admin Main Display Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <>
              {/* Analytics widgets */}
              <div className="stats-grid">
                <div className="glass-panel stat-card">
                  <div className="stat-info">
                    <div className="stat-lbl">Total Sales</div>
                    <div className="stat-val gradient-text">₹{stats.revenue}</div>
                  </div>
                  <div className="stat-icon">💰</div>
                </div>

                <div className="glass-panel stat-card">
                  <div className="stat-info">
                    <div className="stat-lbl">Total Orders</div>
                    <div className="stat-val">{stats.ordersCount}</div>
                  </div>
                  <div className="stat-icon">📦</div>
                </div>

                <div className="glass-panel stat-card">
                  <div className="stat-info">
                    <div className="stat-lbl">Active Medicines</div>
                    <div className="stat-val">{stats.totalMedicines}</div>
                  </div>
                  <div className="stat-icon">💊</div>
                </div>

                <div className="glass-panel stat-card">
                  <div className="stat-info">
                    <div className="stat-lbl">Out Of Stock</div>
                    <div className="stat-val" style={{ color: stats.outOfStock > 0 ? 'var(--color-danger)' : 'var(--text-main)' }}>
                      {stats.outOfStock}
                    </div>
                  </div>
                  <div className="stat-icon">🚨</div>
                </div>
              </div>

              {/* Visual CSS-based analytics */}
              <div className="glass-panel">
                <h3 style={{ marginBottom: '1.5rem' }}>Store Analytics Dashboard</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  
                  {/* Category Breakdown chart */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                      <span>Tablets Stock Levels</span>
                      <span>{medicines.filter(m => m.category === 'Tablet').length} Products</span>
                    </div>
                    <div style={{ height: '8px', background: 'var(--bg-secondary)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', background: 'var(--color-primary)', width: `${(medicines.filter(m => m.category === 'Tablet').length / stats.totalMedicines) * 100}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                      <span>Syrups Stock Levels</span>
                      <span>{medicines.filter(m => m.category === 'Syrup').length} Products</span>
                    </div>
                    <div style={{ height: '8px', background: 'var(--bg-secondary)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', background: 'var(--color-secondary)', width: `${(medicines.filter(m => m.category === 'Syrup').length / stats.totalMedicines) * 100}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                      <span>Injections Stock Levels</span>
                      <span>{medicines.filter(m => m.category === 'Injection').length} Products</span>
                    </div>
                    <div style={{ height: '8px', background: 'var(--bg-secondary)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', background: 'var(--color-success)', width: `${(medicines.filter(m => m.category === 'Injection').length / stats.totalMedicines) * 100}%` }}></div>
                    </div>
                  </div>

                </div>
              </div>
            </>
          )}

          {/* TAB 2: ORDERS MANAGEMENT */}
          {activeTab === 'orders' && (
            <div className="glass-panel">
              <h3 style={{ marginBottom: '1.5rem' }}>Manage Customer Orders</h3>
              {orders.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>No orders have been placed in the store yet.</p>
              ) : (
                <div className="data-table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>Customer</th>
                        <th>Billing</th>
                        <th>Delivery Mode</th>
                        <th>Payment</th>
                        <th>Prescription</th>
                        <th>Delivery Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => (
                        <tr key={order._id}>
                          <td style={{ fontWeight: '700', fontSize: '0.85rem' }}>#{order._id}</td>
                          <td>
                            <strong>{order.userName}</strong>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{order.userEmail}</div>
                          </td>
                          <td style={{ fontWeight: '600' }}>
                            ₹{order.totalPrice}
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              Charge: {order.deliveryCharge > 0 ? `₹${order.deliveryCharge}` : 'Free'}
                            </div>
                          </td>
                          <td style={{ fontSize: '0.85rem' }}>{order.deliveryType || 'Local'}</td>
                          <td style={{ fontSize: '0.85rem' }}>{order.paymentMethod}</td>
                          <td>
                            {order.prescription ? (
                              <a href={order.prescription} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', textDecoration: 'underline', fontSize: '0.8rem' }}>
                                View File 📎
                              </a>
                            ) : (
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>None</span>
                            )}
                          </td>
                          <td>
                            <select
                              className="form-control form-select"
                              style={{ width: '150px', padding: '0.4rem 2rem 0.4rem 0.75rem', fontSize: '0.85rem', borderRadius: '8px' }}
                              value={order.deliveryStatus}
                              onChange={(e) => handleStatusChange(order._id, e.target.value)}
                            >
                              <option value="Placed">Placed</option>
                              <option value="Confirmed">Confirmed</option>
                              <option value="Packed">Packed</option>
                              <option value="Out For Delivery">Out For Delivery</option>
                              <option value="Delivered">Delivered</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: INVENTORY MANAGEMENT */}
          {activeTab === 'inventory' && (
            <div className="glass-panel">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3>Store Inventory Panel</h3>
                <button className="btn btn-primary btn-sm" onClick={handleOpenAddModal}>
                  + Add Medicine
                </button>
              </div>

              {medicines.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>No medicines found in inventory. Seed the DB or add one above.</p>
              ) : (
                <div className="data-table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Category</th>
                        <th>Price</th>
                        <th>Discount%</th>
                        <th>Stock</th>
                        <th>Prescription</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {medicines.map((med) => (
                        <tr key={med._id}>
                          <td style={{ fontWeight: '600' }}>{med.name}</td>
                          <td>{med.category}</td>
                          <td>₹{med.price}</td>
                          <td>
                            {med.discount > 0 ? (
                              <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>{med.discount}% OFF</span>
                            ) : (
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>—</span>
                            )}
                          </td>
                          <td>
                            <span style={{ color: med.stock <= 0 ? 'var(--color-danger)' : med.stock < 15 ? 'var(--color-warning)' : 'inherit' }}>
                              {med.stock} units
                            </span>
                          </td>
                          <td>
                            {med.needsPrescription ? (
                              <span className="badge badge-warning" style={{ fontSize: '0.65rem' }}>Required</span>
                            ) : (
                              <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>No</span>
                            )}
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button className="btn btn-secondary btn-sm" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }} onClick={() => handleOpenEditModal(med)}>
                                ✏️ Edit
                              </button>
                              <button className="btn btn-danger btn-sm" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }} onClick={() => handleDeleteMedicine(med._id, med.name)}>
                                🗑️ Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* STORE SETTINGS TAB DISPLAY */}
      {activeTab === 'settings' && (
        <div className="glass-panel" style={{ maxWidth: '560px', margin: '0 auto' }}>
          <h3 style={{ marginBottom: '0.5rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.5rem' }}>⚙️ Store Configurations</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '1.5rem' }}>
            The <strong>Global Discount</strong> is a fallback applied to products that don't have their own per-product discount set.
            To set a discount for a specific product, go to <strong>Manage Inventory</strong> → Edit that medicine.
          </p>
          <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Global / Fallback Discount (%)</label>
              <input
                type="number"
                className="form-control"
                placeholder="e.g. 15"
                value={discountPercentage}
                onChange={(e) => setDiscountPercentage(e.target.value)}
                min="0"
                max="100"
                required
              />
              <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: '0.25rem' }}>
                Applied to products with no individual discount. 0 = no discount.
              </small>
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
              💾 Save Global Discount
            </button>
          </form>
        </div>
      )}

      {/* ADD / EDIT MEDICINE POPUP MODAL */}
      {showMedModal && (
        <div className="processing-overlay" style={{ background: 'rgba(5, 10, 25, 0.95)' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '550px', background: 'var(--bg-secondary)', position: 'relative' }}>
            <button
              onClick={() => setShowMedModal(false)}
              style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}
            >
              ✕
            </button>
            <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.5rem' }}>
              {editMed ? `Edit Medicine Details: ${editMed.name}` : 'Add New Medicine to Stock'}
            </h3>

            <form onSubmit={handleSaveMedicine} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Medicine Name</label>
                <input
                  type="text"
                  name="name"
                  className="form-control"
                  placeholder="e.g. Paracetamol 650mg"
                  value={medForm.name}
                  onChange={handleMedFormChange}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '1rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Category</label>
                  <select
                    name="category"
                    className="form-control form-select"
                    value={medForm.category}
                    onChange={handleMedFormChange}
                  >
                    <option value="Tablet">Tablet</option>
                    <option value="Syrup">Syrup</option>
                    <option value="Injection">Injection</option>
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Prescription Req.</label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', height: '42px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      name="needsPrescription"
                      checked={medForm.needsPrescription}
                      onChange={handleMedFormChange}
                    />
                    <span>Yes, require file</span>
                  </label>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Price (INR)</label>
                  <input
                    type="number"
                    name="price"
                    className="form-control"
                    placeholder="e.g. 50"
                    value={medForm.price}
                    onChange={handleMedFormChange}
                    min="1"
                    required
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Discount (%)</label>
                  <input
                    type="number"
                    name="discount"
                    className="form-control"
                    placeholder="0–100"
                    value={medForm.discount}
                    onChange={handleMedFormChange}
                    min="0"
                    max="100"
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Stock Quantity</label>
                  <input
                    type="number"
                    name="stock"
                    className="form-control"
                    placeholder="e.g. 100"
                    value={medForm.stock}
                    onChange={handleMedFormChange}
                    min="0"
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '1rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Manufacturer</label>
                  <input
                    type="text"
                    name="manufacturer"
                    className="form-control"
                    placeholder="e.g. Cipla Ltd"
                    value={medForm.manufacturer}
                    onChange={handleMedFormChange}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Dosage Recommendation</label>
                  <input
                    type="text"
                    name="dosage"
                    className="form-control"
                    placeholder="e.g. 1 daily"
                    value={medForm.dosage}
                    onChange={handleMedFormChange}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Product Description</label>
                <textarea
                  name="description"
                  className="form-control"
                  placeholder="Write clinical details, usages, warnings..."
                  value={medForm.description}
                  onChange={handleMedFormChange}
                  rows="3"
                ></textarea>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flexGrow: 1 }}>
                  Save Medicine Details
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowMedModal(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
