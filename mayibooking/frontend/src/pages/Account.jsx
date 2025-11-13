// frontend/src/pages/Account.jsx
import { useEffect, useRef, useState } from 'react';
import api from '../api';
import styles from '../styles/profile.module.css';
import { useAuth } from '../context/AuthContext';

export default function Account(){
  const { updateUser } = useAuth();          // ⬅️ ใช้ context
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({ fullname:'', email:'' });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [ts, setTs] = useState(Date.now());
  const fileRef = useRef(null);

  const load = async ()=>{
    const { data } = await api.get('/users/me');
    setUser(data.user);
    setForm({ fullname: data.user.fullname || '', email: data.user.email || '' });
  };

  const loadAvatar = async ()=>{
    try{
      const res = await api.get('/users/me/avatar', { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      setAvatarUrl(url);
    }catch{ setAvatarUrl(null); }
  };

  useEffect(()=>{ load(); },[]);
  useEffect(()=>{ loadAvatar(); },[ts]);
  useEffect(()=>()=>{ if(avatarUrl) URL.revokeObjectURL(avatarUrl); },[avatarUrl]); // cleanup

  const onPick = ()=> fileRef.current?.click();

  const onUpload = async (e)=>{
    const f = e.target.files?.[0];
    if(!f) return;
    setUploading(true);
    try{
      const fd = new FormData();
      fd.append('avatar', f);               // ชื่อ field ต้อง "avatar"
      await api.post('/users/me/avatar', fd);
      setTs(Date.now());                    // รีโหลด avatar
      const me = await api.get('/users/me'); // ดึง user ล่าสุด
      setUser(me.data.user);
      updateUser(me.data.user);             // ⬅️ แจ้งทั้งแอปให้รู้ว่ารูปเปลี่ยนแล้ว
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const save = async ()=>{
    setSaving(true);
    try{
      const { data } = await api.patch('/users/me', { fullname: form.fullname, email: form.email });
      setUser(data.user);                   // header ในเพจนี้เปลี่ยนตอนนี้
      updateUser(data.user);                // ⬅️ แจ้ง context → ปุ่มมุมขวาบนอัปเดตทันที
      alert('บันทึกโปรไฟล์เรียบร้อย');
    } finally { setSaving(false); }
  };

  if(!user) return <div className={styles.wrap}>กำลังโหลด...</div>;

  const initials = (user.fullname || user.username || 'U')
    .split(' ').map(s=>s[0]).slice(0,2).join('').toUpperCase();

  return (
    <div className={styles.wrap}>
      <div className={styles.banner}>
        <div className={styles.inner}>
          <div className={styles.avatar}>
            {avatarUrl ? <img src={avatarUrl} alt="avatar" /> : <span style={{position:'absolute', userSelect:'none'}}>{initials}</span>}
          </div>
          <div className={styles.meta}>
            <div className={styles.name}>{user.fullname || user.username}</div>
            <div className={styles.email}>{user.email}</div>
          </div>
          <div className={styles.action}>
            <input ref={fileRef} type="file" accept="image/*" className={styles.hiddenInput} onChange={onUpload}/>
            <button className={styles.btn} onClick={onPick} disabled={uploading}>
              {uploading ? 'กำลังอัปโหลด…' : 'เปลี่ยนรูป'}
            </button>
          </div>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.head}>
          <div className={styles.title}>ข้อมูลบัญชี</div>
          <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={save} disabled={saving}>
            {saving ? 'กำลังบันทึก…' : 'บันทึก'}
          </button>
        </div>

        <div className={styles.grid}>
          <label>
            <div className={styles.label}>ชื่อแสดงผล</div>
            <input
              className={styles.input}
              value={form.fullname}
              onChange={e=>setForm(prev=>({ ...prev, fullname:e.target.value }))}
            />
          </label>
          <label>
            <div className={styles.label}>อีเมล</div>
            <input
              type="email"
              className={styles.input}
              value={form.email}
              onChange={e=>setForm(prev=>({ ...prev, email:e.target.value }))}
            />
          </label>
        </div>
      </div>
    </div>
  );
}
