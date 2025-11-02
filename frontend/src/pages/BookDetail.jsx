// frontend/src/pages/BookDetail.jsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api, { apiBase } from '../api';
import { useAuth } from '../context/AuthContext';
import { addToLocalCart, addServerCart } from '../utils/cart';

export default function BookDetail() {
  const { id } = useParams();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const nav = useNavigate();

  // โมดอลบังคับล็อกอิน
  const [showAuthModal, setShowAuthModal] = useState(false);
  // ป้องกันกดซ้ำตอนเพิ่มตะกร้า
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get(`/books/${id}`);
        setBook(res.data);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return <div className="container" style={{ margin: '24px auto' }}>Loading...</div>;
  }
  if (!book) {
    return <div className="container" style={{ margin: '24px auto' }}>ไม่พบบุ๊คนี้</div>;
  }

  // ไปเช็คเอาท์ (สมาชิกเท่านั้น)
  const purchase = () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    nav('/checkout', {
      state: {
        from: `/books/${book._id}`,
        items: [{ bookId: book._id, title: book.title, price: Number(book.price || 0), qty: 1 }],
      },
    });
  };

  // เพิ่มลงตะกร้า (ไม่ต้องล็อกอิน)
  const addCart = async () => {
    if (adding) return;
    setAdding(true);
    try {
     const item = {
        bookId: book._id,
        title: book.title,
        price: Number(book.price || 0),
        qty: 1,
        coverUrl: `${apiBase()}/books/${book._id}/cover`,
      };
      if (user) {
        await addServerCart([item]);
      window.dispatchEvent(new Event('mib:cart:update'));          // ✅ ไป MongoDB
      } else {
        addToLocalCart([item]);               // ✅ ยังไม่ล็อกอิน → localStorage
      }
      if (confirm('เพิ่มลงตะกร้าแล้ว\n\nไปที่ตะกร้าเลยไหม?')) {
        nav('/cart');
      }
    } finally {
      setAdding(false);
    }
  };

  const coverSrc = `${apiBase()}/books/${book._id}/cover?v=${encodeURIComponent(book.updatedAt || '')}`;

  return (
    <div className="container" style={{ margin: '24px auto', position: 'relative' }}>
      {/* ---------- Book layout ---------- */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24 }}>
        <img
          src={coverSrc}
          alt={book.title}
          style={{ width: '100%', borderRadius: 16 }}
          onError={(e) => { e.currentTarget.src = 'https://placehold.co/600x800?text=No+Cover'; }}
        />
        <div>
          <div className="badge">{book.category || book.categories?.[0] || 'ทั่วไป'}</div>
          <h1 style={{ margin: '8px 0' }}>{book.title}</h1>

          <div style={{ fontSize: 18, fontWeight: 800, margin: '6px 0' }}>
            ราคา: ฿{Number(book.price ?? 0).toLocaleString('th-TH')}
          </div>

          <div>ผู้เขียน: {book.authors?.join(', ') || 'ไม่ระบุ'}</div>
          <div>สำนักพิมพ์: {book.publisher || '-'}</div>
          <div>ภาษา: {book.language || '-'}</div>
          <div>จำนวนหน้า: {book.pages || '-'}</div>
          <div>ปีที่พิมพ์: {book.year || '-'}</div>

          <p style={{ marginTop: 12, whiteSpace: 'pre-wrap' }}>
            {book.description || '-'}
          </p>

          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button className="btn secondary" onClick={purchase}>
              สั่งซื้อ (สมาชิกเท่านั้น)
            </button>
            <button className="btn" onClick={addCart} disabled={adding}>
              {adding ? 'กำลังเพิ่ม…' : 'เพิ่มลงตะกร้า'}
            </button>
          </div>
        </div>
      </div>

      {/* ---------- Auth Required Modal ---------- */}
      {showAuthModal && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setShowAuthModal(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.4)',
              backdropFilter: 'blur(2px)',
              zIndex: 50,
              animation: 'fadeIn 150ms ease-out',
            }}
          />
          {/* Card */}
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-title"
            style={{
              position: 'fixed',
              inset: 0,
              display: 'grid',
              placeItems: 'center',
              zIndex: 60,
            }}
          >
            <div
              style={{
                width: 'min(92vw, 480px)',
                background: '#fff',
                borderRadius: 16,
                boxShadow: '0 16px 30px rgba(0,0,0,0.18)',
                overflow: 'hidden',
                transform: 'translateY(8px)',
                animation: 'popIn 180ms ease-out',
              }}
            >
              <div
                style={{
                  background: 'linear-gradient(135deg, #d4fc79, #96e6a1)',
                  padding: '16px 20px',
                }}
              >
                <h3 id="auth-title" style={{ margin: 0, color: '#1b5e20' }}>
                  จำกัดสิทธิ์เฉพาะสมาชิก
                </h3>
                <p style={{ margin: '6px 0 0', color: '#2e7d32' }}>
                  กรุณาเข้าสู่ระบบก่อนสั่งซื้อหนังสือเล่มนี้
                </p>
              </div>

              <div style={{ padding: 20 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
                  <div
                    aria-hidden
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: '#e8f5e9',
                      display: 'grid',
                      placeItems: 'center',
                      fontSize: 22,
                    }}
                  >
                    🔒
                  </div>
                  <div>
                    <div style={{ fontWeight: 700 }}>ต้องเข้าสู่ระบบเพื่อดำเนินการสั่งซื้อ</div>
                    <div style={{ color: '#666' }}>
                      บัญชีสมาชิกช่วยให้ติดตามคำสั่งซื้อ และรับคูปองส่วนลดได้ง่ายขึ้น
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12 }}>
                  <button
                    onClick={() =>
                      nav('/login', { replace: true, state: { next: '/checkout' } })
                    }
                    style={{
                      padding: '12px 14px',
                      borderRadius: 10,
                      border: '1px solid #2e7d32',
                      background: '#fff',
                      color: '#2e7d32',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    เข้าสู่ระบบ
                  </button>
                  <button
                    onClick={() =>
                      nav('/register', { replace: true, state: { next: '/checkout' } })
                    }
                    style={{
                      padding: '12px 14px',
                      borderRadius: 10,
                      border: 'none',
                      background: '#2e7d32',
                      color: '#fff',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    สมัครสมาชิก
                  </button>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }}>
                  <span style={{ fontSize: 12, color: '#777' }}>
                    มีบัญชีแล้ว? เข้าสู่ระบบเพื่อสั่งซื้อได้ทันที
                  </span>
                  <button
                    onClick={() => setShowAuthModal(false)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#888',
                      cursor: 'pointer',
                      fontSize: 14,
                    }}
                    aria-label="ปิดหน้าต่าง"
                  >
                    ปิด
                  </button>
                </div>
              </div>
            </div>
          </div>

          <style>{`
            @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
            @keyframes popIn {
              from { opacity: 0; transform: translateY(12px) scale(0.98) }
              to { opacity: 1; transform: translateY(8px) scale(1) }
            }
          `}</style>
        </>
      )}
    </div>
  );
}
