import axios from 'axios';

// Use VITE_API_URL env variable for production (Vercel),
// fallback to empty string so Vite's proxy handles it in development.
const API_BASE = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: API_BASE,
});

// Attach auth token to every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

export default api;
