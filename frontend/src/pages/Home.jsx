
// import { useEffect, useState } from 'react';
// import api from '../api';
// import CategorySection from '../components/CategorySection';
// import '../styles/home.css';   // ใช้สไตล์ที่อยู่ในโฟลเดอร์ styles

// const CATS = ['การเงินการลงทุน','มังงะ','นิยาย','อาหารเเละสุขภาพ','การเรียน'];

// export default function Home(){
//   const [data, setData] = useState({});

//   useEffect(()=>{
//     (async ()=>{
//       const result = {};
//       for (const c of CATS){
//         const res = await api.get('/books', { params: { category: c, limit: 5 }});
//         result[c] = res.data;
//       }
//       setData(result);
//     })();
//   }, []);

//   return (
//     <main className="home-page">
//       <section className="hero">
//         <div className="container">
//           {/* กล่องไฮไลท์ครอบ h1+p */}
//           <div className="hero-highlight">
//             <h1>ยินดีต้อนรับสู่ May i Booking</h1>
//             <p className="hero-sub">เลือกอ่านได้ตามใจชอบ — หนังสือใหม่อัปเดตตลอด</p>
//           </div>
//         </div>
//       </section>

//       <div className="home-content container">
//         {CATS.map(c => (
//           <CategorySection key={c} title={c} items={data[c] || []} />
//         ))}
//       </div>
//     </main>
//   );
// }

import { useEffect, useState } from 'react';
import api from '../api';
import CategorySection from '../components/CategorySection';
import '../styles/home.css';   // ใช้สไตล์จากโฟลเดอร์ styles

const CATS = ['การเงินการลงทุน','มังงะ','นิยาย','อาหารเเละสุขภาพ','การเรียน'];

export default function Home() {
  const [data, setData] = useState({});

  useEffect(() => {
    (async () => {
      const result = {};
      for (const c of CATS) {
        const res = await api.get('/books', { params: { category: c, limit: 5 } });
        result[c] = res.data;
      }
      setData(result);
    })();
  }, []);

  return (
    <main className="home-page">
      <section className="hero">
        <div className="container">
          {/* กล่องไฮไลท์ครอบ h1+p */}
          <div className="hero-highlight">
            <h1>ยินดีต้อนรับสู่ May i Booking</h1>
            <p className="hero-sub">เลือกอ่านได้ตามใจชอบ — หนังสือใหม่อัปเดตตลอด</p>
          </div>
        </div>
      </section>

      <div className="home-content container">
        {CATS.map(c => (
          <CategorySection key={c} title={c} items={data[c] || []} />
        ))}
      </div>
    </main>
  );
}
