// frontend/src/pages/Checkout.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import AddressForm from '../components/AddressForm';

export default function Checkout(){
  const [cart, setCart] = useState([]); // [{book, title, price, qty}]
  const [address, setAddress] = useState(null);
  const [creating, setCreating] = useState(false);
  const [order, setOrder] = useState(null);
  const [slip, setSlip] = useState(null);
  const nav = useNavigate();

  useEffect(()=>{
    const c = JSON.parse(localStorage.getItem('cart')||'[]');
    setCart(c);
    api.get('/users/me').then(res=>{
      const u = res.data.user || {}; const da = u.defaultAddress || {};
      setAddress({ fullname: u.fullname||'', phone: u.phone||'', ...da });
    }).catch(()=>{});
  },[]);

  const subtotal = cart.reduce((s,i)=>s + i.price*i.qty, 0);
  const shippingFee = subtotal > 800 ? 0 : 40;
  const total = subtotal + shippingFee;

  const createOrder = async ()=>{
    if (!address?.fullname || !address?.phone || !address?.houseNo || !address?.subdistrict || !address?.district || !address?.province || !address?.postcode){
      return alert('กรอกที่อยู่ให้ครบ');
    }
    setCreating(true);
    try{
      const { data } = await api.post('/orders', { items: cart, address, shippingFee, discount: 0 });
      setOrder(data.order);
    }catch(err){
      alert(err?.response?.data?.message || 'สร้างคำสั่งซื้อไม่สำเร็จ');
    }finally{ setCreating(false); }
  };

  const uploadSlip = async ()=>{
    if (!order?._id || !slip) return;
    const form = new FormData();
    form.append('slip', slip);
    try{
      await api.post(`/orders/${order._id}/slip`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
      alert('อัปโหลดสลีปเรียบร้อย');
      localStorage.removeItem('cart');
      nav(`/orders/${order._id}`);
    }catch(err){
      alert(err?.response?.data?.message || 'อัปโหลดไม่สำเร็จ');
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-xl font-semibold mb-4">ชำระเงิน (โอนเงินแนบสลีป)</h1>

      <section className="mb-6">
        <h2 className="font-medium mb-2">ที่อยู่จัดส่ง</h2>
        <AddressForm value={address} onChange={setAddress} />
      </section>

      <section className="mb-6">
        <h2 className="font-medium mb-2">สรุปรายการ</h2>
        <div className="border rounded p-3">
          {cart.map((it,idx)=> (
            <div key={idx} className="flex justify-between py-1 text-sm">
              <span>{it.title} × {it.qty}</span>
              <span>{(it.price*it.qty).toLocaleString()} ฿</span>
            </div>
          ))}
          <div className="flex justify-between border-t mt-2 pt-2 text-sm">
            <span>ค่าสินค้า</span><span>{subtotal.toLocaleString()} ฿</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>ค่าจัดส่ง</span><span>{shippingFee.toLocaleString()} ฿</span>
          </div>
          <div className="flex justify-between font-semibold mt-1">
            <span>รวมทั้งสิ้น</span><span>{total.toLocaleString()} ฿</span>
          </div>
        </div>
      </section>

      {!order ? (
        <button disabled={creating} onClick={createOrder} className="bg-black text-white px-4 py-2 rounded">
          {creating ? 'กำลังสร้างคำสั่งซื้อ...' : 'ยืนยันคำสั่งซื้อ'}
        </button>
      ) : (
        <section className="mt-6">
          <h2 className="font-medium mb-2">แนบสลีปการโอน</h2>
          <p className="text-sm mb-2">เลขที่คำสั่งซื้อ: <b>{order._id}</b></p>
          <div className="border rounded p-3 mb-3">
            <input type="file" accept="image/*,application/pdf" onChange={e=>setSlip(e.target.files?.[0]||null)} />
          </div>
          <button onClick={uploadSlip} className="bg-black text-white px-4 py-2 rounded">อัปโหลดสลีป</button>
        </section>
      )}
    </div>
  );
}
