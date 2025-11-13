import { NavLink, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

const CATS = ['การเงินการลงทุน','มังงะ','นิยาย','อาหารเเละสุขภาพ','การเรียน'];

export default function CategoryDrawer({ open, onClose }) {
  const nav = useNavigate();

  // ปิดด้วย ESC
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    if (open) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // คลิกพื้นหลังปิด
  const onBackdrop = (e) => {
    if (e.target.dataset.backdrop) onClose?.();
  };

  return (
    <div
      role="dialog"
      aria-hidden={!open}
      data-backdrop
      onClick={onBackdrop}
      style={{
        position:'fixed', inset:0, zIndex:50,
        display: open ? 'block' : 'none',
        background:'rgba(0,0,0,.45)'
      }}
    >
      <aside
        style={{
          position:'absolute', inset:'0 auto 0 0', width:320, maxWidth:'82vw',
          background:'#fff', height:'100%',
          boxShadow:'0 12px 30px rgba(0,0,0,.25)',
          transform: open ? 'translateX(0)' : 'translateX(-100%)',
          transition:'transform .22s ease-out',
          borderRight:'1px solid #eee'
        }}
      >
        <div style={{padding:'14px 18px', borderBottom:'1px solid #f0f0f0', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <strong style={{fontSize:18}}>หมวดหมู่สินค้า</strong>
          <button className="btn" onClick={onClose} aria-label="ปิด">ปิด</button>
        </div>

        <nav style={{display:'grid', gap:2, padding:'8px 0'}}>
          {CATS.map(c => (
            <NavLink
              key={c}
              to={`/category/${encodeURIComponent(c)}`}
              onClick={onClose}
              style={({isActive}) => ({
                padding:'14px 18px',
                display:'flex', alignItems:'center', justifyContent:'space-between',
                fontWeight:600,
                textDecoration:'none',
                color:'#111',
                background: isActive ? 'rgba(255,235,59,.25)' : 'transparent'
              })}
            >
              <span>{c}</span>
              <span style={{opacity:.5}}>›</span>
            </NavLink>
          ))}
        </nav>
      </aside>
    </div>
  );
}
