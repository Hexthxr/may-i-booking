import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from '../styles/notify.module.css';

const BELL = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path d="M12 22a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 22Z" fill="currentColor"/>
    <path d="M20 17H4a1 1 0 0 1-.86-1.5l1.22-2.05A4 4 0 0 0 5 11V9a7 7 0 0 1 14 0v2c0 .69.18 1.37.52 1.97l1.34 2.53A1 1 0 0 1 20 17Z" stroke="currentColor" strokeWidth="1.6" fill="none"/>
  </svg>
);

function readReservations(){
  try { return JSON.parse(localStorage.getItem('mib:reservations') || '[]'); }
  catch { return []; }
}

export default function NotificationBell(){
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState(readReservations());
  const ref = useRef(null);

  const count = items.length;
  const latest = useMemo(() => items.slice().reverse().slice(0, 6), [items]);

  // อัปเดตเมื่อกล่องจองเปลี่ยน / แท็บอื่นเปลี่ยน
  useEffect(() => {
    const onNotify = () => setItems(readReservations());
    const onStorage = (e) => { if (e.key === 'mib:reservations') onNotify(); };
    window.addEventListener('mib:notify', onNotify);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('mib:notify', onNotify);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  // ปิด dropdown เมื่อคลิกนอก
  useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  return (
    <div className={styles.wrap} ref={ref}>
      <button
        className={styles.btn}
        aria-label="การแจ้งเตือนการจอง"
        onClick={() => setOpen((v) => !v)}
      >
        <span className={styles.icon}>{BELL}</span>
        {count > 0 && <span className={styles.badge}>{count}</span>}
      </button>

      {open && (
        <div className={styles.dropdown}>
          <div className={styles.dropHeader}>
            การจองล่าสุด {count ? `(${count})` : ''}
          </div>

          {count === 0 ? (
            <div className={styles.empty}>ยังไม่มีการจอง</div>
          ) : (
            <ul className={styles.list}>
              {latest.map((it) => (
                <li key={it.id} className={styles.item}>
                  <img
                    src={it.coverUrl}
                    alt={it.title}
                    onError={(e)=>{e.currentTarget.style.visibility='hidden';}}
                  />
                  <div className={styles.meta}>
                    <div className={styles.title} title={it.title}>{it.title}</div>
                    <div className={styles.sub}>จำนวน {it.qty} • ฿{Number(it.price||0).toLocaleString('th-TH')}</div>
                  </div>
                  <button
                    className={styles.viewBtn}
                    onClick={()=>{ setOpen(false); nav(`/books/${it.id}`); }}
                  >
                    ดู
                  </button>
                </li>
              ))}
            </ul>
          )}

          {count > 0 && (
            <div className={styles.footer}>
              <Link to="/cart" onClick={()=>setOpen(false)} className={styles.linkBtn}>
                ไปยังตะกร้า
              </Link>
              <button
                className={styles.clearBtn}
                onClick={()=>{
                  localStorage.removeItem('mib:reservations');
                  window.dispatchEvent(new Event('mib:notify'));
                }}
              >
                ล้างรายการ
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
