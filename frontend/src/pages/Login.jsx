// frontend/src/pages/Login.jsx
import { useState } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';
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
    if (!/^\/(?!\/)/.test(p)) return null;
    if (p.startsWith('/admin')) return '/';
    return p;
  };

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
        padding: '24px',
        background:
          'radial-gradient(circle at top left, #c8e6c9 0, transparent 55%), radial-gradient(circle at bottom right, #fff9c4 0, transparent 55%), linear-gradient(135deg, #e8f5e9, #f9fbe7)',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '960px',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.1fr) minmax(0, 0.9fr)',
          gap: '24px',
          background: 'rgba(255,255,255,0.96)',
          borderRadius: '24px',
          boxShadow: '0 18px 45px rgba(0,0,0,0.12)',
          overflow: 'hidden',
          border: '1px solid rgba(46,125,50,0.08)',
        }}
      >
        {/* Panel ซ้าย: แบรนด์ + ภาพ mood */}
        <div
          style={{
            padding: '32px 32px 32px 32px',
            background:
              'linear-gradient(145deg, #2e7d32 0%, #66bb6a 50%, #aed581 100%)',
            color: '#fff',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 14px',
                borderRadius: '999px',
                background: 'rgba(255,255,255,0.12)',
                fontSize: '13px',
                fontWeight: 500,
              }}
            >
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '999px',
                  background: '#ffeb3b',
                  boxShadow: '0 0 10px rgba(255,235,59,0.9)',
                }}
              />
              พร้อมอ่านทุกเล่มที่คุณรัก
            </div>

            <h1
              style={{
                marginTop: '24px',
                fontSize: '28px',
                lineHeight: 1.25,
                fontWeight: 700,
              }}
            >
              May i Booking
              <br />
              <span style={{ fontWeight: 400 }}>Online Bookstore Studio</span>
            </h1>

            <p
              style={{
                marginTop: '16px',
                fontSize: '14px',
                lineHeight: 1.6,
                opacity: 0.95,
              }}
            >
              จัดการบัญชี การสั่งซื้อ รายการโปรด และที่อยู่จัดส่งได้ในที่เดียว
              เข้าสู่ระบบเพื่อเริ่มต้นการอ่านเล่มถัดไปของคุณ ✨
            </p>
          </div>

          <div
            style={{
              marginTop: '32px',
              display: 'grid',
              gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
              gap: '10px',
              fontSize: '11px',
              opacity: 0.9,
            }}
          >
            <div
              style={{
                padding: '10px 12px',
                borderRadius: '16px',
                background: 'rgba(255,255,255,0.14)',
              }}
            >
              <div style={{ fontWeight: 600 }}>📚 หมวดหมู่เยอะ</div>
              <div>การเรียน, นิยาย, มังงะ, การลงทุน และอีกมากมาย</div>
            </div>
            <div
              style={{
                padding: '10px 12px',
                borderRadius: '16px',
                background: 'rgba(255,255,255,0.14)',
              }}
            >
              <div style={{ fontWeight: 600 }}>🧾 ติดตามออเดอร์</div>
              <div>ดูสถานะการสั่งซื้อและประวัติย้อนหลังได้ทันที</div>
            </div>
            <div
              style={{
                padding: '10px 12px',
                borderRadius: '16px',
                background: 'rgba(255,255,255,0.14)',
              }}
            >
              <div style={{ fontWeight: 600 }}>⭐ รีวิวหนังสือ</div>
              <div>ให้คะแนนและเขียนรีวิวเล่มโปรดได้</div>
            </div>
          </div>
        </div>

        {/* Panel ขวา: ฟอร์ม Login */}
        <div
          style={{
            padding: '32px 32px 32px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div style={{ width: '100%', maxWidth: '420px' }}>
            <div style={{ marginBottom: '24px', textAlign: 'center' }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '18px',
                  margin: '0 auto 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background:
                    'radial-gradient(circle at 30% 20%, #fff9c4 0, #ffeb3b 30%, #fbc02d 100%)',
                  boxShadow: '0 10px 25px rgba(251,192,45,0.55)',
                  fontSize: '26px',
                }}
              >
                📖
              </div>
              <h2
                style={{
                  color: '#1b5e20',
                  marginBottom: '4px',
                  fontSize: '22px',
                }}
              >
                เข้าสู่ระบบบัญชีของคุณ
              </h2>
              <p style={{ color: '#666', fontSize: '13px' }}>
                ใช้อีเมลหรือชื่อผู้ใช้ที่คุณสมัครไว้กับระบบ
              </p>
            </div>

            {err && (
              <div
                style={{
                  background: '#ffebee',
                  color: '#c62828',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  marginBottom: '16px',
                  fontSize: '13px',
                  border: '1px solid #ffcdd2',
                }}
              >
                ⚠️ {err}
              </div>
            )}

            <form onSubmit={onSubmit}>
              <div style={{ marginBottom: '14px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    color: '#555',
                    marginBottom: '4px',
                    fontWeight: 500,
                  }}
                >
                  อีเมลหรือชื่อผู้ใช้
                </label>
                <input
                  type="text"
                  value={usernameOrEmail}
                  onChange={(e) => setUE(e.target.value)}
                  required
                  placeholder="Username or Email"
                  style={{
                    width: '100%',
                    padding: '11px 12px',
                    borderRadius: '10px',
                    border: '1px solid #cfd8dc',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    backgroundColor: '#fafafa',
                  }}
                />
              </div>

              <div style={{ marginBottom: '10px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    color: '#555',
                    marginBottom: '4px',
                    fontWeight: 500,
                  }}
                >
                  รหัสผ่าน
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPW(e.target.value)}
                  required
                  placeholder="กรอกรหัสผ่านของคุณ"
                  style={{
                    width: '100%',
                    padding: '11px 12px',
                    borderRadius: '10px',
                    border: '1px solid #cfd8dc',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    backgroundColor: '#fafafa',
                  }}
                />
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  marginBottom: '18px',
                  fontSize: '12px',
                }}
              >
                <span style={{ color: '#999' }}>ลืมรหัสผ่าน?</span>
              </div>

              <button
                type="submit"
                style={{
                  width: '100%',
                  padding: '13px',
                  borderRadius: '999px',
                  border: 'none',
                  background:
                    'linear-gradient(135deg, #43a047 0%, #2e7d32 60%, #1b5e20 100%)',
                  color: '#fff',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 10px 20px rgba(46,125,50,0.35)',
                  transform: 'translateY(0)',
                  transition: 'box-shadow 0.2s ease, transform 0.2s ease',
                }}
                onMouseDown={(e) => {
                  e.currentTarget.style.transform = 'translateY(1px)';
                  e.currentTarget.style.boxShadow =
                    '0 4px 10px rgba(46,125,50,0.3)';
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow =
                    '0 10px 20px rgba(46,125,50,0.35)';
                }}
              >
                เข้าสู่ระบบ
              </button>
            </form>

            <p
              style={{
                marginTop: '18px',
                textAlign: 'center',
                fontSize: '13px',
                color: '#777',
              }}
            >
              ยังไม่มีบัญชี?{' '}
              <Link
                to="/register"
                style={{
                  color: '#2e7d32',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                สมัครสมาชิก
              </Link>
            </p>

            <p
              style={{
                marginTop: '8px',
                textAlign: 'center',
                fontSize: '11px',
                color: '#aaa',
              }}
            >
              เข้าสู่ระบบของคุณหมายถึงคุณยอมรับ{' '}
              <span style={{ textDecoration: 'underline' }}>
                ข้อกำหนดการใช้งาน
              </span>{' '}
              และ{' '}
              <span style={{ textDecoration: 'underline' }}>
                นโยบายความเป็นส่วนตัว
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
