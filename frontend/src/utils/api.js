import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);
const BACKEND_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || '';
if (BACKEND_URL) {
  setInterval(() => {
    fetch(`${BACKEND_URL}/api/health`).catch(() => {});
  }, 10 * 60 * 1000);
}

export default api;
