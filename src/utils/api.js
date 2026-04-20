import axios from 'axios';
import { useUserStore } from '../store/useUserStore';

// In production (Vercel), use relative /api — Vercel proxies it to the backend via vercel.json rewrites.
// In local dev, use http://localhost:5000/api directly.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api'),
});

// Add a request interceptor to inject the token
api.interceptors.request.use(
  (config) => {
    // Read token directly from Zustand store
    const token = useUserStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
