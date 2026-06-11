import React, { useContext, useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import api from '../api';
import { AuthContext } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const [cartCount, setCartCount] = useState(0);
  const navigate = useNavigate();

  const fetchCartCount = async () => {
    if (user) {
      try {
        const res = await api.get('/api/cart');
        const count = res.data.items.reduce((sum, item) => sum + item.quantity, 0);
        setCartCount(count);
      } catch (err) {
        console.error('Error fetching cart count:', err);
      }
    } else {
      setCartCount(0);
    }
  };

  useEffect(() => {
    fetchCartCount();

    const handleCartUpdate = () => {
      fetchCartCount();
    };

    window.addEventListener('cart-updated', handleCartUpdate);
    return () => {
      window.removeEventListener('cart-updated', handleCartUpdate);
    };
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        <span className="gradient-text">🏥 Chinmaya Medicals</span>
      </Link>

      <ul className="navbar-nav">
        <li>
          <NavLink to="/" className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`} end>
            Home
          </NavLink>
        </li>
        {user ? (
          <>
            <li>
              <NavLink to="/cart" className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}>
                Cart {cartCount > 0 && <span className="badge badge-info" style={{ marginLeft: '5px' }}>{cartCount}</span>}
              </NavLink>
            </li>
            <li>
              <NavLink to="/my-orders" className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}>
                My Orders
              </NavLink>
            </li>
            {user.isAdmin && (
              <li>
                <NavLink to="/admin" className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}>
                  Admin Panel
                </NavLink>
              </li>
            )}
            <li className="navbar-link" style={{ color: 'var(--color-primary)', fontWeight: '600' }}>
              Hi, {user.name.split(' ')[0]}!
            </li>
            <li>
              <button onClick={handleLogout} className="btn btn-secondary btn-sm">
                Logout
              </button>
            </li>
          </>
        ) : (
          <>
            <li>
              <NavLink to="/login" className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}>
                Login
              </NavLink>
            </li>
            <li>
              <NavLink to="/register" className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}>
                Register
              </NavLink>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
};

export default Navbar;
