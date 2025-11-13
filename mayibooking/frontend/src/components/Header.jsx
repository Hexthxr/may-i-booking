

// import { Link, NavLink } from 'react-router-dom';
// import { useAuth } from '../context/AuthContext';
// import { useState } from 'react';
// import CategoryDrawer from './CategoryDrawer';
// import UserMenu from './UserMenu';

// export default function Header(){
//   const { user, logout } = useAuth();
//   const [openDrawer, setOpenDrawer] = useState(false);

//   return (
//     <>
//       <header style={{
//         position:'sticky', top:0, zIndex:40, background:'#fff',
//         borderBottom:'2px solid #1db95410'
//       }}>
//         <div className="container" style={{
//           display:'flex', alignItems:'center', justifyContent:'space-between', height:64
//         }}>
//           {/* โลโก้ */}
//           <Link to="/" style={{display:'flex',alignItems:'center',gap:10, textDecoration:'none'}}>
//             <div style={{ width:36,height:36,borderRadius:12,
//               background:'linear-gradient(180deg,#5be37e,#ffd54f)' }} />
//             <strong style={{fontSize:20,color:'#111'}}>May i Booking</strong>
//           </Link>

//           {/* ส่วนขวา */}
//           <div style={{display:'flex',alignItems:'center',gap:10}}>
//             <button className="btn secondary" onClick={()=>setOpenDrawer(true)}>หมวดหมู่สินค้า</button>

//             {user?.role === 'admin' && (
//               <NavLink
//                 to="/admin"
//                 style={{
//                   padding:'8px 14px',
//                   borderRadius:12,
//                   border:'2px solid #23c55e',
//                   fontWeight:700,
//                   textDecoration:'none',
//                   color:'#23c55e'
//                 }}
//               >Admin</NavLink>
//             )}

//             {!user ? (
//               <>
//                 <Link className="btn secondary" to="/login">เข้าสู่ระบบ</Link>
//                 <Link className="btn" to="/register">สมัครสมาชิก</Link>
//               </>
//             ) : (
//               // ปุ่มผู้ใช้ + เมนูดรอปดาวน์ ธีมฟ้า-เขียว
//               <UserMenu user={user} onLogout={logout} />
//             )}
//           </div>
//         </div>
//       </header>

//       {/* Drawer หมวดหมู่ */}
//       <CategoryDrawer open={openDrawer} onClose={()=>setOpenDrawer(false)} />
//     </>
//   );
// }

// import { Link, NavLink } from 'react-router-dom';
// import { useAuth } from '../context/AuthContext';
// import { useState } from 'react';
// import CategoryDrawer from './CategoryDrawer';
// import UserMenu from './UserMenu';

// export default function Header(){
//   const { user, logout } = useAuth();
//   const [openDrawer, setOpenDrawer] = useState(false);

//   const isAdmin = user?.role === 'admin';

//   return (
//     <>
//       <header style={{
//         position:'sticky', top:0, zIndex:40, background:'#fff',
//         borderBottom:'2px solid #1db95410'
//       }}>
//         <div className="container" style={{
//           display:'flex', alignItems:'center', justifyContent:'space-between', height:64
//         }}>
//           {/* โลโก้ */}
//           <Link to="/" style={{display:'flex',alignItems:'center',gap:10, textDecoration:'none'}}>
//             <div style={{
//               width:36,height:36,borderRadius:12,
//               background:'linear-gradient(180deg,#5be37e,#ffd54f)'
//             }} />
//             <strong style={{fontSize:20,color:'#111'}}>May i Booking</strong>
//           </Link>

//           {/* ส่วนขวา */}
//           <div style={{display:'flex',alignItems:'center',gap:10}}>
//             <button className="btn secondary" onClick={()=>setOpenDrawer(true)}>หมวดหมู่สินค้า</button>

//             {isAdmin ? (
//               <>
//                 <NavLink
//                   to="/admin"
//                   style={{
//                     padding:'8px 14px',
//                     borderRadius:12,
//                     border:'2px solid #23c55e',
//                     fontWeight:700,
//                     textDecoration:'none',
//                     color:'#23c55e'
//                   }}
//                 >
//                   Admin
//                 </NavLink>
//                 <button className="btn" onClick={logout}>ออกจากระบบ</button>
//               </>
//             ) : (
//               <>
//                 {!user ? (
//                   <>
//                     <Link className="btn secondary" to="/login">เข้าสู่ระบบ</Link>
//                     <Link className="btn" to="/register">สมัครสมาชิก</Link>
//                   </>
//                 ) : (
//                   <UserMenu user={user} onLogout={logout} />
//                 )}
//               </>
//             )}
//           </div>
//         </div>
//       </header>

//       {/* Drawer หมวดหมู่ */}
//       <CategoryDrawer open={openDrawer} onClose={()=>setOpenDrawer(false)} />
//     </>
//   );
// }
// frontend/src/components/Header.jsx
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';
import CategoryDrawer from './CategoryDrawer';
import UserMenu from './UserMenu';
import SearchBar from './SearchBar';
import NotificationBell from './NotificationBell'; // ⬅️ เพิ่มกระดิ่ง

const CART_KEY = 'mib:cart';

export default function Header(){
  const { user, logout } = useAuth();
  const [openDrawer, setOpenDrawer] = useState(false);
  const isAdmin = user?.role === 'admin';

  // ---------- Cart badge ----------
  const [cartCount, setCartCount] = useState(0);
  const countItems = () => {
    try {
      const arr = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
      return arr.reduce((s, it) => s + (Number(it.qty) || 1), 0);
    } catch { return 0; }
  };

  useEffect(() => {
    const update = () => setCartCount(countItems());
    update(); // first paint
    window.addEventListener('storage', update);          // cross-tab
    window.addEventListener('mib:cart:update', update);  // same-tab custom event
    return () => {
      window.removeEventListener('storage', update);
      window.removeEventListener('mib:cart:update', update);
    };
  }, []);

  return (
    <>
      <header style={{
        position:'sticky', top:0, zIndex:40, background:'#fff',
        borderBottom:'2px solid #1db95410'
      }}>
        <div className="container" style={{
          display:'grid',
          gridTemplateColumns:'auto 1fr auto',
          alignItems:'center',
          columnGap:14,
          height:64
        }}>
          {/* โลโก้ */}
          <Link to="/" style={{display:'flex',alignItems:'center',gap:10, textDecoration:'none'}}>
            <div style={{
              width:36,height:36,borderRadius:12,
              background:'linear-gradient(180deg,#5be37e,#ffd54f)'
            }} />
            <strong style={{fontSize:20,color:'#111'}}>May i Booking</strong>
          </Link>

          {/* 🔎 Search Bar ตรงกลาง */}
          <div style={{display:'flex',justifyContent:'center'}}>
            <SearchBar />
          </div>

          {/* ส่วนขวา */}
          <div style={{display:'flex',alignItems:'center',gap:10, justifySelf:'end'}}>
            {/* ปุ่มหมวดหมู่ + กระดิ่งถัดกัน */}
            <div style={{display:'flex', alignItems:'center', gap:8}}>
              <button className="btn secondary" onClick={()=>setOpenDrawer(true)}>หมวดหมู่สินค้า</button>
              <NotificationBell /> {/* ⬅️ กระดิ่งจะแสดง badge เมื่อมีการจอง */}
            </div>

            {/* 🛒 ปุ่มตะกร้า */}
            <Link
              to="/cart"
              aria-label="ตะกร้าสินค้า"
              style={{
                position:'relative',
                display:'flex',
                alignItems:'center',
                gap:8,
                padding:'9px 14px',
                borderRadius:12,
                border:'1px solid #23c55e',
                background:'#eafff3',
                color:'#1b5e20',
                fontWeight:700,
                textDecoration:'none',
              }}
            >
              <span style={{fontSize:18}}>🛒</span>
              ตะกร้า
              {cartCount > 0 && (
                <span
                  style={{
                    position:'absolute',
                    top:-6,right:-6,
                    minWidth:20,height:20,padding:'0 6px',
                    borderRadius:999,
                    background:'#ff3b30',
                    color:'#fff',
                    fontSize:12,
                    display:'grid',placeItems:'center',
                    boxShadow:'0 2px 6px rgba(0,0,0,.15)'
                  }}
                >
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Link>

            {isAdmin ? (
              <>
                <NavLink
                  to="/admin"
                  style={{
                    padding:'8px 14px',
                    borderRadius:12,
                    border:'2px solid #23c55e',
                    fontWeight:700,
                    textDecoration:'none',
                    color:'#23c55e'
                  }}
                >
                  Admin
                </NavLink>
                <button className="btn" onClick={logout}>ออกจากระบบ</button>
              </>
            ) : (
              <>
                {!user ? (
                  <>
                    <Link className="btn secondary" to="/login">เข้าสู่ระบบ</Link>
                    <Link className="btn" to="/register">สมัครสมาชิก</Link>
                  </>
                ) : (
                  <UserMenu user={user} onLogout={logout} />
                )}
              </>
            )}
          </div>
        </div>
      </header>

      {/* Drawer หมวดหมู่ */}
      <CategoryDrawer open={openDrawer} onClose={()=>setOpenDrawer(false)} />
    </>
  );
}
