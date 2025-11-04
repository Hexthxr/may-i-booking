// frontend/src/pages/Checkout.jsx
import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api, { apiBase } from '../api';
import { useAuth } from '../context/AuthContext';
import styles from '../styles/checkout.module.css';

const FallbackImg =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=';

function copy(text){
  try{ navigator.clipboard.writeText(String(text)); alert('คัดลอกแล้ว'); }catch(_){ /* ignore */ }
}

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

  // slip
  const [slipFile, setSlipFile] = useState(null);
  const [slipPreview, setSlipPreview] = useState('');
  const [dragOver, setDragOver] = useState(false);

  // transfer helper
  const [expirySec, setExpirySec] = useState(15 * 60); // 15 นาที

  // reorder selection flag
  const appliedSelectionRef = useRef(false);

  useEffect(()=>{
    if(!isLoggedIn){
      nav('/login', { replace: true, state: { next: '/checkout' }});
    }
  }, [isLoggedIn, nav]);

  // load list
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

  // reorder filter
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

  // countdown for transfer
  useEffect(()=>{
    if (payment !== 'TRANSFER') return;
    setExpirySec(15*60);
  }, [payment]);

  useEffect(()=>{
    if (payment !== 'TRANSFER') return;
    if (expirySec <= 0) return;
    const t = setInterval(()=> setExpirySec(s => s - 1), 1000);
    return ()=> clearInterval(t);
  }, [payment, expirySec]);

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

  const amount = summary.total; // เอาไว้โชว์/คัดลอกบนกล่องโอน
  const payeeName = 'May i Booking Co., Ltd.';
  const promptPayId = '08X-XXX-XXXX'; // <- เปลี่ยนเป็นเลขพร้อมเพย์ของจริง
  const qrUrl = `${apiBase()}/static/qr-demo.png`; // <- ถ้ามี endpoint QR จริงให้เปลี่ยน

  // pick slip
  const acceptFile = (f)=>{
    if(!f) return false;
    if(!f.type?.startsWith('image/')){ setNotice('ไฟล์สลิปต้องเป็นรูปภาพ'); return false; }
    if(f.size > 8 * 1024 * 1024){ setNotice('ไฟล์สลิปต้องไม่เกิน 8MB'); return false; }
    setSlipFile(f);
    setSlipPreview(URL.createObjectURL(f));
    return true;
  };
  const onPickSlip = (e)=> acceptFile(e.target.files?.[0]);

  // drag & drop
  const onDrop = (e)=>{
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    acceptFile(f);
  };

  const placeOrder = async ()=>{
    if (!items.length) return setNotice('ไม่มีสินค้าในรายการชำระเงิน');
    if (!selectedAddrId) return setNotice('กรุณาเลือกที่อยู่จัดส่ง');

    const addrObj = addresses.find(a => String(a._id) === String(selectedAddrId));
    if (!addrObj) return setNotice('ไม่พบข้อมูลที่อยู่ที่เลือก');

    if (payment === 'TRANSFER' && !slipFile){
      return setNotice('กรุณาแนบสลิปการโอนเงินก่อนยืนยัน');
    }

    setPlacing(true); setNotice('');
    try{
      const normItems = items.map(it => ({
        bookId: it.bookId,
        qty: Number(it.qty || 1),
        price: Number.isFinite(Number(it.price)) ? Number(it.price) : undefined,
      }));

      if (payment === 'TRANSFER'){
        const fd = new FormData();
        fd.append('paymentMethod', 'TRANSFER');
        fd.append('addressId', selectedAddrId);
        fd.append('items', JSON.stringify(normItems));
        fd.append('summary', JSON.stringify(summary));
        fd.append('slip', slipFile);

        await api.post('/orders', fd, { headers: { 'Content-Type': 'multipart/form-data' } });

        // clear purchased items
        try{
          const params = new URLSearchParams();
          items.forEach(it => params.append('ids', it.bookId));
          await api.delete(`/cart/items?${params.toString()}`);
        }catch(eDel){
          try{ await api.post('/cart/clear', { ids: items.map(it => it.bookId) }); }catch(_){}
        }

        alert('อัปโหลดสลิปเรียบร้อย! ระบบจะตรวจสอบและยืนยันคำสั่งซื้อ');
        return nav('/orders?status=TO_SHIP', { replace: true });
      }

      // COD
      try{
        await api.post('/orders', {
          addressId: selectedAddrId,
          items: normItems,
          paymentMethod: 'COD',
        });
      }catch(err1){
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
        await api.post('/orders', {
          items: normItems,
          paymentMethod: 'COD',
          shippingAddress,
          summary,
        });
      }

      try{
        const params = new URLSearchParams();
        items.forEach(it => params.append('ids', it.bookId));
        await api.delete(`/cart/items?${params.toString()}`);
      }catch(eDel){
        try{ await api.post('/cart/clear', { ids: items.map(it => it.bookId) }); }catch(_){}
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

  // helper นับถอยหลัง mm:ss
  const mmss = (sec)=> {
    const m = Math.max(0, Math.floor(sec/60)).toString().padStart(2,'0');
    const s = Math.max(0, sec%60).toString().padStart(2,'0');
    return `${m}:${s}`;
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
      <p className={styles.subtitle}>เลือกที่อยู่ ตรวจสอบรายการ และอัปโหลดสลิปเมื่อเลือกโอน</p>
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
                <input type="radio" name="pay" value="COD" checked={payment==='COD'} onChange={()=>setPayment('COD')} />
                ชำระปลายทาง (COD)
              </label>
              <label className={styles.inline}>
                <input type="radio" name="pay" value="TRANSFER" checked={payment==='TRANSFER'} onChange={()=>setPayment('TRANSFER')} />
                โอน/พร้อมเพย์
              </label>
            </div>

            {/* TRANSFER Panel */}
            {payment === 'TRANSFER' && (
              <div style={{marginTop:10, display:'grid', gap:12}}>
                {/* Pay Box */}
                <div
                  style={{
                    border:'1px solid #e6e6e6',
                    borderRadius:12,
                    padding:12,
                    display:'grid',
                    gridTemplateColumns:'120px 1fr',
                    gap:12,
                    alignItems:'center',
                    background:'#fafafa'
                  }}
                >
                  <img
                    src={"https://media.discordapp.net/attachments/1405142806254714962/1435241356221223014/IMG_3057.jpg?ex=690b402c&is=6909eeac&hm=aacebc8678a9b62ff068f12f08ab5ac2162cfccccd904c33e3105e758066e6c0&=&format=webp&width=686&height=930"}
                    alt="QR พร้อมเพย์"
                    style={{width:120, height:120, objectFit:'cover', borderRadius:8, border:'1px solid #eee'}}
                    onError={(e)=>{ e.currentTarget.src = FallbackImg; }}
                  />
                  <div style={{display:'grid', gap:6}}>
                    <div style={{fontWeight:700}}>โอน/พร้อมเพย์</div>
                    <div style={{opacity:.8}}>{payeeName}</div>
                    <div style={{display:'flex', gap:8, alignItems:'center', flexWrap:'wrap'}}>
                      <span>พร้อมเพย์:</span>
                      <code style={{background:'#fff', padding:'2px 6px', borderRadius:6, border:'1px solid #eee'}}>{promptPayId}</code>
                      <button className={styles.secondaryBtn} onClick={()=>copy(promptPayId)}>คัดลอก</button>
                    </div>
                    <div style={{display:'flex', gap:8, alignItems:'center', flexWrap:'wrap'}}>
                      <span>จำนวนเงิน:</span>
                      <code style={{background:'#fff', padding:'2px 6px', borderRadius:6, border:'1px solid #eee'}}>฿{amount.toLocaleString('th-TH')}</code>
                      <button className={styles.secondaryBtn} onClick={()=>copy(amount)}>คัดลอก</button>
                    </div>
                    <div style={{display:'flex', gap:8, alignItems:'center', marginTop:4}}>
                      <span style={{fontSize:12, opacity:.75}}>เวลาที่เหลือในการชำระ:</span>
                      <strong style={{fontSize:12, color:'#d84315'}}>{mmss(expirySec)}</strong>
                    </div>
                  </div>
                </div>

                {/* Slip Dropzone */}
                <div
                  onDragOver={(e)=>{ e.preventDefault(); setDragOver(true); }}
                  onDragLeave={()=> setDragOver(false)}
                  onDrop={onDrop}
                  style={{
                    border: dragOver ? '2px dashed #2e7d32' : '2px dashed #ddd',
                    background: dragOver ? 'rgba(46,125,50,0.05)' : 'transparent',
                    borderRadius:12,
                    padding:16,
                    textAlign:'center'
                  }}
                >
                  <div style={{fontWeight:600, marginBottom:6}}>แนบสลิปการโอน</div>
                  <div style={{fontSize:13, opacity:.75, marginBottom:10}}>ลากรูปมาวางที่นี่ หรือกดปุ่มเพื่อเลือกไฟล์ (สูงสุด 8MB)</div>
                  <input type="file" accept="image/*" onChange={onPickSlip} />
                  {slipPreview && (
                    <img
                      src={slipPreview}
                      alt="สลิปที่เลือก"
                      style={{ width:'100%', marginTop:10, borderRadius:12, border:'1px solid #eee' }}
                    />
                  )}
                </div>

                {/* Tips */}
                <ul style={{margin:'2px 0 0 18px', padding:0, fontSize:12, opacity:.7}}>
                  <li>หลังอัปโหลดสลิปแล้ว ทีมงานจะตรวจสอบและยืนยันคำสั่งซื้อ</li>
                  <li>หากหมดเวลา โปรดสร้างคำสั่งซื้อใหม่เพื่อความถูกต้องของยอด</li>
                </ul>
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
                {placing ? 'กำลังยืนยันคำสั่งซื้อ…' : (payment==='TRANSFER' ? 'อัปโหลดสลิป & ยืนยัน' : 'ยืนยันคำสั่งซื้อ')}
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
