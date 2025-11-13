// frontend/src/components/CategorySection.jsx
import { Link } from 'react-router-dom';
import { useState } from 'react';
import BookCard from './BookCard';
import '../styles/categorySectionHeader.css';

const PAGE_SIZE = 4;

export default function CategorySection({ title, items = [] }) {
  if (!items || items.length === 0) return null;

  const [start, setStart] = useState(0);
  const catPath = `/category/${encodeURIComponent(title)}`;

  const maxStart = Math.max(0, items.length - PAGE_SIZE);
  const canPrev = start > 0;
  const canNext = start < maxStart;

  const visible = items.slice(start, start + PAGE_SIZE); // ✅ แสดงทีละ 4 เสมอ

  const goPrev = () => {
    if (!canPrev) return;
    setStart((s) => Math.max(0, s - PAGE_SIZE));
  };

  const goNext = () => {
    if (!canNext) return;
    setStart((s) => Math.min(maxStart, s + PAGE_SIZE));
  };

  return (
    <section className="home-section">
      {/* หัวข้อ + ปุ่มดูทั้งหมดด้านขวา */}
      <div className="home-cat-header">
        <h2 className="home-section-title">{title}</h2>
        <Link to={catPath} className="home-cat-more">
          ดูทั้งหมด
        </Link>
      </div>

      {/* คารูเซล 4 ใบ + ปุ่มเลื่อนซ้าย/ขวา */}
      <div className="home-carousel">
        {canPrev && (
          <button
            type="button"
            className="home-carousel-arrow home-carousel-arrow-left"
            onClick={goPrev}
            aria-label="เลื่อนไปชุดก่อนหน้า"
          >
            ‹
          </button>
        )}

        <div className="grid">
          {visible.map((b) => (
            <BookCard key={b._id} book={b} />
          ))}
        </div>

        {canNext && (
          <button
            type="button"
            className="home-carousel-arrow home-carousel-arrow-right"
            onClick={goNext}
            aria-label="เลื่อนไปชุดถัดไป"
          >
            ›
          </button>
        )}
      </div>
    </section>
  );
}
