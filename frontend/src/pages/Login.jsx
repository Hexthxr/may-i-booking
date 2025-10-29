import { useState } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Login(){
  const [usernameOrEmail, setUE] = useState('');
  const [password, setPW] = useState('');
  const [err, setErr] = useState('');
  const { login } = useAuth();
  const nav = useNavigate();

  const onSubmit = async (e)=>{
    e.preventDefault();
    setErr('');
    try {
      const res = await api.post('/auth/login', { usernameOrEmail, password });
      login(res.data);
      nav('/');
    } catch (e) {
      setErr(e?.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="container" style={{maxWidth:480,margin:'32px auto'}}>
      <h2>เข้าสู่ระบบ</h2>
      <form onSubmit={onSubmit} className="card" style={{padding:16}}>
        {err && <div className="badge" style={{background:'#ffe5e5'}}>⚠️ {err}</div>}
        <label>อีเมลหรือชื่อผู้ใช้
          <input value={usernameOrEmail} onChange={e=>setUE(e.target.value)} required style={{width:'100%',padding:10,marginTop:6}}/>
        </label>
        <label style={{marginTop:10}}>รหัสผ่าน
          <input type="password" value={password} onChange={e=>setPW(e.target.value)} required style={{width:'100%',padding:10,marginTop:6}}/>
        </label>
        <button className="btn" style={{marginTop:12}}>เข้าสู่ระบบ</button>
      </form>
    </div>
  )
}