// // frontend/src/pages/Profile.jsx
// import { useEffect, useState } from 'react';
// import api from '../api';
// import AddressForm from '../components/AddressForm';

// export default function Profile(){
//   const [user, setUser] = useState(null);
//   const [orders, setOrders] = useState([]);
//   const [saving, setSaving] = useState(false);
//   const [defaultAddress, setDefaultAddress] = useState(null);

//   const load = async ()=>{
//     const u = await api.get('/users/me');
//     setUser(u.data.user);
//     setDefaultAddress(u.data.user?.defaultAddress || {});
//     const o = await api.get('/orders/my');
//     setOrders(o.data.orders || []);
//   };

//   useEffect(()=>{ load(); },[]);

//   const save = async ()=>{
//     setSaving(true);
//     try{
//       const { data } = await api.patch('/users/me', { fullname: user.fullname, phone: user.phone, defaultAddress });
//       setUser(data.user);
//       alert('บันทึกโปรไฟล์แล้ว');
//     }catch(err){
//       alert(err?.response?.data?.message || 'บันทึกไม่สำเร็จ');
//     }finally{ setSaving(false); }
//   };

//   if (!user) return <div className="p-4">กำลังโหลด...</div>;

//   return (
//     <div className="max-w-4xl mx-auto p-4">
//       <h1 className="text-xl font-semibold mb-4">โปรไฟล์ของฉัน</h1>

//       <section className="mb-6">
//         <h2 className="font-medium mb-2">ข้อมูลส่วนตัว</h2>
//         <label className="block mb-2">
//           <span className="text-sm">ชื่อแสดงผล</span>
//           <input className="mt-1 w-full border rounded px-3 py-2" value={user.fullname||''} onChange={e=>setUser({...user, fullname:e.target.value})} />
//         </label>
//         <label className="block mb-2">
//           <span className="text-sm">โทรศัพท์</span>
//           <input className="mt-1 w-full border rounded px-3 py-2" value={user.phone||''} onChange={e=>setUser({...user, phone:e.target.value})} />
//         </label>

//         <h3 className="font-medium mb-2 mt-4">ที่อยู่เริ่มต้น</h3>
//         <AddressForm value={defaultAddress} onChange={setDefaultAddress} />

//         <button disabled={saving} onClick={save} className="mt-3 bg-black text-white px-4 py-2 rounded">
//           {saving ? 'กำลังบันทึก...' : 'บันทึกโปรไฟล์'}
//         </button>
//       </section>

//       <section>
//         <h2 className="font-medium mb-2">คำสั่งซื้อของฉัน</h2>
//         <div className="border rounded">
//           {orders.map(o=> (
//             <div key={o._id} className="p-3 border-b last:border-b-0 text-sm">
//               <div className="flex justify-between">
//                 <div>
//                   <div>เลขที่: <b>{o._id}</b></div>
//                   <div>สถานะ: {o.status}</div>
//                 </div>
//                 <div className="text-right">
//                   <div>{o.total.toLocaleString()} ฿</div>
//                   <div className="opacity-70">{new Date(o.createdAt).toLocaleString()}</div>
//                 </div>
//               </div>
//             </div>
//           ))}
//           {orders.length === 0 && <div className="p-3 text-center text-sm">ยังไม่มีคำสั่งซื้อ</div>}
//         </div>
//       </section>
//     </div>
//   );
// }
