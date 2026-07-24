import axios from 'axios';
import store from '../stores';
import { logout } from '../stores/authSlice';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

function getLoginPath() {
  return window.papertechDesktop ? '#/login' : '/login';
}

api.interceptors.request.use(config => {
  const state = store.getState();
  const token = state.auth.token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      store.dispatch(logout());
      const currentPath = window.papertechDesktop ? window.location.hash : window.location.pathname;
      if (!String(currentPath).includes('/login')) {
        window.location.replace(getLoginPath());
      }
    }
    return Promise.reject(error);
  }
);

export default api;
