// import { useState } from 'react';
// import api from '../api';
// import { useAuth } from '../context/AuthContext';
// import { useNavigate } from 'react-router-dom';

// export default function Register(){
//   const [username, setU] = useState('');
//   const [email, setE] = useState('');
//   const [password, setPW] = useState('');
//   const [adminCode, setAC] = useState('');
//   const [err, setErr] = useState('');
//   const { login } = useAuth();
//   const nav = useNavigate();

//   const onSubmit = async (e)=>{
//     e.preventDefault();
//     setErr('');
//     try {
//       const res = await api.post('/auth/register', { username, email, password, adminCode: adminCode || undefined });
//       login(res.data);
//       nav('/');
//     } catch (e) {
//       setErr(e?.response?.data?.message || 'Register failed');
//     }
//   };

//   return (
//     <div className="container" style={{maxWidth:480,margin:'32px auto'}}>
//       <h2>สมัครสมาชิก</h2>
//       <form onSubmit={onSubmit} className="card" style={{padding:16}}>
//         {err && <div className="badge" style={{background:'#ffe5e5'}}>⚠️ {err}</div>}
//         <label>ชื่อผู้ใช้
//           <input value={username} onChange={e=>setU(e.target.value)} required style={{width:'100%',padding:10,marginTop:6}}/>
//         </label>
//         <label style={{marginTop:10}}>อีเมล
//           <input type="email" value={email} onChange={e=>setE(e.target.value)} required style={{width:'100%',padding:10,marginTop:6}}/>
//         </label>
//         <label style={{marginTop:10}}>รหัสผ่าน
//           <input type="password" value={password} onChange={e=>setPW(e.target.value)} required style={{width:'100%',padding:10,marginTop:6}}/>
//         </label>
//         <details style={{marginTop:10}}>
//           <summary>ฉันเป็นแอดมิน (ใส่โค้ด)</summary>
//           <input value={adminCode} onChange={e=>setAC(e.target.value)} placeholder="ADMIN_SIGNUP_CODE" style={{width:'100%',padding:10,marginTop:6}}/>
//         </details>
//         <button className="btn" style={{marginTop:12}}>สมัครสมาชิก</button>
//       </form>
//     </div>
//   )
// }
import { useState } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

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
        background: 'linear-gradient(135deg, #d4fc79, #96e6a1)', // เขียว-เหลือง เหมือน login
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
        <h2
          style={{
            textAlign: 'center',
            color: '#2e7d32',
            marginBottom: '8px',
          }}
        >
          สมัครสมาชิก
        </h2>
        <p style={{ textAlign: 'center', color: '#666', marginBottom: '24px' }}>
          เข้าร่วม May i Booking Studio
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
            <span style={{ fontSize: '14px', color: '#444' }}>ชื่อผู้ใช้</span>
            <input
              value={username}
              onChange={(e) => setU(e.target.value)}
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
            <span style={{ fontSize: '14px', color: '#444' }}>อีเมล</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setE(e.target.value)}
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

          <details style={{ marginBottom: '12px' }}>
            <summary style={{ cursor: 'pointer', color: '#2e7d32' }}>
              ฉันเป็นแอดมิน (ใส่โค้ด)
            </summary>
            <input
              value={adminCode}
              onChange={(e) => setAC(e.target.value)}
              placeholder="ADMIN_SIGNUP_CODE"
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
          </details>

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
            }}
            onMouseOver={(e) => (e.target.style.background = '#1b5e20')}
            onMouseOut={(e) => (e.target.style.background = '#2e7d32')}
          >
            สมัครสมาชิก
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
          มีบัญชีแล้ว?{' '}
          <a href="/login" style={{ color: '#2e7d32', textDecoration: 'none' }}>
            เข้าสู่ระบบ
          </a>
        </p>
      </div>
    </div>
  );
}
