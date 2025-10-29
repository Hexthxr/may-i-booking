// frontend/src/components/UserMenu.jsx
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

export default function UserMenu({ onLogout }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const ref = useRef(null);

  // ใช้ชื่อจริงจาก DB เป็นหลัก (fullname) → ถ้าไม่มี fallback เป็น username → ส่วนท้ายอีเมล
  const displayName = user?.fullname?.trim()
    || user?.username?.trim()
    || (user?.email ? user.email.split('@')[0] : 'ผู้ใช้');

  const initials = (displayName || 'U').slice(0, 1).toUpperCase();

  // โหลด avatar เป็น blob ทุกครั้งที่ user เปลี่ยน (หลัง updateUser / รีเฟรชจาก DB)
  useEffect(()=>{
    let revoke;
    (async ()=>{
      if(!user) { setAvatarUrl(null); return; }
      try{
        const res = await api.get('/users/me/avatar', { responseType: 'blob' });
        const url = URL.createObjectURL(res.data);
        setAvatarUrl(url);
        revoke = url;
      }catch{
        setAvatarUrl(null);
      }
    })();
    return ()=>{ if(revoke) URL.revokeObjectURL(revoke); };
  }, [user]);

  useEffect(() => {
    const onClick = (e) => { if (open && ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('click', onClick);
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('click', onClick); window.removeEventListener('keydown', onKey); };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <div ref={ref} className="um-wrapper">
      <button type="button" className="um-chip" onClick={() => setOpen(v => !v)}
        aria-haspopup="menu" aria-expanded={open} title={displayName}>
        <span className="um-avatar" aria-hidden>
          {avatarUrl
            ? <img src={avatarUrl} alt="" style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:'999px'}}/>
            : initials}
        </span>
        <span className="um-name">{displayName}</span>
        <span className="um-caret" aria-hidden>▾</span>
      </button>

      {open && (
        <div className="um-dropdown" role="menu">
          <div className="um-header">
            <span className="um-avatar lg" aria-hidden>
              {avatarUrl
                ? <img src={avatarUrl} alt="" style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:'999px'}}/>
                : initials}
            </span>
            <div className="um-info">
              <strong>{displayName}</strong>
              <small>{user?.email || ''}</small>
              <Link to="/account" className="um-link" onClick={close}>
                จัดการบัญชีของฉัน
              </Link>
            </div>
          </div>

          <div className="um-section">
            <div className="um-title">บัญชีของฉัน</div>
            <Link to="/account" className="um-item" onClick={close}><span className="um-ico">👤</span><span className="um-text">โปรไฟล์</span><span className="um-chevron">›</span></Link>
            <Link to="/settings" className="um-item" onClick={close}><span className="um-ico">⚙️</span><span className="um-text">การตั้งค่า</span><span className="um-chevron">›</span></Link>
            <Link to="/account/address" className="um-item" onClick={close}><span className="um-ico">📦</span><span className="um-text">ที่อยู่จัดส่ง</span><span className="um-chevron">›</span></Link>
            <Link to="/favorites" className="um-item" onClick={close}><span className="um-ico">💚</span><span className="um-text">ความชื่นชอบ</span><span className="um-chevron">›</span></Link>
          </div>

          <div className="um-divider" />
          <div className="um-section">
            <div className="um-title">ช่วยเหลือ</div>
            <Link to="/help" className="um-item" onClick={close}><span className="um-ico">❓</span><span className="um-text">ศูนย์ช่วยเหลือ</span><span className="um-chevron">›</span></Link>
          </div>
          <div className="um-divider" />
          <div className="um-section">
            <button className="um-item danger" onClick={()=>{ close(); onLogout?.(); }}>
              <span className="um-ico">🚪</span><span className="um-text">ออกจากระบบ</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
