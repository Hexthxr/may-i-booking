// frontend/src/pages/Orders.jsx
import { useEffect, useState } from 'react';
import api from '../api';
import { Link } from 'react-router-dom';

function Badge({ children, tone='gray' }){
  const tones = {
    gray: 'bg-gray-100 text-gray-700 ring-gray-200',
    green: 'bg-green-100 text-green-700 ring-green-200',
    yellow: 'bg-yellow-100 text-yellow-800 ring-yellow-200',
    red: 'bg-rose-100 text-rose-700 ring-rose-200',
    blue: 'bg-sky-100 text-sky-700 ring-sky-200',
  };
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${tones[tone]||tones.gray}`}>{children}</span>;
}
const statusTone = (s)=> s==='paid'?'green': s==='processing'?'blue': s==='shipped'?'yellow': s==='cancelled'?'red':'gray';

export default function Orders(){
  const [orders, setOrders] = useState(null);

  useEffect(()=>{
    api.get('/orders/my').then(res => setOrders(res.data.orders || []));
  },[]);

  if(!orders) return <div className="p-6">กำลังโหลด...</div>;

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6">
      <div className="relative overflow-hidden rounded-2xl ring-1 ring-gray-200 shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-green-600 via-green-500 to-yellow-400 opacity-90" />
        <div className="relative p-6 text-white flex items-center justify-between">
          <div>
            <div className="text-xl font-semibold">คำสั่งซื้อของฉัน</div>
            <div className="opacity-90 text-sm">ติดตามสถานะล่าสุดของออเดอร์</div>
          </div>
          <Link to="/checkout" className="px-4 py-2 rounded-full ring-1 ring-white/80 text-white hover:bg-white/10">ไปเช็คเอาต์</Link>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-200 divide-y">
        {orders.length===0 && <div className="p-6 text-center text-gray-500 text-sm">ยังไม่มีคำสั่งซื้อ</div>}
        {orders.map(o => (
          <div key={o._id} className="p-5 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="text-sm font-semibold text-gray-900">เลขที่: {o._id}</div>
              <div className="text-xs text-gray-500">{new Date(o.createdAt).toLocaleString()}</div>
              <div className="mt-1 text-xs text-gray-700">
                {o.items?.slice(0,3).map((it,idx)=> (
                  <span key={idx} className="inline-block truncate max-w-[14rem] align-top">
                    {it.title} × {it.qty}{idx < (o.items.length-1) ? ', ' : ''}
                  </span>
                ))}
                {o.items && o.items.length>3 && <span className="text-gray-400"> …</span>}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold text-gray-900">{o.total.toLocaleString()} ฿</div>
              <div className="mt-1"><Badge tone={statusTone(o.status)}>{o.status}</Badge></div>
              {o.paymentSlip ? (
                <a className="mt-2 block text-xs underline text-gray-700 hover:text-gray-900" href={`/api/orders/${o._id}/slip`} target="_blank" rel="noreferrer">ดูสลีป</a>
              ) : (
                <Link className="mt-2 block text-xs underline text-green-700 hover:text-green-800" to="/checkout">แนบสลีป</Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
