
// import { Navigate, useLocation } from 'react-router-dom';

// export default function ProtectedRoute({ role, children }) {
//   // สมมติใช้ localStorage เก็บ token และ user
//   const token = localStorage.getItem('token');
//   const user = JSON.parse(localStorage.getItem('user') || 'null');
//   const loc = useLocation();

//   if (!token) {
//     return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
//   }
//   if (role && user?.role !== role) {
//     return <Navigate to="/" replace />;
//   }
//   return children;
// }

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { token } = useAuth();          // ปรับตาม context ของโปรเจกต์
  const location = useLocation();
  if (!token) {
    return <Navigate to="/login" replace state={{ next: '/checkout' }} />;
  }
  return children;
}
