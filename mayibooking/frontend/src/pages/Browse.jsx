// import { useEffect, useState } from 'react';
// import { useParams } from 'react-router-dom';
// import api from '../api';
// import CategorySidebar from '../components/CategorySidebar';
// import BookCard from '../components/BookCard';

// export default function Browse(){
//   const { name } = useParams();           // ชื่อหมวดจาก URL
//   const [items, setItems] = useState([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(()=>{
//     setLoading(true);
//     (async ()=>{
//       const res = await api.get('/books', { params: { category: name, limit: 200 }});
//       setItems(res.data);
//       setLoading(false);
//     })();
//   }, [name]);

//   return (
//     <div className="container" style={{margin:'18px auto'}}>
//       <div style={{display:'grid',gridTemplateColumns:'260px 1fr', gap:16}}>
//         <CategorySidebar />
//         <main>
//           <h2 style={{margin:'6px 0 12px 0'}}>{name || 'ทั้งหมด'}</h2>
//           {loading ? (
//             <div>กำลังโหลด...</div>
//           ) : (
//             <div className="grid">
//               {items.map(b => <BookCard key={b._id} book={b} />)}
//               {items.length === 0 && <div>ยังไม่มีหนังสือในหมวดนี้</div>}
//             </div>
//           )}
//         </main>
//       </div>
//     </div>
//   )
// }

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api';
import BookCard from '../components/BookCard';

export default function Browse(){
  const { name } = useParams();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    setLoading(true);
    (async ()=>{
      const res = await api.get('/books', { params: { category: name, limit: 200 }});
      setItems(res.data);
      setLoading(false);
    })();
  }, [name]);

  return (
    <div className="container" style={{margin:'18px auto'}}>
      <h2 style={{margin:'6px 0 12px 0'}}>หมวด: {name}</h2>
      {loading ? <div>กำลังโหลด...</div> : (
        <div className="grid">
          {items.map(b => <BookCard key={b._id} book={b} />)}
          {items.length === 0 && <div>ยังไม่มีหนังสือในหมวดนี้</div>}
        </div>
      )}
    </div>
  );
}
