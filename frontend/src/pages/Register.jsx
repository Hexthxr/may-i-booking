// frontend/src/pages/Register.jsx
import { useState } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

export default function Register() {
  const [username, setU] = useState('');
  const [email, setE] = useState('');
  const [password, setPW] = useState('');
  const [adminCode, setAC] = useState('');
  const [err, setErr] = useState('');
  const { login } = useAuth();
  const nav = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr('');
    try {
      const res = await api.post('/auth/register', {
        username,
        email,
        password,
        adminCode: adminCode || undefined,
      });
      login(res.data);
      nav('/');
    } catch (e) {
      setErr(e?.response?.data?.message || 'Register failed');
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
        {/* Panel ซ้าย: แบรนด์ / แนะนำระบบ (เหมือนหน้า Login ให้โทนเดียวกัน) */}
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
              สมัครสมาชิกใหม่ พร้อมรับประสบการณ์อ่านหนังสือที่ดีกว่า
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
              สร้างบัญชีของคุณเพื่อบันทึกรายการโปรด ตรวจสอบคำสั่งซื้อ
              และจัดการที่อยู่จัดส่งได้อย่างสะดวกสบายในที่เดียว 📚
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
              <div style={{ fontWeight: 600 }}>🎯 แนะนำตามความสนใจ</div>
              <div>เลือกหมวดที่คุณชอบ ระบบช่วยให้ค้นหาเล่มต่อไปง่ายขึ้น</div>
            </div>
            <div
              style={{
                padding: '10px 12px',
                borderRadius: '16px',
                background: 'rgba(255,255,255,0.14)',
              }}
            >
              <div style={{ fontWeight: 600 }}>🧾 ประวัติการสั่งซื้อ</div>
              <div>เก็บประวัติออเดอร์ทั้งหมดไว้ในบัญชีเดียว</div>
            </div>
            <div
              style={{
                padding: '10px 12px',
                borderRadius: '16px',
                background: 'rgba(255,255,255,0.14)',
              }}
            >
              <div style={{ fontWeight: 600 }}>🔐 บัญชีปลอดภัย</div>
              <div>จัดการข้อมูลของคุณอย่างเป็นส่วนตัวและปลอดภัย</div>
            </div>
          </div>
        </div>

        {/* Panel ขวา: ฟอร์มสมัครสมาชิก */}
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
                ✨
              </div>
              <h2
                style={{
                  color: '#1b5e20',
                  marginBottom: '4px',
                  fontSize: '22px',
                }}
              >
                สมัครสมาชิกใหม่
              </h2>
              <p style={{ color: '#666', fontSize: '13px' }}>
                กรอกข้อมูลด้านล่างเพื่อสร้างบัญชี May i Booking ของคุณ
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
              {/* Username */}
              <div style={{ marginBottom: '12px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    color: '#555',
                    marginBottom: '4px',
                    fontWeight: 500,
                  }}
                >
                  ชื่อผู้ใช้
                </label>
                <input
                  value={username}
                  onChange={(e) => setU(e.target.value)}
                  required
                  placeholder="Username"
                  style={{
                    width: '100%',
                    padding: '11px 12px',
                    marginTop: '2px',
                    borderRadius: '10px',
                    border: '1px solid #cfd8dc',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    backgroundColor: '#fafafa',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#2e7d32')}
                  onBlur={(e) => (e.target.style.borderColor = '#cfd8dc')}
                />
              </div>

              {/* Email */}
              <div style={{ marginBottom: '12px' }}>
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
                  type="email"
                  value={email}
                  onChange={(e) => setE(e.target.value)}
                  required
                  placeholder="your@email.com"
                  style={{
                    width: '100%',
                    padding: '11px 12px',
                    marginTop: '2px',
                    borderRadius: '10px',
                    border: '1px solid #cfd8dc',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    backgroundColor: '#fafafa',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#2e7d32')}
                  onBlur={(e) => (e.target.style.borderColor = '#cfd8dc')}
                />
              </div>

              {/* Password */}
              <div style={{ marginBottom: '8px' }}>
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
                  placeholder="อย่างน้อย 6 ตัวอักษร"
                  style={{
                    width: '100%',
                    padding: '11px 12px',
                    marginTop: '2px',
                    borderRadius: '10px',
                    border: '1px solid #cfd8dc',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    backgroundColor: '#fafafa',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#2e7d32')}
                  onBlur={(e) => (e.target.style.borderColor = '#cfd8dc')}
                />
                <div
                  style={{
                    marginTop: '4px',
                    fontSize: '11px',
                    color: '#999',
                  }}
                >
                  แนะนำให้ใช้ตัวอักษร ผสมตัวเลข และสัญลักษณ์เพื่อความปลอดภัย
                </div>
              </div>

              {/* Admin code */}
              <details style={{ marginBottom: '14px', fontSize: '13px' }}>
                <summary
                  style={{
                    cursor: 'pointer',
                    color: '#2e7d32',
                    userSelect: 'none',
                  }}
                >
                  ฉันเป็นแอดมิน (ใส่โค้ด)
                </summary>
                <input
                  value={adminCode}
                  onChange={(e) => setAC(e.target.value)}
                  placeholder="ADMIN_SIGNUP_CODE"
                  style={{
                    width: '100%',
                    padding: '11px 12px',
                    marginTop: '8px',
                    borderRadius: '10px',
                    border: '1px solid #cfd8dc',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    backgroundColor: '#fafafa',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#2e7d32')}
                  onBlur={(e) => (e.target.style.borderColor = '#cfd8dc')}
                />
              </details>

              {/* Submit button */}
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
                สมัครสมาชิก
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
              มีบัญชีแล้ว?{' '}
              <Link
                to="/login"
                style={{
                  color: '#2e7d32',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                เข้าสู่ระบบ
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
              การสมัครสมาชิกหมายถึงคุณยอมรับ{' '}
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
