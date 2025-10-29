import { useEffect, useState } from 'react';
import api from '../api';
import styles from '../styles/favorites.module.css';

const categories = [
  'การเงินการลงทุน',
  'การ์ตูน/มังงะ',
  'นวนิยาย',
  'อาหารและสุขภาพ',
  'การศึกษา'
];

export default function Favorites(){
  const [favorites, setFavorites] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(()=>{
    (async ()=>{
      const { data } = await api.get('/users/me/favorites');
      setFavorites(data.favorites);
    })();
  },[]);

  const toggle = (cat)=>{
    setFavorites(prev =>
      prev.includes(cat) ? prev.filter(x=>x!==cat) : [...prev, cat]
    );
  };

  const save = async ()=>{
    setSaving(true);
    try{
      await api.put('/users/me/favorites', { favorites });
      alert('บันทึกความชื่นชอบเรียบร้อย');
    } finally { setSaving(false); }
  };

  return (
    <div className={styles.wrap}>
      <h1 className={styles.title}>ความชื่นชอบ</h1>
      <p className={styles.desc}>เลือกหมวดที่คุณสนใจมากเป็นพิเศษ ระบบจะแสดงหมวดนี้ก่อนหมวดอื่น</p>

      <div className={styles.grid}>
        {categories.map(cat=>(
          <button
            key={cat}
            className={`${styles.cat} ${favorites.includes(cat) ? styles.active : ''}`}
            onClick={()=>toggle(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className={styles.actions}>
        <button className={styles.btnPrimary} onClick={save} disabled={saving}>
          {saving ? 'กำลังบันทึก…' : 'บันทึก'}
        </button>
      </div>
    </div>
  );
}
