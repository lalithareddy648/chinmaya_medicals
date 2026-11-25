import { useContext, useState, useEffect, useCallback } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import {
  FiHome,
  FiShoppingCart,
  FiPackage,
  FiActivity,
  FiShield,
  FiLogIn,
  FiUserPlus,
  FiLogOut,
  FiDownload
} from 'react-icons/fi';
import api from '../api';
import { AuthContext } from '../context/AuthContext';

const getInitialInstalledState = () =>
  Capacitor.isNativePlatform() ||
  window.matchMedia('(display-mode: standalone)').matches ||
  window.navigator.standalone === true;

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const [cartCount, setCartCount] = useState(0);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(getInitialInstalledState);
  const navigate = useNavigate();

  const fetchCartCount = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.get('/api/cart');
      const count = res.data.items.reduce((sum, item) => sum + item.quantity, 0);
      setCartCount(count);
    } catch (err) {
      console.error('Error fetching cart count:', err);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    let active = true;

    api.get('/api/cart')
      .then((res) => {
        if (!active) return;
        const count = res.data.items.reduce((sum, item) => sum + item.quantity, 0);
        setCartCount(count);
      })
      .catch((err) => {
        console.error('Error fetching cart count:', err);
      });

    const handleCartUpdate = () => {
      fetchCartCount();
    };

    window.addEventListener('cart-updated', handleCartUpdate);
    return () => {
      active = false;
      window.removeEventListener('cart-updated', handleCartUpdate);
    };
  }, [user, fetchCartCount]);

  useEffect(() => {
    if (isInstalled) return;

    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    const handleAppInstalled = () => {
      setInstallPrompt(null);
      setIsInstalled(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [isInstalled]);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstallPrompt(null);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const displayedCartCount = user ? cartCount : 0;

  return (
    <>
      <nav className="navbar">
        <Link to="/" className="navbar-brand">
          <span className="gradient-text">🏥 Chinmaya Medicals</span>
        </Link>

        {/* Desktop Nav */}
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
                  Cart {displayedCartCount > 0 && <span className="badge badge-info" style={{ marginLeft: '5px' }}>{displayedCartCount}</span>}
                </NavLink>
              </li>
              <li>
                <NavLink to="/my-orders" className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}>
                  My Orders
                </NavLink>
              </li>
              <li>
                <NavLink to="/health-dashboard" className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}>
                  Health Dashboard
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
          {!isInstalled && installPrompt && (
            <li>
              <button onClick={handleInstallClick} className="btn btn-primary btn-sm" title="Install Chinmaya Medicals App">
                <FiDownload /> Install App
              </button>
            </li>
          )}
        </ul>

        {/* Mobile Top Actions */}
        <div className="mobile-top-actions">
          {!isInstalled && installPrompt && (
            <button onClick={handleInstallClick} className="btn btn-primary btn-sm" aria-label="Install App">
              <FiDownload /> Install
            </button>
          )}
          {user && (
            <button onClick={handleLogout} className="btn btn-secondary btn-sm" aria-label="Logout">
              <FiLogOut />
            </button>
          )}
        </div>
      </nav>

      {/* Mobile Bottom Tab Bar */}
      <nav className="mobile-bottom-nav" aria-label="Mobile Navigation">
        <NavLink to="/" className={({ isActive }) => `mobile-tab-item ${isActive ? 'active' : ''}`} end>
          <FiHome className="mobile-tab-icon" />
          <span>Home</span>
        </NavLink>

        {user ? (
          <>
            <NavLink to="/cart" className={({ isActive }) => `mobile-tab-item ${isActive ? 'active' : ''}`}>
              <div className="mobile-tab-icon-wrap">
                <FiShoppingCart className="mobile-tab-icon" />
                {displayedCartCount > 0 && <span className="mobile-tab-badge">{displayedCartCount}</span>}
              </div>
              <span>Cart</span>
            </NavLink>
            <NavLink to="/my-orders" className={({ isActive }) => `mobile-tab-item ${isActive ? 'active' : ''}`}>
              <FiPackage className="mobile-tab-icon" />
              <span>Orders</span>
            </NavLink>
            <NavLink to="/health-dashboard" className={({ isActive }) => `mobile-tab-item ${isActive ? 'active' : ''}`}>
              <FiActivity className="mobile-tab-icon" />
              <span>Health</span>
            </NavLink>
            {user.isAdmin && (
              <NavLink to="/admin" className={({ isActive }) => `mobile-tab-item ${isActive ? 'active' : ''}`}>
                <FiShield className="mobile-tab-icon" />
                <span>Admin</span>
              </NavLink>
            )}
          </>
        ) : (
          <>
            <NavLink to="/login" className={({ isActive }) => `mobile-tab-item ${isActive ? 'active' : ''}`}>
              <FiLogIn className="mobile-tab-icon" />
              <span>Login</span>
            </NavLink>
            <NavLink to="/register" className={({ isActive }) => `mobile-tab-item ${isActive ? 'active' : ''}`}>
              <FiUserPlus className="mobile-tab-icon" />
              <span>Register</span>
            </NavLink>
          </>
        )}
      </nav>
    </>
  );
};

export default Navbar;
