
// import { useEffect, useRef, useState } from 'react';
// import { Link } from 'react-router-dom';

// export default function UserMenu({ user, onLogout }) {
//   const [open, setOpen] = useState(false);
//   const ref = useRef(null);

//   const displayName =
//     user?.username || user?.name || (user?.email ? user.email.split('@')[0] : 'ผู้ใช้');
//   const initials = (displayName || 'U').slice(0, 1).toUpperCase();

//   useEffect(() => {
//     const onClick = (e) => { if (open && ref.current && !ref.current.contains(e.target)) setOpen(false); };
//     const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
//     window.addEventListener('click', onClick);
//     window.addEventListener('keydown', onKey);
//     return () => { window.removeEventListener('click', onClick); window.removeEventListener('keydown', onKey); };
//   }, [open]);

//   return (
//     <div ref={ref} className="user-menu-wrapper">
//       <button
//         className="user-chip"
//         onClick={() => setOpen(v => !v)}
//         aria-haspopup="menu"
//         aria-expanded={open}
//         title={displayName}
//       >
//         <span className="user-avatar">{initials}</span>
//         <span className="user-name">{displayName}</span>
//         <span className="user-caret">▾</span>
//       </button>

//       {open && (
//         <div className="user-dropdown" role="menu">
//           <div className="user-dropdown-arrow" />
//           <div className="user-dropdown-header">
//             <span className="user-avatar lg">{initials}</span>
//             <div style={{display:'grid'}}>
//               <strong style={{lineHeight:1.1}}>{displayName}</strong>
//               <small style={{opacity:.8}}>{user?.email || ''}</small>
//             </div>
//           </div>

//           <div className="user-group-title">บัญชีของฉัน</div>
//           <div className="user-dropdown-list">
//             <Link to="/profile" className="user-item" onClick={()=>setOpen(false)}>
//               <span className="user-ico">👤</span> โปรไฟล์
//             </Link>
//             <button className="user-item" onClick={()=>setOpen(false)}>
//               <span className="user-ico">⚙️</span> การตั้งค่า
//             </button>
//             <button className="user-item" onClick={()=>setOpen(false)}>
//               <span className="user-ico">📦</span> ที่อยู่จัดส่ง
//             </button>
//             <button className="user-item" onClick={()=>setOpen(false)}>
//               <span className="user-ico">💚</span> ความชื่นชอบ
//             </button>
//           </div>

//           <div className="user-group-title">ช่วยเหลือ</div>
//           <div className="user-dropdown-list">
//             <button className="user-item" onClick={()=>setOpen(false)}>
//               <span className="user-ico">❓</span> ศูนย์ช่วยเหลือ
//             </button>
//           </div>

//           <div className="user-sep" />

//           <div className="user-dropdown-list">
//             <button className="user-item danger" onClick={() => { setOpen(false); onLogout?.(); }}>
//               <span className="user-ico">🚪</span> ออกจากระบบ
//             </button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

export default function UserMenu({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const displayName =
    user?.username || user?.name || (user?.email ? user.email.split('@')[0] : 'ผู้ใช้');
  const initials = (displayName || 'U').slice(0, 1).toUpperCase();

  // ปิดเมื่อคลิกนอก / กด ESC
  useEffect(() => {
    const onClick = (e) => { if (open && ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('click', onClick);
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('click', onClick); window.removeEventListener('keydown', onKey); };
  }, [open]);

  return (
    <div ref={ref} className="um-wrapper">
      {/* ปุ่มบัญชี (Chip แบบกรอบ) */}
      <button
        type="button"
        className="um-chip"
        onClick={() => setOpen(v => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        title={displayName}
      >
        <span className="um-avatar" aria-hidden>{initials}</span>
        <span className="um-name">{displayName}</span>
        <span className="um-caret" aria-hidden>▾</span>
      </button>

      {/* เมนูดรอปดาวน์ */}
      {open && (
        <div className="um-dropdown" role="menu">
          {/* ส่วนหัวการ์ด */}
          <div className="um-header">
            <span className="um-avatar lg" aria-hidden>{initials}</span>
            <div className="um-info">
              <strong>{displayName}</strong>
              <small>{user?.email || ''}</small>
              <Link to="/profile" className="um-link" onClick={()=>setOpen(false)}>
                จัดการบัญชีของฉัน
              </Link>
            </div>
          </div>

          {/* กลุ่ม: บัญชีของฉัน */}
          <div className="um-section">
            <div className="um-title">บัญชีของฉัน</div>

            <Link to="/profile" className="um-item" onClick={()=>setOpen(false)}>
              <span className="um-ico">👤</span>
              <span className="um-text">โปรไฟล์</span>
              <span className="um-chevron">›</span>
            </Link>

            <button className="um-item" onClick={()=>setOpen(false)}>
              <span className="um-ico">⚙️</span>
              <span className="um-text">การตั้งค่า</span>
              <span className="um-chevron">›</span>
            </button>

            <button className="um-item" onClick={()=>setOpen(false)}>
              <span className="um-ico">📦</span>
              <span className="um-text">ที่อยู่จัดส่ง</span>
              <span className="um-chevron">›</span>
            </button>

            <button className="um-item" onClick={()=>setOpen(false)}>
              <span className="um-ico">💚</span>
              <span className="um-text">ความชื่นชอบ</span>
              <span className="um-chevron">›</span>
            </button>
          </div>

          <div className="um-divider" />

          {/* กลุ่ม: ช่วยเหลือ */}
          <div className="um-section">
            <div className="um-title">ช่วยเหลือ</div>
            <button className="um-item" onClick={()=>setOpen(false)}>
              <span className="um-ico">❓</span>
              <span className="um-text">ศูนย์ช่วยเหลือ</span>
              <span className="um-chevron">›</span>
            </button>
          </div>

          <div className="um-divider" />

          <div className="um-section">
            <button className="um-item danger" onClick={()=>{ setOpen(false); onLogout?.(); }}>
              <span className="um-ico">🚪</span>
              <span className="um-text">ออกจากระบบ</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
