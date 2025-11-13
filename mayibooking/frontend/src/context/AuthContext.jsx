// frontend/src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api';

const AuthContext = createContext(null);
export function useAuth(){ return useContext(AuthContext); }

export function AuthProvider({ children }){
  const [user, setUser]   = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || '');

  // 1) โหลดจาก localStorage (เร็ว)
  useEffect(()=>{
    if (!token) { setUser(null); return; }
    try {
      const raw = localStorage.getItem('user');
      if (raw) setUser(JSON.parse(raw));
    } catch {}
  }, [token]);

  // 2) รีเฟรชจาก DB (จริง/ล่าสุด)
  useEffect(()=>{
    if (!token) return;
    (async ()=>{
      try {
        const { data } = await api.get('/users/me');   // ← ดึงจาก DB
        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user)); // sync cache
      } catch {
        // token ใช้ไม่ได้ → ล้างสถานะ
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken('');
        setUser(null);
      }
    })();
  }, [token]);

  const login = (payload)=>{
    localStorage.setItem('token', payload.token);
    localStorage.setItem('user', JSON.stringify(payload.user));
    setToken(payload.token);
    setUser(payload.user);
  };

  const updateUser = (u)=>{
    setUser(u);
    try { localStorage.setItem('user', JSON.stringify(u)); } catch {}
  };

  const logout = ()=>{
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken('');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}
