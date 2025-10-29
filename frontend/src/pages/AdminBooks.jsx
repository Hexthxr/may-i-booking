// import { useEffect, useState } from 'react';
// import { Link } from 'react-router-dom';
// import api from '../api';

// export default function AdminBooks(){
//   const [items, setItems] = useState([]);

//   const refresh = async ()=>{
//     const res = await api.get('/books');
//     setItems(res.data);
//   };

//   useEffect(()=>{ refresh(); }, []);

//   const del = async (id)=>{
//     if (!confirm('ลบรายการนี้?')) return;
//     await api.delete(`/books/${id}`);
//     refresh();
//   };

//   return (
//     <div className="container" style={{margin:'24px auto'}}>
//       <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
//         <h2>รายการหนังสือ</h2>
//         <Link className="btn" to="/admin/books/new">เพิ่มหนังสือ</Link>
//       </div>
//       <div className="grid">
//         {items.map(b => (
//           <article className="card" key={b._id}>
//             <img src={b.coverPath || 'https://placehold.co/600x800?text=No+Cover'} alt={b.title}/>
//             <div className="body">
//               <div className="badge">{b.category}</div>
//               <strong>{b.title}</strong>
//               <div style={{display:'flex',gap:8,marginTop:8}}>
//                 <Link className="btn secondary" to={`/admin/books/${b._id}`}>แก้ไข</Link>
//                 <button className="btn" onClick={()=>del(b._id)}>ลบ</button>
//               </div>
//             </div>
//           </article>
//         ))}
//       </div>
//     </div>
//   )
// }
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { apiBase } from '../api';

export default function AdminBooks(){
  const [items, setItems] = useState([]);

  const refresh = async ()=>{
    const res = await api.get('/books');
    setItems(res.data);
  };

  useEffect(()=>{ refresh(); }, []);

  const del = async (id)=>{
    if (!confirm('ลบรายการนี้?')) return;
    await api.delete(`/books/${id}`);
    refresh();
  };

  return (
    <div className="container" style={{margin:'24px auto'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <h2>รายการหนังสือ</h2>
        <Link className="btn" to="/admin/books/new">เพิ่มหนังสือ</Link>
      </div>

      <div className="grid" style={{marginTop:16}}>
        {items.map(b => {
          const src = `${apiBase()}/books/${b._id}/cover?v=${encodeURIComponent(b.updatedAt || '')}`;
          return (
            <article className="card" key={b._id}>
              <img
                src={src}
                alt={b.title}
                onError={(e)=>{e.currentTarget.src='https://placehold.co/600x800?text=No+Cover'}}
              />
              <div className="body">
                <div className="badge">{b.category}</div>
                <strong>{b.title}</strong>
                <div style={{display:'flex',gap:8,marginTop:8}}>
                  <Link className="btn secondary" to={`/admin/books/${b._id}`}>แก้ไข</Link>
                  <button className="btn" onClick={()=>del(b._id)}>ลบ</button>
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
