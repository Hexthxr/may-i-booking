// frontend/src/pages/Checkout.jsx
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
  const [payment, setPayment] = useState('COD'); // COD | TRANSFER
  const [placing, setPlacing] = useState(false);
  const [notice, setNotice] = useState('');

  // reorder selection flag
  const appliedSelectionRef = useRef(false);

  useEffect(()=>{
    if(!isLoggedIn){
      nav('/login', { replace: true, state: { next: '/checkout' }});
    }
  }, [isLoggedIn, nav]);

  // load list (จาก state หรือจาก /cart)
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

  // addresses
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

  // apply selection (reorder)
  useEffect(()=>{
    const sp = new URLSearchParams(location.search || '');
    const fromReorder = sp.get('from') === 'reorder';
    if (!fromReorder) return;
    if (appliedSelectionRef.current) return;
    if (!items.length) return;

    try{
      const rawSel = localStorage.getItem('mib:checkout:selection');
      const ids = rawSel ? JSON.parse(rawSel) : [];
      const idSet = new Set((Array.isArray(ids) ? ids : []).map(String));
      const next = idSet.size ? items.filter(it => idSet.has(String(it.bookId))) : items;

      if (!next.length) {
        setNotice('สินค้าที่ต้องชำระไม่พร้อมใช้งาน (อาจหมดสต๊อกแล้ว)');
        setTimeout(()=> nav('/cart'), 1200);
      } else {
        setItems(next);
      }
    }catch(e){
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

  // >>> ไปหน้า Payment พร้อมข้อมูลที่ต้องใช้ในการสร้างออร์เดอร์ TRANSFER
  const goPayment = ()=>{
    if (!items.length) return setNotice('ไม่มีสินค้าในรายการชำระเงิน');
    if (!selectedAddrId) return setNotice('กรุณาเลือกที่อยู่จัดส่ง');

    const payload = {
      amount: Number(summary?.total || 0),
      ref: `ORDER-${Date.now().toString().slice(-6)}`,
      from: '/checkout',
      items,                 // ส่งรายการสินค้า (bookId, qty, price, coverUrl, title)
      addressId: selectedAddrId,
      summary
    };
    try {
      sessionStorage.setItem('mib:pay', JSON.stringify(payload)); // กันรีเฟรช
    } catch {}
    nav('/payment', { state: payload });
  };

  const placeOrder = async ()=>{
    if (!items.length) return setNotice('ไม่มีสินค้าในรายการชำระเงิน');
    if (!selectedAddrId) return setNotice('กรุณาเลือกที่อยู่จัดส่ง');

    // ถ้าเลือกโอน/พร้อมเพย์ ให้ไปหน้าชำระเงินก่อน (ไม่สั่งซื้อในหน้านี้)
    if (payment === 'TRANSFER') {
      return goPayment();
    }

    setPlacing(true); setNotice('');
    try{
      const normItems = items.map(it => ({
        bookId: it.bookId,
        qty: Number(it.qty || 1),
        price: Number.isFinite(Number(it.price)) ? Number(it.price) : undefined,
      }));

      // COD
      try{
        await api.post('/orders', {
          addressId: selectedAddrId,
          items: normItems,
          paymentMethod: 'COD',
        });
      }catch(err1){
        const a = addresses.find(x => String(x._id) === String(selectedAddrId));
        const shippingAddress = a ? {
          fullName: a.fullName || '',
          phone: a.phone || '',
          line1: a.line1 || '',
          line2: a.line2 || '',
          subdistrict: a.subdistrict || '',
          district: a.district || '',
          province: a.province || '',
          postcode: a.postcode || '',
        } : undefined;

        await api.post('/orders', {
          items: normItems,
          paymentMethod: 'COD',
          shippingAddress,
          summary,
        });
      }

      // ล้างของในตะกร้าที่ซื้อแล้ว
      try{
        const params = new URLSearchParams();
        items.forEach(it => params.append('ids', it.bookId));
        await api.delete(`/cart/items?${params.toString()}`);
      }catch(_){
        try{ await api.post('/cart/clear', { ids: items.map(it => it.bookId) }); }catch(__){}
      }

      alert('สั่งซื้อสำเร็จ!');
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
      <p className={styles.subtitle}>เลือกที่อยู่ ตรวจสอบรายการ และเลือกวิธีชำระเงิน</p>
      {notice ? <div className={`${styles.card} ${styles.notice}`}>{notice}</div> : null}

      <div className={styles.twoCol}>
        {/* LEFT */}
        <div className={styles.leftCol}>
          {/* Address */}
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

        {/* RIGHT */}
        <div className={styles.rightCol}>
          {/* Payment */}
          <div className={styles.card}>
            <div className={styles.cardHeader}><div className={styles.sectionTitle}>วิธีชำระเงิน</div></div>
            <div className={styles.payMethod}>
              <label className={styles.inline}>
                <input
                  type="radio"
                  name="pay"
                  value="COD"
                  checked={payment==='COD'}
                  onChange={()=>setPayment('COD')}
                />
                ชำระปลายทาง (COD)
              </label>
              <label className={styles.inline}>
                <input
                  type="radio"
                  name="pay"
                  value="TRANSFER"
                  checked={payment==='TRANSFER'}
                  onChange={()=>setPayment('TRANSFER')}
                />
                โอน/พร้อมเพย์
              </label>
            </div>

            {/* เมื่อเลือกโอน/พร้อมเพย์ แสดงปุ่มไปหน้าชำระเงิน */}
            {payment === 'TRANSFER' && (
              <div style={{marginTop:10, display:'grid', gap:8}}>
                <button className={styles.buyBtn} onClick={goPayment}>
                  ไปหน้าชำระเงิน (พร้อมเพย์ QR)
                </button>
                <small className={styles.note}>
                  สแกนและชำระในหน้าถัดไป แล้วแนบสลิปเพื่อยืนยัน
                </small>
              </div>
            )}
          </div>

          {/* Summary */}
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
                {placing ? 'กำลังยืนยันคำสั่งซื้อ…' : (payment==='TRANSFER' ? 'ไปหน้าชำระเงิน' : 'ยืนยันคำสั่งซื้อ')}
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
