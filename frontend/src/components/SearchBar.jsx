import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function SearchBar() {
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const [suggests, setSuggests] = useState([]);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const boxRef = useRef(null);
  const timerRef = useRef(null);

  // เดโบ๊วซ์ค้นหา
  useEffect(() => {
    if (!q.trim()) { setSuggests([]); setOpen(false); return; }
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      try {
        // เปลี่ยนชื่อพารามิเตอร์ตรงนี้ให้ตรงกับแบ็กเอนด์ของคุณ
        const res = await api.get('/books', { params: { q, limit: 6 } });
        const list = Array.isArray(res.data) ? res.data : (res.data?.items || []);
        setSuggests(list);
        setOpen(true);
        setActiveIdx(-1);
      } catch {
        setSuggests([]); setOpen(false);
      }
    }, 220);
    return () => clearTimeout(timerRef.current);
  }, [q]);

  // ปิดเมื่อคลิกนอก
  useEffect(() => {
    const onClick = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    window.addEventListener('click', onClick);
    return () => window.removeEventListener('click', onClick);
  }, []);

  const goSearch = (term) => {
    const query = (term ?? q).trim();
    if (!query) return;
    setOpen(false);
    nav(`/search?q=${encodeURIComponent(query)}`);
  };

  const onKeyDown = (e) => {
    if (!open || !suggests.length) {
      if (e.key === 'Enter') goSearch();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => (i + 1) % suggests.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => (i - 1 + suggests.length) % suggests.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const item = suggests[activeIdx];
      if (item) goSearch(item.title || item.keyword || '');
      else goSearch();
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div
      ref={boxRef}
      style={{ position: 'relative', flex: '1 1 560px', maxWidth: 680 }}
      aria-expanded={open}
    >
      {/* กล่องค้นหาแบบ pill */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          background: '#fff',
          borderRadius: 28,
          padding: '10px 14px',
          border: '1px solid #e5e5e5',
          boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
        }}
      >
        {/* ไอคอนแว่น */}
        <span aria-hidden style={{ marginRight: 8, fontSize: 18, opacity: 0.7 }}>🔎</span>

        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="ค้นหาหนังสือ"
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            fontSize: 15,
            padding: '6px 4px',
          }}
          aria-label="ค้นหาหนังสือ"
        />

        {/* ปุ่มล้าง */}
        {q && (
          <button
            type="button"
            onClick={() => { setQ(''); setSuggests([]); setOpen(false); }}
            title="ล้าง"
            style={{
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              fontSize: 16,
              padding: 6,
              borderRadius: 8,
              opacity: 0.6,
            }}
          >
            ✕
          </button>
        )}

        {/* ปุ่ม submit */}
        <button
          type="button"
          onClick={() => goSearch()}
          style={{
            marginLeft: 6,
            padding: '8px 14px',
            borderRadius: 20,
            border: '1px solid #23c55e',
            background: '#23c55e',
            color: '#fff',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Search
          {/* หรือใส่ไทย: ค้นหา */}
        </button>
      </div>

      {/* กล่อง Suggestion */}
      {open && suggests.length > 0 && (
        <div
          role="listbox"
          style={{
            position: 'absolute',
            left: 0, right: 0, top: 'calc(100% + 6px)',
            background: '#fff',
            border: '1px solid #eaeaea',
            borderRadius: 12,
            boxShadow: '0 10px 24px rgba(0,0,0,0.12)',
            overflow: 'hidden',
            zIndex: 1000,
          }}
        >
          {suggests.map((b, i) => (
            <button
              key={b._id || b.id || `${b.title}-${i}`}
              role="option"
              aria-selected={activeIdx === i}
              onMouseEnter={() => setActiveIdx(i)}
              onClick={() => goSearch(b.title || '')}
              style={{
                display: 'grid',
                gridTemplateColumns: '40px 1fr',
                gap: 10,
                width: '100%',
                textAlign: 'left',
                padding: 10,
                border: 'none',
                background: activeIdx === i ? '#f1f8e9' : 'transparent',
                cursor: 'pointer',
              }}
            >
              <img
                src={b.coverUrl || b.cover || 'https://placehold.co/80x100?text=Book'}
                alt=""
                style={{ width: 40, height: 54, borderRadius: 6, objectFit: 'cover' }}
                onError={(e)=>{ e.currentTarget.src='https://placehold.co/80x100?text=Book'; }}
              />
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {b.title || '-'}
                </div>
                <div style={{ fontSize: 12, color: '#666', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {b.authors?.join(', ') || b.publisher || '—'}
                </div>
              </div>
            </button>
          ))}
          {/* ปุ่มไปผลลัพธ์ทั้งหมด */}
          <button
            onClick={() => goSearch()}
            style={{
              width: '100%',
              padding: 10,
              border: 'none',
              background: '#fff',
              borderTop: '1px solid #eee',
              cursor: 'pointer',
              fontWeight: 700,
              color: '#2e7d32',
            }}
          >
            ดูผลลัพธ์ทั้งหมดสำหรับ “{q}”
          </button>
        </div>
      )}
    </div>
  );
}
