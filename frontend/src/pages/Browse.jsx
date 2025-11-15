// frontend/src/pages/Browse.jsx
import { useEffect, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import api from '../api';
import BookCard from '../components/BookCard';
import CategoryScroller from '../components/CategoryScroller';

const ALLOWED_CATEGORIES = [
  'การเรียน',
  'การเงินการลงทุน',
  'มังงะ',
  'นิยาย',
  'อาหารเเละสุขภาพ',
];

export default function Browse() {
  const location = useLocation();
  const urlParams = useParams(); // รองรับ /browse/:category ด้วย

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // อ่าน category จาก query string เช่น /browse?category=มังงะ
  const search = new URLSearchParams(location.search);
  const queryCategory = search.get('category') || '';

  // จาก /browse/:category (ถ้ามีใช้รูปแบบนี้)
  const paramCategory = urlParams.category || '';

  // เลือกหมวดจาก param ก่อน ถ้าไม่มีค่อยดู query
  let rawCategory = paramCategory || queryCategory || 'ทั้งหมด';

  // แปลงให้เข้ากับ ALLOWED_CATEGORIES
  let selectedCategory = null;
  if (rawCategory && rawCategory !== 'ทั้งหมด') {
    if (ALLOWED_CATEGORIES.includes(rawCategory)) {
      selectedCategory = rawCategory;
    } else {
      // ถ้าค่าแปลก ๆ ไม่ตรงกับ 5 หมวด → ถือว่าเป็น "ทั้งหมด"
      selectedCategory = null;
      rawCategory = 'ทั้งหมด';
    }
  }

  useEffect(() => {
    async function fetchBooks() {
      setLoading(true);
      try {
        const query = { limit: 200 };

        if (selectedCategory) {
          query.category = selectedCategory;
        }

        const res = await api.get('/books', { params: query });
        setItems(res.data || []);
      } catch (err) {
        console.error('โหลดหนังสือไม่สำเร็จ', err);
        setItems([]);
      } finally {
        setLoading(false);
      }
    }

    fetchBooks();
  }, [selectedCategory, rawCategory]);

  return (
    <>
      {/* แถบหมวดหมู่ด้านบน */}
      <CategoryScroller />

      <div className="container" style={{ margin: '18px auto' }}>
        <h2 style={{ margin: '6px 0 12px 0' }}>
          หมวด: {rawCategory || 'ทั้งหมด'}
        </h2>

        {loading ? (
          <div>กำลังโหลด...</div>
        ) : items.length > 0 ? (
          <div className="grid">
            {items.map((b) => (
              <BookCard key={b._id} book={b} />
            ))}
          </div>
        ) : (
          <div>ยังไม่มีหนังสือในหมวดนี้</div>
        )}
      </div>
    </>
  );
}
