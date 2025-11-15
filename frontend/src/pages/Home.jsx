// frontend/src/pages/Home.jsx
import { useEffect, useState } from 'react';
import api, { apiBase } from '../api';
import CategorySection from '../components/CategorySection';
import CategoryFeatured from '../components/CategoryFeatured';
import CategoryScroller from '../components/CategoryScroller';

import '../styles/home.css';

const CATS = ['การเรียน', 'มังงะ', 'การเงินการลงทุน', 'นิยาย', 'อาหารเเละสุขภาพ'];

export default function Home() {
  const [data, setData] = useState({});
  const [topRated, setTopRated] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [loading, setLoading] = useState(true);

  const base = apiBase();

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const { data: books } = await api.get('/books', { params: { limit: 300 } });
        const all = Array.isArray(books) ? books : [];

        const byCat = {};
        CATS.forEach((c) => {
          byCat[c] = all.filter((b) => b.category === c);
        });

        const ratingSorted = [...all].sort((a, b) => {
          const ar = a.avgRating || 0;
          const br = b.avgRating || 0;
          if (br !== ar) return br - ar;
          const ac = a.ratingCount || 0;
          const bc = b.ratingCount || 0;
          return bc - ac;
        });

        const newestSorted = [...all].sort((a, b) => {
          const at = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const bt = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return bt - at;
        });

        setTopRated(ratingSorted.slice(0, 3));
        setBestSellers(newestSorted.slice(0, 3));
        setData(byCat);
      } catch (err) {
        console.error('โหลดหนังสือหน้าแรกไม่สำเร็จ', err);
        setData({});
        setTopRated([]);
        setBestSellers([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ใช้หนังสือจาก Best Sellers ถ้ามี ไม่งั้นใช้ Top Rated
  const heroBooksSource = bestSellers && bestSellers.length ? bestSellers : topRated;
  const heroBooks = heroBooksSource.slice(0, 3);
  const hasHeroBooks = heroBooks.length > 0;

  return (
    <main className="home-page">
      {/* ---------------- HERO ---------------- */}
      <section className="hero">
        <div className="container heroPro">
          {/* ด้านซ้าย: ข้อความ + ปุ่ม */}
          <div className="heroPro-left">
            <div className="heroPro-badge">Online Bookstore Platform</div>
            <h1 className="heroPro-title">May i Booking</h1>
            <p className="heroPro-sub">
              เลือกหนังสือที่ใช่สำหรับคุณ ทั้งนิยาย มังงะ และหนังสือสายเรียน
              ในที่เดียวแบบมืออาชีพ
            </p>

            <div className="heroPro-actions">
              <a href="#categories" className="heroPro-btn heroPro-btn-primary">
                เริ่มเลือกตามหมวดหมู่
              </a>
              <a href="/category/ทั้งหมด" className="heroPro-btn heroPro-btn-ghost">
                ดูหนังสือทั้งหมด
              </a>
            </div>

            <div className="heroPro-stats">
              <div>
                <span className="heroPro-stat-number">5+</span>
                <span className="heroPro-stat-label">หมวดหมู่</span>
              </div>
              <div>
                <span className="heroPro-stat-number">100+</span>
                <span className="heroPro-stat-label">เล่มในระบบ</span>
              </div>
              <div>
                <span className="heroPro-stat-number">4.8</span>
                <span className="heroPro-stat-label">คะแนนรีวิวเฉลี่ย</span>
              </div>
            </div>
          </div>

          {/* ด้านขวา: การ์ดหนังสือกำลังมาแรง */}
          <div className="heroPro-right">
            <div className="heroPro-card">
              <div className="heroPro-card-header">
                <span>กำลังมาแรง</span>
                <span className="heroPro-dot" />
              </div>

              <ul className="heroPro-book-list">
                {hasHeroBooks ? (
                  heroBooks.map((b) => {
                    const src = `${base}/books/${b._id}/cover?v=${encodeURIComponent(
                      b.updatedAt || ''
                    )}`;
                    return (
                      <li key={b._id}>
                        <div className="heroPro-book-coverWrap">
                          <img
                            src={src}
                            alt={b.title}
                            className="heroPro-book-cover"
                            loading="lazy"
                            onError={(e) => {
                              e.currentTarget.src =
                                'https://placehold.co/200x300?text=No+Cover';
                            }}
                          />
                        </div>
                        <div className="heroPro-book-meta">
                          <div className="heroPro-book-title">{b.title}</div>
                          <div className="heroPro-book-sub">
                            {b.category || 'หมวดหมู่ไม่ระบุ'}
                            {Array.isArray(b.authors) && b.authors.length
                              ? ` • ${b.authors.join(', ')}`
                              : ''}
                          </div>
                        </div>
                        <div className="heroPro-book-tag">
                          ฿{Number(b.price ?? 0).toLocaleString('th-TH')}
                        </div>
                      </li>
                    );
                  })
                ) : (
                  <>
                    <li>
                      <div className="heroPro-book-thumb heroPro-book-thumb-red" />
                      <div className="heroPro-book-meta">
                        <div className="heroPro-book-title">Attack On Titan</div>
                        <div className="heroPro-book-sub">มังงะ • แอ็กชัน</div>
                      </div>
                      <div className="heroPro-book-tag">฿89</div>
                    </li>
                    <li>
                      <div className="heroPro-book-thumb heroPro-book-thumb-blue" />
                      <div className="heroPro-book-meta">
                        <div className="heroPro-book-title">Sakamoto Days</div>
                        <div className="heroPro-book-sub">มังงะ • คอมเมดี้</div>
                      </div>
                      <div className="heroPro-book-tag">฿79</div>
                    </li>
                    <li>
                      <div className="heroPro-book-thumb heroPro-book-thumb-green" />
                      <div className="heroPro-book-meta">
                        <div className="heroPro-book-title">เรียนให้ได้เรื่อง</div>
                        <div className="heroPro-book-sub">การเรียน • พัฒนาตัวเอง</div>
                      </div>
                      <div className="heroPro-book-tag">฿259</div>
                    </li>
                  </>
                )}
              </ul>

              <div className="heroPro-floating-pill">
                ⭐ เล่มแนะนำสำหรับคุณ ถูกใจสายอ่านแน่นอน
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* แถบเลื่อนหมวดด้านล่าง HERO */}
      <CategoryScroller />

      {/* กล่องหนังสือยอดนิยม / ขายดีที่สุด */}
      <section className="home-featured-section">
        <div className="container featured-row">
          <CategoryFeatured title="หนังสือยอดนิยม" icon="⭐" items={topRated} />
          <CategoryFeatured title="หนังสือขายดีที่สุด" icon="🔥" items={bestSellers} />
        </div>
      </section>

      {/* หมวดหมู่ด้านล่าง */}
      <section id="categories" className="home-content">
        <div className="container">
          {CATS.map((c) => (
            <CategorySection key={c} title={c} items={data[c] || []} />
          ))}
        </div>
      </section>
    </main>
  );
}
