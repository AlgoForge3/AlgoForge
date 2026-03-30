import axios from 'axios';
import { useUserStore } from '../store/useUserStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api', // Use env var for production
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
