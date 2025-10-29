import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api, { apiBase } from '../api';
import { useAuth } from '../context/AuthContext';

export default function BookDetail(){
  const { id } = useParams();
  const [book, setBook] = useState(null);
  const { user } = useAuth();
  const nav = useNavigate();

  useEffect(()=>{
    (async ()=>{
      const res = await api.get(`/books/${id}`);
      setBook(res.data);
    })();
  }, [id]);

  if (!book) return <div className="container" style={{margin:'24px auto'}}>Loading...</div>;

  const purchase = ()=>{
    if (!user) {
      alert('ต้องสมัครสมาชิก/เข้าสู่ระบบก่อนจึงจะสั่งซื้อได้');
      nav('/register');
      return;
    }
    alert('เดโม: หน้านี้ยังไม่เปิดขายจริง (จำกัดสิทธิ์เฉพาะสมาชิก)');
  };

  const src = `${apiBase()}/books/${book._id}/cover?v=${encodeURIComponent(book.updatedAt || '')}`;

  return (
    <div className="container" style={{margin:'24px auto'}}>
      <div style={{display:'grid',gridTemplateColumns:'1fr 2fr',gap:24}}>
        <img src={src} alt={book.title} style={{width:'100%',borderRadius:16}}
             onError={(e)=>{e.currentTarget.src='https://placehold.co/600x800?text=No+Cover'}} />
        <div>
          <div className="badge">{book.category}</div>
          <h1 style={{margin:'8px 0'}}>{book.title}</h1>
          <div style={{fontSize:18, fontWeight:800, margin:'6px 0'}}>ราคา: ฿{Number(book.price ?? 0).toLocaleString('th-TH')}</div>
          <div>ผู้เขียน: {book.authors?.join(', ') || 'ไม่ระบุ'}</div>
          <div>สำนักพิมพ์: {book.publisher || '-'}</div>
          <div>ภาษา: {book.language || '-'}</div>
          <div>จำนวนหน้า: {book.pages || '-'}</div>
          <div>ปีที่พิมพ์: {book.year || '-'}</div>
          <p style={{marginTop:12,whiteSpace:'pre-wrap'}}>{book.description || '-'}</p>
          <div style={{display:'flex',gap:8,marginTop:12}}>
            <button className="btn secondary" onClick={purchase}>สั่งซื้อ (สมาชิกเท่านั้น)</button>
          </div>
        </div>
      </div>
    </div>
  )
}
