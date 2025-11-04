// // frontend/src/pages/BookDetail.jsx
// import { useEffect, useState } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import api, { apiBase } from '../api';
// import { useAuth } from '../context/AuthContext';
// import { addToLocalCart, addServerCart } from '../utils/cart';

// export default function BookDetail() {
//   const { id } = useParams();
//   const [book, setBook] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const { user } = useAuth();
//   const nav = useNavigate();

//   // โมดอลบังคับล็อกอิน
//   const [showAuthModal, setShowAuthModal] = useState(false);
//   // ป้องกันกดซ้ำตอนเพิ่มตะกร้า
//   const [adding, setAdding] = useState(false);

//   useEffect(() => {
//     (async () => {
//       try {
//         const res = await api.get(`/books/${id}`);
//         setBook(res.data);
//       } finally {
//         setLoading(false);
//       }
//     })();
//   }, [id]);

//   if (loading) {
//     return <div className="container" style={{ margin: '24px auto' }}>Loading...</div>;
//   }
//   if (!book) {
//     return <div className="container" style={{ margin: '24px auto' }}>ไม่พบบุ๊คนี้</div>;
//   }

//   // ไปเช็คเอาท์ (สมาชิกเท่านั้น)
//   const purchase = () => {
//     if (!user) {
//       setShowAuthModal(true);
//       return;
//     }
//     nav('/checkout', {
//       state: {
//         from: `/books/${book._id}`,
//         items: [{ bookId: book._id, title: book.title, price: Number(book.price || 0), qty: 1 }],
//       },
//     });
//   };

//   // เพิ่มลงตะกร้า (ไม่ต้องล็อกอิน)
//   const addCart = async () => {
//     if (adding) return;
//     setAdding(true);
//     try {
//      const item = {
//         bookId: book._id,
//         title: book.title,
//         price: Number(book.price || 0),
//         qty: 1,
//         coverUrl: `${apiBase()}/books/${book._id}/cover`,
//       };
//       if (user) {
//         await addServerCart([item]);
//       window.dispatchEvent(new Event('mib:cart:update'));          // ✅ ไป MongoDB
//       } else {
//         addToLocalCart([item]);               // ✅ ยังไม่ล็อกอิน → localStorage
//       }
//       if (confirm('เพิ่มลงตะกร้าแล้ว\n\nไปที่ตะกร้าเลยไหม?')) {
//         nav('/cart');
//       }
//     } finally {
//       setAdding(false);
//     }
//   };

//   const coverSrc = `${apiBase()}/books/${book._id}/cover?v=${encodeURIComponent(book.updatedAt || '')}`;

//   return (
//     <div className="container" style={{ margin: '24px auto', position: 'relative' }}>
//       {/* ---------- Book layout ---------- */}
//       <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24 }}>
//         <img
//           src={coverSrc}
//           alt={book.title}
//           style={{ width: '100%', borderRadius: 16 }}
//           onError={(e) => { e.currentTarget.src = 'https://placehold.co/600x800?text=No+Cover'; }}
//         />
//         <div>
//           <div className="badge">{book.category || book.categories?.[0] || 'ทั่วไป'}</div>
//           <h1 style={{ margin: '8px 0' }}>{book.title}</h1>

//           <div style={{ fontSize: 18, fontWeight: 800, margin: '6px 0' }}>
//             ราคา: ฿{Number(book.price ?? 0).toLocaleString('th-TH')}
//           </div>

//           <div>ผู้เขียน: {book.authors?.join(', ') || 'ไม่ระบุ'}</div>
//           <div>สำนักพิมพ์: {book.publisher || '-'}</div>
//           <div>ภาษา: {book.language || '-'}</div>
//           <div>จำนวนหน้า: {book.pages || '-'}</div>
//           <div>ปีที่พิมพ์: {book.year || '-'}</div>

//           <p style={{ marginTop: 12, whiteSpace: 'pre-wrap' }}>
//             {book.description || '-'}
//           </p>

//           <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
//             <button className="btn secondary" onClick={purchase}>
//               สั่งซื้อ (สมาชิกเท่านั้น)
//             </button>
//             <button className="btn" onClick={addCart} disabled={adding}>
//               {adding ? 'กำลังเพิ่ม…' : 'เพิ่มลงตะกร้า'}
//             </button>
//           </div>
//         </div>
//       </div>

//       {/* ---------- Auth Required Modal ---------- */}
//       {showAuthModal && (
//         <>
//           {/* Backdrop */}
//           <div
//             onClick={() => setShowAuthModal(false)}
//             style={{
//               position: 'fixed',
//               inset: 0,
//               background: 'rgba(0,0,0,0.4)',
//               backdropFilter: 'blur(2px)',
//               zIndex: 50,
//               animation: 'fadeIn 150ms ease-out',
//             }}
//           />
//           {/* Card */}
//           <div
//             role="dialog"
//             aria-modal="true"
//             aria-labelledby="auth-title"
//             style={{
//               position: 'fixed',
//               inset: 0,
//               display: 'grid',
//               placeItems: 'center',
//               zIndex: 60,
//             }}
//           >
//             <div
//               style={{
//                 width: 'min(92vw, 480px)',
//                 background: '#fff',
//                 borderRadius: 16,
//                 boxShadow: '0 16px 30px rgba(0,0,0,0.18)',
//                 overflow: 'hidden',
//                 transform: 'translateY(8px)',
//                 animation: 'popIn 180ms ease-out',
//               }}
//             >
//               <div
//                 style={{
//                   background: 'linear-gradient(135deg, #d4fc79, #96e6a1)',
//                   padding: '16px 20px',
//                 }}
//               >
//                 <h3 id="auth-title" style={{ margin: 0, color: '#1b5e20' }}>
//                   จำกัดสิทธิ์เฉพาะสมาชิก
//                 </h3>
//                 <p style={{ margin: '6px 0 0', color: '#2e7d32' }}>
//                   กรุณาเข้าสู่ระบบก่อนสั่งซื้อหนังสือเล่มนี้
//                 </p>
//               </div>

//               <div style={{ padding: 20 }}>
//                 <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
//                   <div
//                     aria-hidden
//                     style={{
//                       width: 44,
//                       height: 44,
//                       borderRadius: 12,
//                       background: '#e8f5e9',
//                       display: 'grid',
//                       placeItems: 'center',
//                       fontSize: 22,
//                     }}
//                   >
//                     🔒
//                   </div>
//                   <div>
//                     <div style={{ fontWeight: 700 }}>ต้องเข้าสู่ระบบเพื่อดำเนินการสั่งซื้อ</div>
//                     <div style={{ color: '#666' }}>
//                       บัญชีสมาชิกช่วยให้ติดตามคำสั่งซื้อ และรับคูปองส่วนลดได้ง่ายขึ้น
//                     </div>
//                   </div>
//                 </div>

//                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12 }}>
//                   <button
//                     onClick={() =>
//                       nav('/login', { replace: true, state: { next: '/checkout' } })
//                     }
//                     style={{
//                       padding: '12px 14px',
//                       borderRadius: 10,
//                       border: '1px solid #2e7d32',
//                       background: '#fff',
//                       color: '#2e7d32',
//                       fontWeight: 700,
//                       cursor: 'pointer',
//                     }}
//                   >
//                     เข้าสู่ระบบ
//                   </button>
//                   <button
//                     onClick={() =>
//                       nav('/register', { replace: true, state: { next: '/checkout' } })
//                     }
//                     style={{
//                       padding: '12px 14px',
//                       borderRadius: 10,
//                       border: 'none',
//                       background: '#2e7d32',
//                       color: '#fff',
//                       fontWeight: 700,
//                       cursor: 'pointer',
//                     }}
//                   >
//                     สมัครสมาชิก
//                   </button>
//                 </div>

//                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }}>
//                   <span style={{ fontSize: 12, color: '#777' }}>
//                     มีบัญชีแล้ว? เข้าสู่ระบบเพื่อสั่งซื้อได้ทันที
//                   </span>
//                   <button
//                     onClick={() => setShowAuthModal(false)}
//                     style={{
//                       background: 'transparent',
//                       border: 'none',
//                       color: '#888',
//                       cursor: 'pointer',
//                       fontSize: 14,
//                     }}
//                     aria-label="ปิดหน้าต่าง"
//                   >
//                     ปิด
//                   </button>
//                 </div>
//               </div>
//             </div>
//           </div>

//           <style>{`
//             @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
//             @keyframes popIn {
//               from { opacity: 0; transform: translateY(12px) scale(0.98) }
//               to { opacity: 1; transform: translateY(8px) scale(1) }
//             }
//           `}</style>
//         </>
//       )}
//     </div>
//   );
// }

// frontend/src/pages/BookDetail.jsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api, { apiBase } from '../api';
import { useAuth } from '../context/AuthContext';
import { addToLocalCart, addServerCart } from '../utils/cart';
import Stars from '../components/Stars';

export default function BookDetail() {
  const { id } = useParams();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const nav = useNavigate();

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [adding, setAdding] = useState(false);
  const [qty, setQty] = useState(1);

  // รีวิว / ให้ดาว
  const [avg, setAvg] = useState(0);
  const [count, setCount] = useState(0);
  const [reviews, setReviews] = useState([]);
  const [myRating, setMyRating] = useState(5);
  const [myComment, setMyComment] = useState('');
  const [savingReview, setSavingReview] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [bRes, rStat, rList] = await Promise.all([
          api.get(`/books/${id}`),
          api.get(`/books/${id}/reviews/rating`).catch(() => ({ data: { avg: 0, count: 0 } })),
          api.get(`/books/${id}/reviews?limit=50`).catch(() => ({ data: { items: [] } })),
        ]);
        setBook(bRes.data?.book ?? bRes.data ?? null);
        setAvg(Number(rStat.data?.avg || 0));
        setCount(Number(rStat.data?.count || 0));
        setReviews(rList.data?.items || []);
      } catch (err) {
        console.error('load error', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // เพิ่มลงตะกร้า
  const addCart = async () => {
    if (adding || !book) return;
    setAdding(true);
    try {
      const stock = Number(book.stock || 0);
      if (stock <= 0) return alert('สินค้าหมดชั่วคราว');
      const useQty = Math.min(Number(qty) || 1, stock);
      const item = {
        bookId: book._id,
        title: book.title,
        price: Number(book.price || 0),
        qty: useQty,
        coverUrl: `${apiBase()}/books/${book._id}/cover`,
      };
      if (user) {
        await addServerCart([item]);
        window.dispatchEvent(new Event('mib:cart:update'));
      } else {
        addToLocalCart([item]);
      }
      if (confirm('เพิ่มลงตะกร้าแล้ว ไปหน้าตะกร้าเลยไหม?')) nav('/cart');
    } finally {
      setAdding(false);
    }
  };

  // บันทึกรีวิว
  const onSubmitReview = async (e) => {
    e.preventDefault();
    if (!user) return alert('กรุณาล็อกอินก่อนรีวิว');
    setSavingReview(true);
    try {
      const token = localStorage.getItem('mib:token') || user?.token;
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : undefined;

      const { data } = await api.post(
        `/books/${id}/reviews`,
        { rating: myRating, comment: myComment },
        config
      );

      if (data?.stats) {
        setAvg(data.stats.avg || 0);
        setCount(data.stats.count || 0);
      }
      setMyComment('');
      const rs = await api.get(`/books/${id}/reviews?limit=50`);
      setReviews(rs.data?.items || []);
      alert('บันทึกรีวิวสำเร็จ!');
    } catch (err) {
      console.error('review error', err);
      const status = err?.response?.status;
      const msg =
        err?.response?.data?.message ||
        (status === 401
          ? 'กรุณาเข้าสู่ระบบก่อนรีวิว'
          : status === 404
          ? 'ไม่พบหนังสือหรือ route รีวิวยังไม่เปิดใช้งาน'
          : status === 500
          ? 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์'
          : 'บันทึกไม่สำเร็จ');
      alert(msg);
    } finally {
      setSavingReview(false);
    }
  };

  if (loading) return <div className="container" style={{ margin: '24px auto' }}>กำลังโหลด…</div>;
  if (!book) return <div className="container" style={{ margin: '24px auto' }}>ไม่พบหนังสือ</div>;

  const coverSrc = `${apiBase()}/books/${book._id}/cover?v=${encodeURIComponent(book.updatedAt || '')}`;
  const inStock = Number(book.stock || 0) > 0;

  return (
    <div className="container" style={{ margin: '24px auto' }}>
      {/* theme local */}
      <style>{`
        .bd-grid { display: grid; grid-template-columns: 380px 1fr; gap: 28px; align-items: start; }
        .bd-card { background: #fff; border-radius: 16px; box-shadow: 0 8px 24px rgba(0,0,0,.06); }
        .bd-shadow-sm { box-shadow: 0 4px 14px rgba(0,0,0,.06); }
        .bd-pill { border-radius: 999px; }
        .bd-tag { display:inline-flex; align-items:center; gap:8px; padding:6px 12px; border-radius: 999px;
                  background: #effaf1; color:#2e7d32; font-weight:600; font-size:12px; }
        .bd-price { font-size: 24px; font-weight: 800; letter-spacing: .2px; }
        .bd-line { height:1px; background:linear-gradient(90deg,transparent,#eee,transparent); margin: 12px 0; }
        .bd-btn { padding: 12px 16px; border:0; border-radius: 12px; font-weight:700; cursor:pointer; transition:transform .06s ease; }
        .bd-btn:active { transform: translateY(1px) scale(.99); }
        .bd-btn-primary { background:#2e7d32; color:#fff; }
        .bd-btn-gray { background:#f2f4f5; color:#333; border:1px solid #e7eaec; }
        .bd-btn-warn { background:#f6f8ff; color:#2e7d32; border:1px solid #d7e9db; }
        .bd-qty { width: 110px; padding: 10px 12px; border-radius: 12px; border:1px solid #e6e6e6; }
        .bd-meta { color:#5f6b7a; font-size:14px; }
        .bd-review-card { border:1px solid #eee; border-radius:12px; padding:12px; background:#fff; }
        .bd-sticky { position: sticky; top: 16px; }
        @media (max-width: 960px) {
          .bd-grid { grid-template-columns: 1fr; }
          .bd-sticky { position: static; }
        }
      `}</style>

      <div className="bd-grid">
        {/* ซ้าย: ปก + กล่องราคาแบบ sticky */}
        <div className="bd-sticky">
          <div className="bd-card" style={{ padding: 16 }}>
            <img
              alt={book.title}
              src={coverSrc}
              style={{ width: '100%', height: 480, objectFit: 'cover', borderRadius: 12 }}
              onError={(e) => (e.currentTarget.src =
                'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=')}
            />
          </div>

          <div className="bd-card bd-shadow-sm" style={{ padding: 16, marginTop: 14 }}>
            <div className="bd-price">{Number(book.price || 0).toLocaleString()} บาท</div>
            <div style={{ marginTop: 6, fontWeight: 700, color: inStock ? '#2e7d32' : '#c62828' }}>
              {inStock ? `มีสินค้า (${book.stock} เล่ม)` : 'สินค้าหมด'}
            </div>

            <div className="bd-line" />

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                className="bd-qty"
                type="number"
                min={1}
                max={Math.max(1, Number(book.stock || 1))}
                value={qty}
                onChange={(e) =>
                  setQty(Math.max(1, Math.min(Number(e.target.value) || 1, Number(book.stock || 1))))
                }
              />
              <button
                className="bd-btn bd-btn-primary"
                onClick={addCart}
                disabled={adding || !inStock}
                style={{ opacity: inStock ? 1 : .65 }}
              >
                {inStock ? (adding ? 'กำลังเพิ่ม…' : 'เพิ่มลงตะกร้า') : 'สินค้าหมด'}
              </button>
            </div>

            <button
              className="bd-btn bd-btn-warn"
              onClick={() => (user ? nav('/checkout') : setShowAuthModal(true))}
              style={{ width: '100%', marginTop: 10 }}
            >
              สั่งซื้อ (สมาชิกเท่านั้น)
            </button>
          </div>
        </div>

        {/* ขวา: รายละเอียด */}
        <div>
          <div className="bd-tag">{book.category}</div>
          <h1 style={{ margin: '8px 0 4px' }}>{book.title}</h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Stars value={avg} size={18} />
            <span className="bd-meta">{avg.toFixed(2)} / 5 จาก {count} รีวิว</span>
          </div>

          <div className="bd-line" />

          <div className="bd-meta" style={{ display: 'grid', gap: 6 }}>
            <div>ผู้เขียน: <strong>{book.authors?.join(', ') || 'ไม่ระบุ'}</strong></div>
            <div>สำนักพิมพ์: {book.publisher || '-'}</div>
            <div>ภาษา: {book.language || '-'}</div>
            <div>จำนวนหน้า: {book.pages || '-'}</div>
            <div>ปีที่พิมพ์: {book.year || '-'}</div>
          </div>

          <p style={{ marginTop: 12, whiteSpace: 'pre-wrap' }}>{book.description || '-'}</p>

          {/* ---- บล็อกให้คะแนน ---- */}
          <div className="bd-card" style={{ padding: 16, marginTop: 20 }}>
            <h3 style={{ margin: 0 }}>ให้คะแนน & แสดงความคิดเห็น</h3>
            <form onSubmit={onSubmitReview} style={{ display: 'grid', gap: 10, marginTop: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="bd-meta" style={{ width: 72 }}>ให้ดาว:</span>
                {/* ใช้ Stars แบบ interactive */}
                <Stars value={myRating} onChange={setMyRating} size={22} />
                <span className="bd-meta">{myRating} ดาว</span>
              </div>
              <textarea
                placeholder="พิมพ์คอมเมนต์..."
                value={myComment}
                onChange={(e) => setMyComment(e.target.value)}
                rows={3}
                style={{
                  padding: 12, borderRadius: 12, border: '1px solid #e6e6e6',
                  outline: 'none'
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button type="submit" disabled={savingReview} className="bd-btn bd-btn-primary">
                  {savingReview ? 'กำลังบันทึก…' : 'ส่งรีวิว'}
                </button>
              </div>
            </form>
          </div>

          {/* ---- รายการรีวิว ---- */}
          <div style={{ marginTop: 16 }}>
            <h3 style={{ margin: '0 0 8px' }}>รีวิวล่าสุด</h3>
            {reviews.length === 0 && <div className="bd-meta">ยังไม่มีรีวิว ลองเป็นคนแรก!</div>}
            <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: 12 }}>
              {reviews.map((rv) => (
                <li key={rv._id} className="bd-review-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Stars value={rv.rating} size={16} />
                      <strong>{rv.user?.name || rv.user?.email || 'ผู้ใช้'}</strong>
                    </div>
                    <small style={{ opacity: .65 }}>
                      {rv.createdAt ? new Date(rv.createdAt).toLocaleString() : ''}
                    </small>
                  </div>
                  {rv.comment && (
                    <p style={{ margin: '8px 0 0 0', whiteSpace: 'pre-wrap' }}>{rv.comment}</p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Modal ล็อกอินก่อนสั่งซื้อ */}
      {showAuthModal && (
        <>
          <div
            onClick={() => setShowAuthModal(false)}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,.35)', backdropFilter: 'blur(1px)'
            }}
          />
          <div
            style={{
              position: 'fixed', inset: 0, display: 'grid', placeItems: 'center', pointerEvents: 'none'
            }}
          >
            <div className="bd-card" style={{ width: 440, maxWidth: '92vw', padding: 18, pointerEvents: 'auto' }}>
              <h3 style={{ marginTop: 0 }}>ต้องล็อกอินก่อนสั่งซื้อ</h3>
              <p className="bd-meta" style={{ marginTop: 6 }}>
                โปรดเข้าสู่ระบบ หรือสมัครสมาชิกใหม่เพื่อดำเนินการสั่งซื้อ
              </p>
              <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                <button
                  className="bd-btn bd-btn-gray"
                  onClick={() => nav('/login', { replace: true, state: { next: '/checkout' } })}
                >
                  เข้าสู่ระบบ
                </button>
                <button
                  className="bd-btn bd-btn-primary"
                  onClick={() => nav('/register', { replace: true, state: { next: '/checkout' } })}
                >
                  สมัครสมาชิก
                </button>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                <button className="bd-btn bd-btn-gray" onClick={() => setShowAuthModal(false)}>ปิด</button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
