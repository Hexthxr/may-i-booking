// frontend/src/pages/AdminUsers.jsx
import { useEffect, useState } from 'react';
import api from '../api';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError('');
        const res = await api.get('/users');
        const list = res.data?.users || [];
        setUsers(list);
      } catch (err) {
        console.error(err);
        setError('โหลดข้อมูลผู้ใช้ไม่สำเร็จ');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="container" style={{ margin: '24px auto' }}>
      <h2>บัญชีผู้ใช้ทั้งหมด</h2>

      {loading && <p>กำลังโหลดข้อมูล...</p>}
      {error && !loading && (
        <p style={{ color: 'red', marginTop: 8 }}>{error}</p>
      )}

      {!loading && !error && users.length === 0 && (
        <p>ยังไม่มีผู้ใช้ในระบบ</p>
      )}

      {!loading && !error && users.length > 0 && (
        <div
          style={{
            marginTop: 16,
            overflowX: 'auto',
            borderRadius: 12,
            border: '1px solid #e5e7eb',
            background: '#ffffff',
          }}
        >
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: 14,
            }}
          >
            <thead>
              <tr style={{ background: '#f9fafb' }}>
                <th style={thStyle}>Username</th>
                <th style={thStyle}>ชื่อ - นามสกุล</th>
                <th style={thStyle}>อีเมล</th>
                <th style={thStyle}>สิทธิ์</th>
                <th style={thStyle}>สร้างเมื่อ</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id} style={{ borderTop: '1px solid #f1f5f9' }}>
                  <td style={tdStyle}>{u.username}</td>
                  <td style={tdStyle}>{u.fullname || '-'}</td>
                  <td style={tdStyle}>{u.email}</td>
                  <td style={tdStyle}>
                    <span
                      className="badge"
                      style={{
                        backgroundColor:
                          u.role === 'admin' ? '#dcfce7' : '#e0f2fe',
                        color: u.role === 'admin' ? '#15803d' : '#1d4ed8',
                      }}
                    >
                      {u.role === 'admin' ? 'Admin' : 'User'}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    {u.createdAt
                      ? new Date(u.createdAt).toLocaleString('th-TH')
                      : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const thStyle = {
  textAlign: 'left',
  padding: '10px 12px',
  fontWeight: 600,
  borderBottom: '1px solid #e5e7eb',
  whiteSpace: 'nowrap',
};

const tdStyle = {
  padding: '8px 12px',
  verticalAlign: 'top',
  whiteSpace: 'nowrap',
};
