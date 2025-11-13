import { NavLink, Link } from 'react-router-dom';
import '../styles/categoryScroller.css';

const CATS = ['การเรียน','มังงะ','การเงินการลงทุน','นิยาย','อาหารเเละสุขภาพ'];

/**
 * แถบเลื่อนหมวดหนังสือ + ปุ่ม "หนังสือทั้งหมด"
 * - หมวดเป็นปุ่ม pill เลื่อนซ้ายขวาได้
 * - ปุ่ม "หนังสือทั้งหมด" อยู่ด้านขวา ไว้ดูคอลเลคชั่นรวมทุกหมวด
 */
export default function CategoryScroller(){
  return (
    <div className="catbar-wrapper">
      <div className="container catbar-inner">
        <div className="catbar-scroll">
          {CATS.map(c => (
            <NavLink
              key={c}
              to={`/category/${encodeURIComponent(c)}`}
              className={({ isActive }) =>
                'cat-pill' + (isActive ? ' cat-pill-active' : '')
              }
            >
              {c}
            </NavLink>
          ))}
        </div>

        {/* ปุ่มฝั่งตรงข้ามหมวดหนังสือ */}
        <Link to="/category/ทั้งหมด" className="cat-all-btn">
          หนังสือทั้งหมด
        </Link>
      </div>
    </div>
  );
}
