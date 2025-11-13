// frontend/src/components/BookingBell.jsx
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { getBookings, removeBooking, clearBookings } from '../utils/booking';

export default function BookingBell(){
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState(getBookings());
  const btnRef = useRef(null);

  useEffect(()=>{
    const onUpd = (e)=> setItems(getBookings());
    window.addEventListener('mib:booking:update', onUpd);
    return ()=> window.removeEventListener('mib:booking:update', onUpd);
  },[]);

  useEffect(()=>{
    const onDoc = (e)=>{
      if (!open) return;
      if (!btnRef.current) return;
      if (!btnRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return ()=> document.removeEventListener('mousedown', onDoc);
  },[open]);

  const count = items.length;

  return (
    <div ref={btnRef} style={{ position:'relative' }}>
      <button
        onClick={()=> setOpen(v=>!v)}
        title="การจองของฉัน"
        style={{
          display:'inline-flex', alignItems:'center', gap:8,
          padding:'8px 12px', borderRadius:999, border:'1px solid #e5e7eb',
          background:'#fff', cursor:'pointer'
        }}
      >
        <span style={{ fontSize:18 }}>🔔</span>
        {count > 0 && (
          <span style={{
            minWidth:20, height:20, padding:'0 6px',
            borderRadius:999, background:'#2e7d32', color:'#fff',
            fontSize:12, display:'inline-flex', alignItems:'center', justifyContent:'center'
          }}>{count}</span>
        )}
      </button>

      {open && (
        <div
          style={{
            position:'absolute', right:0, top:'calc(100% + 8px)',
            width:340, maxHeight:420, overflow:'auto',
            background:'#fff', border:'1px solid #e5e7eb', borderRadius:12,
            boxShadow:'0 10px 24px rgba(0,0,0,.08)', padding:10, zIndex:50
          }}
        >
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
            <strong>รายการที่จอง</strong>
            {count > 0 && (
              <button
                onClick={()=>{ if (confirm('ล้างรายการจองทั้งหมด?')) { clearBookings(); setItems([]); } }}
                style={{ background:'transparent', border:'none', color:'#d32f2f', cursor:'pointer' }}
              >
                ล้างทั้งหมด
              </button>
            )}
          </div>

          {count === 0 ? (
            <div style={{ opacity:.7, padding:'12px 4px' }}>ยังไม่มีรายการจอง</div>
          ) : (
            <ul style={{ listStyle:'none', margin:0, padding:0, display:'grid', gap:10 }}>
              {items.map(it => (
                <li key={it.bookId}
                    style={{ display:'grid', gridTemplateColumns:'56px 1fr auto', gap:10, alignItems:'center' }}>
                  <img
                    src={it.coverUrl}
                    alt={it.title}
                    style={{ width:56, height:56, objectFit:'cover', borderRadius:8, border:'1px solid #eee' }}
                    onError={(e)=>{ e.currentTarget.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=' }}
                  />
                  <div style={{ display:'grid', gap:2 }}>
                    <div style={{ fontWeight:600, lineHeight:1.2 }}>{it.title}</div>
                    <Link to={`/books/${it.bookId}`} style={{ fontSize:12, color:'#2e7d32' }}>ดูรายละเอียด</Link>
                  </div>
                  <button
                    onClick={()=>{ removeBooking(it.bookId); setItems(x=>x.filter(b=>String(b.bookId)!==String(it.bookId))); }}
                    title="ลบออก"
                    style={{ border:'none', background:'transparent', cursor:'pointer', color:'#9e9e9e', fontSize:18 }}
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
