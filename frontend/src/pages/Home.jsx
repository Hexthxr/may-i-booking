// frontend/src/pages/Home.jsx
import { useEffect, useState } from 'react';
import api from '../api';
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

  return (
    <main className="home-page">
      {/* 🎨 HERO PRO VERSION */}
      <section className="hero">
        <div className="container heroPro">
          {/* ด้านซ้าย: แบรนด์ + CTA */}
          <div className="heroPro-left">
            <div className="heroPro-badge">Online Bookstore Platform</div>
            <h1 className="heroPro-title">
              May i Booking
            </h1>
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

          {/* ด้านขวา: การ์ด preview ชั้นหนังสือแบบกลาส */}
          <div className="heroPro-right">
            <div className="heroPro-card">
              <div className="heroPro-card-header">
                <span>กำลังมาแรง</span>
                <span className="heroPro-dot" />
              </div>

              <ul className="heroPro-book-list">
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
              </ul>

              <div className="heroPro-floating-pill">
                ⭐ เล่มแนะนำสำหรับคุณ ถูกใจสายอ่านแน่นอน
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* แถบเลื่อนหมวด + ปุ่มหนังสือทั้งหมด */}
      <CategoryScroller />

      {/* แถวหนังสือยอดนิยม / หนังสือขายดีที่สุด */}
      <div className="featured-row container">
        <CategoryFeatured title="หนังสือยอดนิยม" icon="⭐" items={topRated} />
        <CategoryFeatured title="หนังสือขายดีที่สุด" icon="🔥" items={bestSellers} />
      </div>

      {/* หมวดต่าง ๆ ด้านล่าง */}
      <div id="categories" className="home-content container">
        {CATS.map((c) => (
          <CategorySection key={c} title={c} items={data[c] || []} />
        ))}
      </div>
    </main>
  );
}
