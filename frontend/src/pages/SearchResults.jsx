import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api, { apiBase } from '../api';

export default function SearchResults(){
  const [sp] = useSearchParams();
  const q = sp.get('q') || '';
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    let ignore = false;
    (async ()=>{
      setLoading(true);
      try {
        // ปรับ params ให้ตรงแบ็กเอนด์คุณ
        const res = await api.get('/books', { params: { q, limit: 40 } });
        const list = Array.isArray(res.data) ? res.data : (res.data?.items || []);
        if (!ignore) setItems(list);
      } catch {
        if (!ignore) setItems([]);
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return ()=>{ ignore = true; };
  }, [q]);

  return (
    <div className="container" style={{margin:'24px auto'}}>
      <h2>ผลการค้นหา: “{q}”</h2>
      {loading ? (
        <div style={{marginTop:12}}>กำลังค้นหา...</div>
      ) : items.length === 0 ? (
        <div style={{marginTop:12}}>ไม่พบผลลัพธ์</div>
      ) : (
        <div style={{
          display:'grid',
          gridTemplateColumns:'repeat(auto-fill, minmax(180px, 1fr))',
          gap:16,
          marginTop:12
        }}>
          {items.map(b=>{
            const cover = b.coverUrl || `${apiBase?.() ? `${apiBase()}/books/${b._id}/cover` : b.cover}`;
            return (
              <Link
                key={b._id || b.id}
                to={`/books/${b._id || b.id}`}
                style={{
                  display:'block', textDecoration:'none', color:'inherit',
                  border:'1px solid #eee', borderRadius:12, overflow:'hidden'
                }}
              >
                <img
                  src={cover || 'https://placehold.co/400x520?text=No+Cover'}
                  alt={b.title}
                  style={{ width:'100%', aspectRatio:'3/4', objectFit:'cover' }}
                  onError={(e)=>{ e.currentTarget.src='https://placehold.co/400x520?text=No+Cover'; }}
                />
                <div style={{padding:10}}>
                  <div style={{
                    fontWeight:700,
                    whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'
                  }}>{b.title}</div>
                  <div style={{fontSize:12, color:'#666', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>
                    {b.authors?.join(', ') || b.publisher || '—'}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
