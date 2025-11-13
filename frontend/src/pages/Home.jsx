import { useEffect, useState } from 'react';
import api from '../api';
import CategorySection from '../components/CategorySection';
import CategoryFeatured from "../components/CategoryFeatured";

import '../styles/home.css';

const CATS = ['การเรียน','มังงะ','การเงินการลงทุน','นิยาย','อาหารเเละสุขภาพ'];

export default function Home() {
  const [data, setData] = useState({});
  const [topRated, setTopRated] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);

  useEffect(() => {
    (async () => {
      // โหลด Top Rated
      try {
        const r1 = await api.get('/books/top-rated');
        setTopRated(r1.data || []);
      } catch (e) {
        console.log("Top rated error", e);
      }

      // โหลด Best Sellers
      try {
        const r2 = await api.get('/books/best-sellers');
        setBestSellers(r2.data || []);
      } catch (e) {
        console.log("Best sellers error", e);
      }

      // โหลดตามหมวดเดิม
      const result = {};
      for (const c of CATS) {
        try {
          const res = await api.get('/books', { params: { category: c, limit: 5 } });
          result[c] = res.data;
        } catch {
          result[c] = [];
        }
      }
      setData(result);
    })();
  }, []);

  return (
    <main className="home-page">

  {/* ⭐⭐ แถว 2 คอลัมน์ (TopRated | BestSellers) ⭐⭐ */}
  <div className="featured-row container">
    <CategoryFeatured 
      title="หนังสือยอดนิยม"
      icon="⭐"
      items={topRated}
    />

    <CategoryFeatured 
      title="หนังสือขายดีที่สุด"
      icon="🔥"
      items={bestSellers}
    />
  </div>

  {/* หมวดตาม Category เดิม */}
  <div className="home-content container">
    {CATS.map(c => (
      <CategorySection key={c} title={c} items={data[c] || []} />
    ))}
  </div>
</main>

  );
}
