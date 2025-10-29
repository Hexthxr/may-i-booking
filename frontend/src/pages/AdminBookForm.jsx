
// import { useEffect, useState } from 'react';
// import { useNavigate, useParams } from 'react-router-dom';
// import api from '../api';

// const CATS = ['การเงินการลงทุน','มังงะ','นิยาย','อาหารเเละสุขภาพ','การเรียน'];

// export default function AdminBookForm(){
//   const { id } = useParams();
//   const nav = useNavigate();
//   const editing = Boolean(id);
//   const [form, setForm] = useState({
//     sku:'', title:'', description:'',
//     authors:'', publisher:'',
//     language:'TH', pages:0, year:2025,
//     category:CATS[0],
//     price: 0
//   });
//   const [cover, setCover] = useState(null);

//   useEffect(()=>{
//     if (!editing) return;
//     (async ()=>{
//       const res = await api.get(`/books/${id}`);
//       const b = res.data;
//       setForm({
//         sku:b.sku||'', title:b.title||'', description:b.description||'',
//         authors:(b.authors||[]).join(', '), publisher:b.publisher||'',
//         language:b.language||'TH', pages:b.pages||0, year:b.year||2025,
//         category:b.category,
//         price: Number(b.price ?? 0)
//       });
//     })();
//   }, [id, editing]);

//   const onSubmit = async (e)=>{
//     e.preventDefault();
//     const payload = {
//       ...form,
//       pages: Number(form.pages||0),
//       year: Number(form.year||2025),
//       price: Number(form.price||0),
//       authors: form.authors.split(',').map(s=>s.trim()).filter(Boolean)
//     };
//     const fd = new FormData();
//     fd.append('data', JSON.stringify(payload));
//     if (cover) fd.append('cover', cover);

//     if (editing){
//       await api.put(`/books/${id}`, fd, { headers: { 'Content-Type':'multipart/form-data' } });
//     } else {
//       await api.post('/books', fd, { headers: { 'Content-Type':'multipart/form-data' } });
//     }
//     nav('/admin/books');
//   };

//   return (
//     <div className="container" style={{maxWidth:720,margin:'24px auto'}}>
//       <h2>{editing?'แก้ไข':'เพิ่ม'} หนังสือ</h2>
//       <form onSubmit={onSubmit} className="card" style={{padding:16,display:'grid',gap:10}}>
//         <label>ชื่อเรื่อง
//           <input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} required style={{width:'100%',padding:10}}/>
//         </label>
//         <label>หมวดหมู่
//           <select value={form.category} onChange={e=>setForm({...form,category:e.target.value})} style={{width:'100%',padding:10}}>
//             {CATS.map(c => <option key={c} value={c}>{c}</option>)}
//           </select>
//         </label>
//         <label>ผู้เขียน (คั่นด้วย ,)
//           <input value={form.authors} onChange={e=>setForm({...form,authors:e.target.value})} style={{width:'100%',padding:10}}/>
//         </label>
//         <label>สำนักพิมพ์
//           <input value={form.publisher} onChange={e=>setForm({...form,publisher:e.target.value})} style={{width:'100%',padding:10}}/>
//         </label>

//         <label>ภาษา
//           <input value={form.language} onChange={e=>setForm({...form,language:e.target.value})} style={{width:'100%',padding:10}}/>
//         </label>
//         <label>จำนวนหน้า
//           <input type="number" value={form.pages} onChange={e=>setForm({...form,pages:e.target.value})} style={{width:'100%',padding:10}}/>
//         </label>
//         <label>ปีที่พิมพ์
//           <input type="number" value={form.year} onChange={e=>setForm({...form,year:e.target.value})} style={{width:'100%',padding:10}}/>
//         </label>

//         <label>ราคา (บาท)
//           <input type="number" min="0" step="1" value={form.price} onChange={e=>setForm({...form,price:e.target.value})} style={{width:'100%',padding:10}}/>
//         </label>

//         <label>คำอธิบาย
//           <textarea rows="5" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} style={{width:'100%',padding:10}}/>
//         </label>
//         <label>รูปปก (อัปโหลดไฟล์)
//           <input type="file" accept="image/*" onChange={e=>setCover(e.target.files[0])}/>
//         </label>
//         <button className="btn" style={{marginTop:8}}>{editing?'บันทึก':'เพิ่มหนังสือ'}</button>
//       </form>
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
