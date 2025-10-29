

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

import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import CategoryDrawer from './CategoryDrawer';
import UserMenu from './UserMenu';

export default function Header(){
  const { user, logout } = useAuth();
  const [openDrawer, setOpenDrawer] = useState(false);

  const isAdmin = user?.role === 'admin';

  return (
    <>
      <header style={{
        position:'sticky', top:0, zIndex:40, background:'#fff',
        borderBottom:'2px solid #1db95410'
      }}>
        <div className="container" style={{
          display:'flex', alignItems:'center', justifyContent:'space-between', height:64
        }}>
          {/* โลโก้ */}
          <Link to="/" style={{display:'flex',alignItems:'center',gap:10, textDecoration:'none'}}>
            <div style={{
              width:36,height:36,borderRadius:12,
              background:'linear-gradient(180deg,#5be37e,#ffd54f)'
            }} />
            <strong style={{fontSize:20,color:'#111'}}>May i Booking</strong>
          </Link>

          {/* ส่วนขวา */}
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <button className="btn secondary" onClick={()=>setOpenDrawer(true)}>หมวดหมู่สินค้า</button>

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
