import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
});

// Attach token on every request
api.interceptors.request.use(config => {
  const stored = JSON.parse(localStorage.getItem('dydxdt-auth') || '{}');
  const token = stored?.state?.token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('dydxdt-auth');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
