// frontend/src/pages/AdminBooks.jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { apiBase } from '../api';

export default function AdminBooks() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      setLoading(true);
      const res = await api.get('/books/admin');
      setItems(res.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const toggleHidden = async (book) => {
    const targetHidden = !book.isHidden;

    const msg = targetHidden
      ? 'ต้องการซ่อนหนังสือเล่มนี้ไม่ให้แสดงในหน้าร้านสำหรับผู้ใช้ทั่วไปหรือไม่?'
      : 'ต้องการเลิกซ่อนหนังสือเล่มนี้ให้กลับมาแสดงในหน้าร้านหรือไม่?';

    if (!window.confirm(msg)) return;

    await api.patch(`/books/${book._id}/visibility`, {
      hidden: targetHidden,
    });

    await refresh();
  };

  const coverSrc = (b) =>
    `${apiBase()}/books/${b._id}/cover?v=${encodeURIComponent(
      b.updatedAt || ''
    )}`;

  return (
    <div className="container" style={{ margin: '16px auto' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
          gap: 8,
          flexWrap: 'wrap',
        }}
      >
        <h2 style={{ fontSize: 20 }}>จัดการหนังสือ</h2>
        <Link className="btn" to="/admin/books/new">
          + เพิ่มหนังสือใหม่
        </Link>
      </div>

      {loading && <p>กำลังโหลดข้อมูล...</p>}

      {!loading && items.length === 0 && <p>ยังไม่มีหนังสือในระบบ</p>}

      {!loading && items.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))',
            gap: 12,
          }}
        >
          {items.map((b) => (
            <article
              key={b._id}
              className="card"
              style={{
                fontSize: 13,
                padding: 8,
              }}
            >
              <div
                style={{
                  width: '100%',
                  height: 200, // ✅ ลดความสูงให้เล็กลง
                  borderRadius: 8,
                  overflow: 'hidden',
                  marginBottom: 6,
                }}
              >
                <img
                  src={coverSrc(b)}
                  alt={b.title}
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.src =
                      'https://placehold.co/400x600?text=No+Cover';
                  }}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                  }}
                />
              </div>

              <div className="body" style={{ padding: 0 }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 4,
                    marginBottom: 4,
                  }}
                >
                  <span
                    className="badge"
                    style={{ maxWidth: '60%', fontSize: 11 }}
                  >
                    {b.category}
                  </span>
                  {typeof b.price === 'number' && (
                    <span className="badge" style={{ fontSize: 11 }}>
                      ฿{Number(b.price || 0).toLocaleString('th-TH')}
                    </span>
                  )}
                </div>

                <div
                  style={{
                    fontWeight: 600,
                    fontSize: 13,
                    marginBottom: 2,
                    lineHeight: 1.3,
                    maxHeight: 36,
                    overflow: 'hidden',
                  }}
                >
                  {b.title}
                </div>

                <div
                  style={{
                    fontSize: 11,
                    color: '#666',
                  }}
                >
                  สต๊อก: {Number(b.stock || 0)} เล่ม
                </div>

                {b.isHidden && (
                  <div style={{ marginTop: 4 }}>
                    <span
                      className="badge"
                      style={{
                        backgroundColor: '#fee2e2',
                        color: '#b91c1c',
                        fontSize: 11,
                      }}
                    >
                      ซ่อนอยู่ (ไม่แสดงหน้า Home / Browse)
                    </span>
                  </div>
                )}

                <div
                  style={{
                    display: 'flex',
                    gap: 6,
                    marginTop: 8,
                    flexWrap: 'wrap',
                  }}
                >
                  <Link
                    className="btn secondary"
                    to={`/admin/books/${b._id}`}
                    style={{ fontSize: 12, padding: '4px 8px' }}
                  >
                    แก้ไข
                  </Link>
                  <button
                    type="button"
                    className="btn"
                    onClick={() => toggleHidden(b)}
                    style={{ fontSize: 12, padding: '4px 8px' }}
                  >
                    {b.isHidden ? 'เลิกซ่อนหนังสือ' : 'ซ่อนหนังสือ'}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
