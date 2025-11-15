// frontend/src/components/ProtectedRoute.jsx
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ role, children }) {
  const { token, user } = useAuth();
  const location = useLocation();

  // ถ้ายังไม่ได้ login → ส่งไปหน้า login พร้อม next = path ปัจจุบัน
  if (!token) {
    const nextPath = location.pathname + location.search;
    return <Navigate to="/login" replace state={{ next: nextPath }} />;
  }

  // ถ้ามีการระบุ role และ user.role ไม่ตรง → เด้งกลับหน้าแรก
  if (role && user?.role !== role) {
    return <Navigate to="/" replace />;
  }

  return children;
}
