import { useEffect, useState } from 'react';
import api from '../api';
import CategorySection from '../components/CategorySection';

const CATS = ['การเงินการลงทุน','มังงะ','นิยาย','อาหารเเละสุขภาพ','การเรียน'];

export default function Home(){
  const [data, setData] = useState({});
  useEffect(()=>{
    (async ()=>{
      const result = {};
      for (const c of CATS){
        const res = await api.get('/books', { params: { category: c, limit: 5 }});
        result[c] = res.data;
      }
      setData(result);
    })();
  }, []);

  return (
    <main>
      <section className="hero">
        <div className="container">
          <h1>ยินดีต้อนรับสู่ May i Booking</h1>
        </div>
      </section>
      {CATS.map(c => <CategorySection key={c} title={c} items={data[c] || []} />)}
    </main>
  )
}

// สมมติ categories มีครบทุกหมวด
// const ordered = [
//   ...favorites.filter(cat=>categories.includes(cat)),
//   ...categories.filter(cat=>!favorites.includes(cat))
// ];
