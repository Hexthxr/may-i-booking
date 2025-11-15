// frontend/src/pages/AdminDashboard.jsx
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
  return (
    <div className="container" style={{ margin: '24px auto' }}>
      <h2>Admin</h2>
      <nav
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 12,
          marginTop: 12,
        }}
      >
        <Link className="btn" to="/admin/books">
          จัดการหนังสือ
        </Link>
        <Link className="btn" to="/admin/orders">
          ดูออเดอร์
        </Link>
        <Link className="btn secondary" to="/admin/users">
          ดูบัญชีผู้ใช้ทั้งหมด
        </Link>
      </nav>
    </div>
  );
}
