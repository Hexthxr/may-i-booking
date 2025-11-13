import { Link } from 'react-router-dom';

export default function AdminDashboard(){
  return (
    <div className="container" style={{margin:'24px auto'}}>
      <h2>Admin</h2>
      <nav style={{display:'flex',gap:12,marginTop:12}}>
        <Link className="btn" to="/admin/books">จัดการหนังสือ</Link>
      </nav>
    </div>
  )
}