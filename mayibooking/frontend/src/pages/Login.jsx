import { useState } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom'; // ⬅️ เพิ่ม useLocation
import { syncLocalToServerAndClear } from '../utils/cart';

export default function Login() {
  const [usernameOrEmail, setUE] = useState('');
  const [password, setPW] = useState('');
  const [err, setErr] = useState('');
  const { login } = useAuth();
  const nav = useNavigate();
  const location = useLocation(); // ⬅️ ใช้อ่าน next ที่ส่งมา

  // อ่าน next จาก state หรือจาก query string เป็น fallback
  const getNextPath = () => {
    const stateNext = location.state?.next;
    if (typeof stateNext === 'string') return safeInternalPath(stateNext);

    const sp = new URLSearchParams(location.search);
    const qNext = sp.get('next');
    return safeInternalPath(qNext) || '/';
  };

  // ป้องกัน open redirect: อนุญาตเฉพาะ path ภายในเว็บ (ขึ้นต้นด้วย '/')
  const safeInternalPath = (p) => (p && /^\/(?!\/)/.test(p) ? p : null);

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr('');
    try {
      const res = await api.post('/auth/login', { usernameOrEmail, password });
      login(res.data);  
      await syncLocalToServerAndClear();                     // เก็บ token/user ตามที่ context คุณทำไว้
      const next = getNextPath() || '/';     // ถ้าไม่มี next ให้กลับหน้า Home
      nav(next, { replace: true });          // ⬅️ เด้งไปหน้าที่ตั้งใจ (เช่น /checkout)
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
        background: 'linear-gradient(135deg, #d4fc79, #96e6a1)',
        padding: '20px',
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
                marginTop: '6px',
                border: '1px solid #ccc',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#2e7d32')}
              onBlur={(e) => (e.target.style.borderColor = '#ccc')}
            />
          </label>

          <label style={{ display: 'block', marginBottom: '12px' }}>
            <span style={{ fontSize: '14px', color: '#444' }}>รหัสผ่าน</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPW(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px',
                marginTop: '6px',
                border: '1px solid #ccc',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#2e7d32')}
              onBlur={(e) => (e.target.style.borderColor = '#ccc')}
            />
          </label>

          <button
            type="submit"
            style={{
              width: '100%',
              padding: '12px',
              background: '#2e7d32',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: '0.3s',
              marginTop: '8px',
            }}
            onMouseOver={(e) => (e.target.style.background = '#1b5e20')}
            onMouseOut={(e) => (e.target.style.background = '#2e7d32')}
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
