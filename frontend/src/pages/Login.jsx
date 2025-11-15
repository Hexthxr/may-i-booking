// frontend/src/pages/Login.jsx
import { useState } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { syncLocalToServerAndClear } from '../utils/cart';

export default function Login() {
  const [usernameOrEmail, setUE] = useState('');
  const [password, setPW] = useState('');
  const [err, setErr] = useState('');
  const { login } = useAuth();
  const nav = useNavigate();
  const location = useLocation();

  // อนุญาตเฉพาะ path ภายในเว็บ และไม่ให้ redirect ไปหน้า admin
  const safeInternalPath = (p) => {
    if (!p) return null;
    // ต้องขึ้นต้นด้วย '/' แต่ไม่ใช่ '//' หรือ URL ภายนอก
    if (!/^\/(?!\/)/.test(p)) return null;
    // ถ้าเป็นหน้า admin ให้กลับหน้าแรกแทน
    if (p.startsWith('/admin')) return '/';
    return p;
  };

  // อ่าน next จาก state หรือจาก query string (?next=/xxx)
  const getNextPath = () => {
    const stateNext = location.state?.next;
    if (typeof stateNext === 'string') {
      return safeInternalPath(stateNext) || '/';
    }

    const sp = new URLSearchParams(location.search);
    const qNext = sp.get('next');
    return safeInternalPath(qNext) || '/';
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr('');
    try {
      const res = await api.post('/auth/login', { usernameOrEmail, password });
      login(res.data); // เก็บ token / user ใน context
      await syncLocalToServerAndClear();

      // ถ้า next เป็นหน้า admin จะถูกเปลี่ยนให้เป็น '/'
      const next = getNextPath();
      nav(next, { replace: true });
    } catch (e) {
      setErr(e?.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #e8f5e9, #f1f8e9)',
        padding: '16px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          background: '#fff',
          borderRadius: '16px',
          boxShadow: '0 8px 20px rgba(0,0,0,0.1)',
          padding: '32px',
        }}
      >
        <h2 style={{ textAlign: 'center', color: '#2e7d32', marginBottom: '8px' }}>
          เข้าสู่ระบบ
        </h2>
        <p style={{ textAlign: 'center', color: '#666', marginBottom: '24px' }}>
          May i Booking Studio
        </p>

        {err && (
          <div
            style={{
              background: '#ffe5e5',
              color: '#b71c1c',
              padding: '10px',
              borderRadius: '8px',
              marginBottom: '16px',
              fontSize: '14px',
            }}
          >
            ⚠️ {err}
          </div>
        )}

        <form onSubmit={onSubmit}>
          <label style={{ display: 'block', marginBottom: '12px' }}>
            <span style={{ fontSize: '14px', color: '#444' }}>อีเมลหรือชื่อผู้ใช้</span>
            <input
              type="text"
              value={usernameOrEmail}
              onChange={(e) => setUE(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #ccc',
                marginTop: '4px',
              }}
            />
          </label>

          <label style={{ display: 'block', marginBottom: '16px' }}>
            <span style={{ fontSize: '14px', color: '#444' }}>รหัสผ่าน</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPW(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #ccc',
                marginTop: '4px',
              }}
            />
          </label>

          <button
            type="submit"
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '999px',
              border: 'none',
              background: '#2e7d32',
              color: '#fff',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            เข้าสู่ระบบ
          </button>
        </form>

        <p
          style={{
            marginTop: '20px',
            textAlign: 'center',
            fontSize: '14px',
            color: '#666',
          }}
        >
          ยังไม่มีบัญชี?{' '}
          <a href="/register" style={{ color: '#2e7d32', textDecoration: 'none' }}>
            สมัครสมาชิก
          </a>
        </p>
      </div>
    </div>
  );
}
