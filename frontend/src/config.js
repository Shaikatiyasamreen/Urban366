const defaultApiUrl = window.location.hostname === 'localhost'
  ? 'http://localhost:8000'
  : 'https://urban366.onrender.com';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || defaultApiUrl;
export const API_BASE = `${API_BASE_URL}/api`;
