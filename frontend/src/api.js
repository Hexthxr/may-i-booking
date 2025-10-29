
// import axios from 'axios';

// const api = axios.create({
//   baseURL: import.meta.env.VITE_API_BASE || 'http://localhost:4000/api'
// });

// // Inject token if available
// api.interceptors.request.use((config) => {
//   const token = localStorage.getItem('token');
//   if (token) config.headers.Authorization = `Bearer ${token}`;
//   return config;
// });

// export default api;

// // คืน URL ฐานของ backend (ตัด /api ออก)
// export function fileBase() {
//   const apiBase = (import.meta.env.VITE_API_BASE || 'http://localhost:4000/api').replace(/\/+$/,'');
//   return apiBase.replace(/\/api\/?$/,'');
// }

// frontend/src/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || 'http://localhost:4000/api'
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;

// คืน base URL ของ API เช่น http://localhost:4000/api
export function apiBase() {
  return (import.meta.env.VITE_API_BASE || 'http://localhost:4000/api').replace(/\/+$/,'');
}
