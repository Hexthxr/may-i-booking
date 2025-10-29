import { Link } from 'react-router-dom';
import { apiBase } from '../api';

export default function BookCard({ book }){
  const src = `${apiBase()}/books/${book._id}/cover?v=${encodeURIComponent(book.updatedAt || '')}`;
  return (
    <article className="card">
      <img src={src} alt={book.title} loading="lazy" onError={(e)=>{e.currentTarget.src='https://placehold.co/600x800?text=No+Cover'}} />
      <div className="body">
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:8}}>
          <span className="badge">{book.category}</span>
          <span className="badge">฿{Number(book.price ?? 0).toLocaleString('th-TH')}</span>
        </div>
        <h3 style={{margin:'6px 0'}}>{book.title}</h3>
        <div style={{fontSize:12,color:'#666'}}>โดย {book.authors?.join(', ') || 'ไม่ระบุ'}</div>
        <Link to={`/book/${book._id}`} className="btn secondary">ดูรายละเอียด</Link>
      </div>
    </article>
  )
}
