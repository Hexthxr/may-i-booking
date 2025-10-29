import { useState } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Register(){
  const [username, setU] = useState('');
  const [email, setE] = useState('');
  const [password, setPW] = useState('');
  const [adminCode, setAC] = useState('');
  const [err, setErr] = useState('');
  const { login } = useAuth();
  const nav = useNavigate();

  const onSubmit = async (e)=>{
    e.preventDefault();
    setErr('');
    try {
      const res = await api.post('/auth/register', { username, email, password, adminCode: adminCode || undefined });
      login(res.data);
      nav('/');
    } catch (e) {
      setErr(e?.response?.data?.message || 'Register failed');
    }
  };

  return (
    <div className="container" style={{maxWidth:480,margin:'32px auto'}}>
      <h2>สมัครสมาชิก</h2>
      <form onSubmit={onSubmit} className="card" style={{padding:16}}>
        {err && <div className="badge" style={{background:'#ffe5e5'}}>⚠️ {err}</div>}
        <label>ชื่อผู้ใช้
          <input value={username} onChange={e=>setU(e.target.value)} required style={{width:'100%',padding:10,marginTop:6}}/>
        </label>
        <label style={{marginTop:10}}>อีเมล
          <input type="email" value={email} onChange={e=>setE(e.target.value)} required style={{width:'100%',padding:10,marginTop:6}}/>
        </label>
        <label style={{marginTop:10}}>รหัสผ่าน
          <input type="password" value={password} onChange={e=>setPW(e.target.value)} required style={{width:'100%',padding:10,marginTop:6}}/>
        </label>
        <details style={{marginTop:10}}>
          <summary>ฉันเป็นแอดมิน (ใส่โค้ด)</summary>
          <input value={adminCode} onChange={e=>setAC(e.target.value)} placeholder="ADMIN_SIGNUP_CODE" style={{width:'100%',padding:10,marginTop:6}}/>
        </details>
        <button className="btn" style={{marginTop:12}}>สมัครสมาชิก</button>
      </form>
    </div>
  )
}