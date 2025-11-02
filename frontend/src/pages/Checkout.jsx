// frontend/src/pages/Checkout.jsx (Robust order placement + Reorder-aware)
import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api, { apiBase } from '../api';
import { useAuth } from '../context/AuthContext';
import styles from '../styles/checkout.module.css';

const FallbackImg =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=';

export default function Checkout(){
  const nav = useNavigate();
  const location = useLocation();
  const { token } = useAuth();
  const isLoggedIn = !!token;

  const [items, setItems] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddrId, setSelectedAddrId] = useState('');
  const [payment, setPayment] = useState('COD');
  const [placing, setPlacing] = useState(false);
  const [notice, setNotice] = useState('');

  // ป้องกันการ apply selection ซ้ำ
  const appliedSelectionRef = useRef(false);

  useEffect(()=>{
    if(!isLoggedIn){
      nav('/login', { replace: true, state: { next: '/checkout' }});
    }
  }, [isLoggedIn, nav]);

  // โหลดรายการมาแสดง (จาก state หรือจาก /cart)
  useEffect(()=>{
    const fromState = location?.state?.items;
    if (Array.isArray(fromState) && fromState.length){
      setItems(normalizeItems(fromState));
      return;
    }
    (async ()=>{
      try{
        const res = await api.get('/cart');
        const raw = Array.isArray(res.data) ? res.data : res.data?.items || res.data?.cart?.items || [];
        setItems(normalizeItems(raw));
      }catch(e){
        console.error('load cart for checkout:', e);
        setItems([]);
      }
    })();
  }, [location?.state]);

  // อ่าน address
  useEffect(()=>{
    (async ()=>{
      try{
        const { data } = await api.get('/addresses');
        const arr = data?.items || data || [];
        setAddresses(arr);
        const def = arr.find(a=>a.isDefault) || arr[0];
        if (def) setSelectedAddrId(String(def._id || ''));
      }catch(e){ /* silent */ }
    })();
  }, []);

  // ✅ ถ้ามาจาก reorder: กรองเฉพาะสินค้าใน selection แล้วเคลียร์ flag
  useEffect(()=>{
    const sp = new URLSearchParams(location.search || '');
    const fromReorder = sp.get('from') === 'reorder';
    if (!fromReorder) return;
    if (appliedSelectionRef.current) return; // อย่า apply ซ้ำ
    if (!items.length) return; // รอให้โหลด items เสร็จก่อน

    try{
      const rawSel = localStorage.getItem('mib:checkout:selection');
      const ids = rawSel ? JSON.parse(rawSel) : [];
      const idSet = new Set((Array.isArray(ids) ? ids : []).map(String));

      // ถ้าไม่มี selection ให้ใช้ทั้งตะกร้า (แต่ยังคงถือว่าเป็น reorder)
      const next = idSet.size ? items.filter(it => idSet.has(String(it.bookId))) : items;

      if (!next.length) {
        setNotice('สินค้าที่ต้องชำระไม่พร้อมใช้งาน (อาจหมดสต๊อกแล้ว)');
        // พาไปตะกร้าให้ผู้ใช้เลือกใหม่
        setTimeout(()=> nav('/cart'), 1200);
      } else {
        setItems(next);
      }
    }catch(e){
      // ถ้าอ่าน selection พัง ก็ปล่อยเป็นทั้งตะกร้า
      console.warn('apply reorder selection failed:', e);
    } finally {
      localStorage.removeItem('mib:checkout:selection');
      localStorage.removeItem('mib:checkout:from');
      appliedSelectionRef.current = true;
    }
  }, [location.search, items, nav]);

  const normalizeItems = (rawArr)=> (rawArr||[]).map(it=>{
    const b = it.book || {};
    const rawId = it.bookId || b._id || it._id;
    const bookId = String(rawId || '');
    const title = it.title || b.title || bookId;
    const price = Number(it.price ?? b.price ?? 0);
    const qty = Math.max(1, Number(it.qty || 1));
    const coverUrl = it.coverUrl || (bookId ? `${apiBase()}/books/${bookId}/cover` : undefined);
    return { bookId, title, price, qty, coverUrl };
  });

  const summary = useMemo(()=>{
    const subtotal = items.reduce((s,it)=> s + Number(it.price||0)*Number(it.qty||1), 0);
    const shipping = subtotal > 500 ? 0 : (items.length ? 35 : 0);
    const discount = 0;
    const total = Math.max(0, subtotal + shipping - discount);
    return { subtotal, shipping, discount, total };
  }, [items]);

  const placeOrder = async ()=>{
    if (!items.length) {
      setNotice('ไม่มีสินค้าในรายการชำระเงิน');
      return;
    }
    if (!selectedAddrId){
      setNotice('กรุณาเลือกที่อยู่จัดส่ง');
      return;
    }

    const addrObj = addresses.find(a => String(a._id) === String(selectedAddrId));
    if (!addrObj){
      setNotice('ไม่พบข้อมูลที่อยู่ที่เลือก');
      return;
    }

    setPlacing(true); setNotice('');
    try{
      const normItems = items.map(it => ({
        bookId: it.bookId,
        qty: Number(it.qty || 1),
        // ส่ง price ไปได้ แต่ backend ของคุณจะอ้างอิงราคาจาก DB จริงอีกที (กัน spoof)
        price: Number.isFinite(Number(it.price)) ? Number(it.price) : undefined,
      }));

      // 1) schema: addressId
      const payload1 = {
        addressId: selectedAddrId,
        items: normItems,
        paymentMethod: payment,
      };
      console.debug('[Checkout] POST /orders payload1', payload1);
      let res;
      try{
        res = await api.post('/orders', payload1);
      }catch(err1){
        // 2) fallback: ส่ง snapshot shippingAddress + summary
        console.warn('[Checkout] addressId schema failed, falling back', err1?.response?.data || err1?.message);
        const shippingAddress = {
          fullName: addrObj.fullName || '',
          phone: addrObj.phone || '',
          line1: addrObj.line1 || '',
          line2: addrObj.line2 || '',
          subdistrict: addrObj.subdistrict || '',
          district: addrObj.district || '',
          province: addrObj.province || '',
          postcode: addrObj.postcode || '',
        };
        const payload2 = {
          items: normItems,
          paymentMethod: payment,
          shippingAddress,
          summary,
        };
        console.debug('[Checkout] POST /orders payload2', payload2);
        res = await api.post('/orders', payload2);
      }

      const order = res.data?.order || res.data;
      console.debug('[Checkout] order created:', order);

      // เคลียร์เฉพาะสินค้าเหล่านี้ออกจากตะกร้า
      try{
        const params = new URLSearchParams();
        items.forEach(it => params.append('ids', it.bookId));
        await api.delete(`/cart/items?${params.toString()}`);
      }catch(eDel){
        try{
          await api.post('/cart/clear', { ids: items.map(it => it.bookId) });
        }catch(_){ /* ignore */ }
      }

      // ไปที่หน้าออเดอร์ตาม Flow เดิม
      nav('/orders?status=TO_SHIP', { replace: true });

    }catch(e){
      console.error('place order error:', e);
      const msg = e?.response?.data?.message || e?.response?.data?.error || e?.message || 'สั่งซื้อไม่สำเร็จ';
      setNotice(msg);
    }finally{
      setPlacing(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.headerBar}>
        <div className={styles.brand}>May i Booking</div>
        <div className={styles.steps}>
          <span className={styles.stepDone}>ตะกร้า</span>
          <span className={styles.stepActive}>ชำระเงิน</span>
          <span className={styles.step}>ยืนยัน</span>
        </div>
      </div>

      <h2 className={styles.title}>ชำระเงิน</h2>
      <p className={styles.subtitle}>เลือกที่อยู่สำหรับจัดส่ง และตรวจสอบรายการก่อนยืนยัน</p>
      {notice ? <div className={`${styles.card} ${styles.notice}`}>{notice}</div> : null}

      <div className={styles.twoCol}>
        <div className={styles.leftCol}>
          {/* Address (select-only) */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.sectionTitle}>ที่อยู่จัดส่ง</div>
            </div>

            {addresses.length > 0 ? (
              <div className={styles.addrSelectWrap}>
                <select
                  className={styles.addrSelectBig}
                  onChange={(e)=> setSelectedAddrId(e.target.value)}
                  value={selectedAddrId}
                >
                  {addresses.map(a => (
                    <option key={a._id} value={a._id}>
                      {a.fullName} • {a.phone} • {a.line1} {a.subdistrict} {a.district} {a.province} {a.postcode}
                    </option>
                  ))}
                </select>
                {/* preview ย่อ */}
                {(() => {
                  const a = addresses.find(x => String(x._id) === String(selectedAddrId));
                  return a ? (
                    <div className={styles.addrPreview}>
                      <div className={styles.addrPreviewTitle}>ที่อยู่ที่เลือก</div>
                      <div>{a.fullName} • {a.phone}</div>
                      <div>{a.line1}{a.line2 ? `, ${a.line2}` : ''}</div>
                      <div>{a.subdistrict} {a.district} {a.province} {a.postcode}</div>
                    </div>
                  ) : null;
                })()}
                <div className={styles.addrManageRow}>
                  <button
                    type="button"
                    className={styles.secondaryBtn}
                    onClick={()=> nav('/account/addresses', { state: { backTo: '/checkout' } }) }
                  >
                    จัดการที่อยู่
                  </button>
                </div>
              </div>
            ) : (
              <div className={styles.empty}>
                ยังไม่มีที่อยู่ในระบบ
                <button onClick={()=>nav('/account/addresses', { state: { backTo: '/checkout' } })} className={styles.linkBtn}>เพิ่มที่อยู่</button>
              </div>
            )}
          </div>

          {/* Items */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.sectionTitle}>รายการสั่งซื้อ</div>
            </div>

            {!items.length ? (
              <div className={styles.empty}>
                ไม่มีสินค้าในรายการชำระเงิน
                <button onClick={()=>nav('/cart')} className={styles.linkBtn}>ย้อนกลับตะกร้า</button>
              </div>
            ) : (
              <div className={styles.list}>
                {items.map(it => (
                  <div key={it.bookId} className={styles.itemRow}>
                    <img
                      className={styles.cover}
                      src={it.coverUrl || FallbackImg}
                      alt={it.title}
                      onError={(e)=>{ e.currentTarget.src = FallbackImg; }}
                    />
                    <div className={styles.itemMain}>
                      <div className={styles.itemTitle}>{it.title}</div>
                      <div className={styles.itemSub}>฿{Number(it.price||0).toLocaleString('th-TH')}</div>
                    </div>
                    <div className={styles.itemSub}>× {it.qty}</div>
                    <div className={styles.lineTotal}>฿{(Number(it.price||0)*Number(it.qty||1)).toLocaleString('th-TH')}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Payment + Summary */}
        <div className={styles.rightCol}>
          <div className={styles.card}>
            <div className={styles.cardHeader}><div className={styles.sectionTitle}>วิธีชำระเงิน</div></div>
            <div className={styles.payMethod}>
              <label className={styles.inline}>
                <input type="radio" name="pay" value="COD" checked={payment==='COD'} onChange={()=>setPayment('COD')} />
                ชำระปลายทาง (COD)
              </label>
              <label className={styles.inline}>
                <input type="radio" name="pay" value="TRANSFER" checked={payment==='TRANSFER'} onChange={()=>setPayment('TRANSFER')} />
                โอน/พร้อมเพย์ (อัปโหลดสลิปภายหลัง)
              </label>
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}><div className={styles.sectionTitle}>สรุปยอด</div></div>
            <div className={styles.summaryList}>
              <Row label="ยอดสินค้า" value={`฿${summary.subtotal.toLocaleString('th-TH')}`} />
              <Row label="ค่าจัดส่ง" value={summary.shipping === 0 ? 'ฟรี' : `฿${summary.shipping.toLocaleString('th-TH')}`} />
              <Row label="ส่วนลด" value={`฿${summary.discount.toLocaleString('th-TH')}`} />
              <hr className={styles.hr} />
              <Row big label="ยอดชำระทั้งหมด" value={`฿${summary.total.toLocaleString('th-TH')}`} />
            </div>
            <div className={styles.actionCol}>
              <button disabled={placing} onClick={placeOrder} className={styles.buyBtn}>
                {placing ? 'กำลังยืนยันคำสั่งซื้อ…' : 'ยืนยันคำสั่งซื้อ'}
              </button>
              <button onClick={()=>nav('/cart')} className={styles.secondaryBtn}>ย้อนกลับตะกร้า</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, big }) {
  return (
    <div className={`${styles.row} ${big ? styles.rowBig : ''}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
