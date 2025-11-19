// frontend/src/api.js
import axios from 'axios';

// -----------------------------------------------------------
// สร้าง base URL จาก env ถ้าไม่ตั้งค่า VITE_API_BASE
// จะ fallback เป็น http://localhost:4000/api ให้อัตโนมัติ
// -----------------------------------------------------------
const RAW_BASE =
  import.meta.env.VITE_API_BASE || 'http://localhost:4000/api';

// ตัด / ท้าย ๆ ออกกันพลาด
const NORMALIZED_BASE = RAW_BASE.replace(/\/+$/, '');

// instance หลักที่ทุกหน้าใช้เรียก API
const api = axios.create({
  baseURL: NORMALIZED_BASE,
});

// แนบ JWT token จาก localStorage อัตโนมัติ
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;

// helper คืน base URL (ไม่มี / ท้าย)
export function apiBase() {
  return NORMALIZED_BASE;
}
