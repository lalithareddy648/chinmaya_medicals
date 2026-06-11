import React, { createContext, useState, useEffect } from 'react';
import api from '../api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [loading, setLoading] = useState(true);

  // Sync token into localStorage whenever it changes
  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }, [token]);

  // Load profile if token is available
  useEffect(() => {
    const loadProfile = async () => {
      if (token) {
        try {
          const res = await api.get('/api/auth/profile');
          setUser(res.data);
        } catch (error) {
          console.error('Session expired or invalid:', error);
          logout();
        }
      }
      setLoading(false);
    };
    loadProfile();
  }, [token]);

  const login = async (email, password) => {
    const res = await api.post('/api/auth/login', { email, password });
    setUser({
      _id: res.data._id,
      name: res.data.name,
      email: res.data.email,
      isAdmin: res.data.isAdmin
    });
    setToken(res.data.token);
    return res.data;
  };

  const register = async (name, email, password) => {
    const res = await api.post('/api/auth/register', { name, email, password });
    setUser({
      _id: res.data._id,
      name: res.data.name,
      email: res.data.email,
      isAdmin: res.data.isAdmin
    });
    setToken(res.data.token);
    return res.data;
  };

  const logout = () => {
    setUser(null);
    setToken('');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
