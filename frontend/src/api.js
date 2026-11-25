import axios from 'axios';

// Use VITE_API_URL env variable for production (Vercel) and Capacitor mobile builds,
// fallback to empty string so Vite's proxy handles it in local web development.
export const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

export const resolveAssetUrl = (url) => {
  if (!url) return url;
  if (/^(https?:|data:|blob:)/i.test(url)) return url;
  if (API_BASE && url.startsWith('/')) {
    return `${API_BASE}${url}`;
  }
  return url;
};

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
