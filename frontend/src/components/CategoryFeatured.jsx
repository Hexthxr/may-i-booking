// frontend/src/components/CategoryFeatured.jsx
import { Link } from "react-router-dom";
import { apiBase } from "../api";
import "../styles/featuredSection.css";

export default function CategoryFeatured({ title, icon, items = [] }) {
  const base = apiBase(); // ใช้ base URL เดียวกับ BookCard

  return (
    <section className="featured-box">
      <div className="featured-header">
        <span className="featured-icon">{icon}</span>
        <h2>{title}</h2>
      </div>

      <div className="featured-list">
        {items.map((b, idx) => (
          <Link
            key={b._id}
            // ❗ ใช้ path ให้ตรงกับใน App.jsx → /book/:id
            to={`/book/${b._id}`}
            className="featured-item"
          >
            <div className="rank-circle">{idx + 1}</div>

            <img
              src={`${base}/books/${b._id}/cover?v=${encodeURIComponent(
                b.updatedAt || ""
              )}`}
              className="featured-cover"
              alt={b.title}
              loading="lazy"
              onError={(e) => {
                e.currentTarget.src =
                  "https://placehold.co/600x800?text=No+Cover";
              }}
            />

            <div className="featured-info">
              <h3 className="featured-title">{b.title}</h3>
              <p className="featured-author">
                โดย{" "}
                {Array.isArray(b.authors)
                  ? b.authors.join(", ")
                  : b.authors || "ไม่ทราบผู้เขียน"}
              </p>
              <p className="featured-price">
                ฿{Number(b.price ?? 0).toLocaleString("th-TH")}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
