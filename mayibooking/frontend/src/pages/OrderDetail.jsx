// frontend/src/pages/OrderDetail.jsx
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import api, { apiBase } from '../api';
import styles from '../styles/orders.module.css';

const FallbackImg = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=';

const STATUS_LABEL = {
  PENDING: 'รอชำระ/รอดำเนินการ',
  PAID: 'ที่ต้องจัดส่ง',
  PROCESSING: 'กำลังเตรียมของ',
  SHIPPED: 'จัดส่งแล้ว',
  COMPLETED: 'สำเร็จ',
  CANCELLED: 'ยกเลิก',
  CANCELED: 'ยกเลิก',
};

export default function OrderDetail(){
  const { id } = useParams();
  const nav = useNavigate();
  const loc = useLocation();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [working, setWorking] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(()=>{
    (async ()=>{
      setLoading(true); setError('');
      try{
        const { data } = await api.get(`/orders/${id}`);
        const ord = data?.order || data?.data || data || null;
        setOrder(ord);
      }catch(e){
        setError(e?.response?.data?.message || 'ไม่สามารถโหลดคำสั่งซื้อได้');
      }finally{
        setLoading(false);
      }
    })();
  }, [id]);

  const total = useMemo(()=>{
    if (!order) return 0;
    if (order.total != null) return Number(order.total);
    if (order?.summary?.total != null) return Number(order.summary.total);
    const sub = Array.isArray(order.items)
      ? order.items.reduce((s,it)=> s + Number(it.price||0)*Number(it.qty||1), 0)
      : 0;
    const ship = Number(order?.summary?.shipping ?? order?.shipping ?? 0);
    const disc = Number(order?.summary?.discount ?? order?.discount ?? 0);
    return Math.max(0, sub + ship - disc);
  }, [order]);

  const canCancel = useMemo(()=>{
    const st = (order?.status || '').toUpperCase();
    return st === 'PENDING' || st === 'PAID' || st === 'PROCESSING';
  }, [order]);

  async function handleCancel(){
    if (!order || !canCancel) return;
    if (!confirm('ยืนยันยกเลิกคำสั่งซื้อนี้หรือไม่?')) return;
    setWorking(true); setToast('');
    try{
      await api.patch(`/orders/${id}/cancel`);
      const { data } = await api.get(`/orders/${id}`);
      setOrder(data?.order || data || null);
      setToast('ยกเลิกคำสั่งซื้อสำเร็จ');
    }catch(e){
      setToast(e?.response?.data?.message || 'ยกเลิกไม่สำเร็จ');
    }finally{
      setWorking(false);
    }
  }

  function handlePrint(){
    if (!order) return;

    const addr = order.shippingAddress || order.address || {};
    const rows = (order.items || []).map(it=>{
      const b = it.book || {};
      const name = it.title || b.title || it.bookId || '-';
      const qty = Number(it.qty||1);
      const price = Number(it.price||b.price||0);
      const line = qty*price;
      return `<tr><td>${name}</td><td style="text-align:right;">${qty}</td><td style="text-align:right;">฿${price.toLocaleString('th-TH')}</td><td style="text-align:right;">฿${line.toLocaleString('th-TH')}</td></tr>`;
    }).join('');

    const ship = Number(order?.summary?.shipping ?? order?.shipping ?? 0).toLocaleString('th-TH');
    const disc = Number(order?.summary?.discount ?? order?.discount ?? 0).toLocaleString('th-TH');
    const tot  = Number(total||0).toLocaleString('th-TH');

    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`
      <html><head><meta charset="utf-8" />
      <title>ใบเสร็จ #${id}</title>
      <style>
        body{ font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, 'TH Sarabun New', sans-serif; padding:20px; }
        h2{ margin:0 0 4px; } .muted{ color:#666; }
        table{ width:100%; border-collapse:collapse; margin-top:10px; } td, th{ border-bottom:1px solid #eee; padding:8px; }
        .sum td{ font-weight:bold; } .right{ text-align:right; }
      </style></head><body>
        <h2>ใบเสร็จรับเงิน</h2>
        <div class="muted">คำสั่งซื้อ #${id} • ${order.createdAt ? new Date(order.createdAt).toLocaleString('th-TH') : ''}</div>
        <hr/>
        <div><b>ที่อยู่จัดส่ง</b><div class="muted">
          ${addr.fullName || ''} • ${addr.phone || ''}<br/>
          ${addr.line1 || ''}${addr.line2 ? ', '+addr.line2 : ''}<br/>
          ${addr.subdistrict || ''} ${addr.district || ''} ${addr.province || ''} ${addr.postcode || ''}
        </div></div>
        <table>
          <thead><tr><th>สินค้า</th><th class="right">จำนวน</th><th class="right">ราคา/ชิ้น</th><th class="right">รวม</th></tr></thead>
          <tbody>${rows}</tbody>
          <tfoot>
            <tr class="sum"><td colspan="3" class="right">ค่าจัดส่ง</td><td class="right">${ship === '0' ? 'ฟรี' : '฿'+ship}</td></tr>
            <tr class="sum"><td colspan="3" class="right">ส่วนลด</td><td class="right">฿${disc}</td></tr>
            <tr class="sum"><td colspan="3" class="right">ยอดชำระทั้งหมด</td><td class="right">฿${tot}</td></tr>
          </tfoot>
        </table>
        <script>window.onload=()=>window.print();</script>
      </body></html>
    `);
    w.document.close();
  }

  async function handleCopyTracking(){
    const code = order?.tracking?.code || order?.trackingCode;
    if (!code) return;
    try{
      await navigator.clipboard.writeText(String(code));
      setToast('คัดลอกเลขติดตามแล้ว');
    }catch{
      setToast('คัดลอกไม่สำเร็จ');
    }
  }

  function handleOpenTracking(){
    const url = order?.tracking?.url;
    if (url) window.open(url, '_blank');
  }

  // ✅ สั่งซื้ออีกครั้ง → ไปหน้า Checkout พร้อมเฉพาะสินค้าที่สั่งซ้ำ (ไม่ยุ่งตะกร้า)
  async function handleReorder(){
    if (!order?.items?.length) return;
    setWorking(true); setToast('');
    try{
      // backend โหมด checkout จะเช็คราคา/สต๊อก และอาจส่ง warnings มาด้วย
      const { data } = await api.post(`/orders/${id}/reorder`, { mode: 'checkout' });
      const rawItems  = Array.isArray(data?.items) ? data.items : [];
      const warnings  = Array.isArray(data?.warnings) ? data.warnings : [];

      if (!rawItems.length){
        setToast(data?.message || 'สินค้าที่จะสั่งซ้ำไม่พร้อมจำหน่าย');
        return;
      }

      // ส่งทั้งรายการสินค้าและ warnings ไปหน้า Checkout
      nav('/checkout?from=reorder', { state: { items: rawItems, warnings } });
    }catch(e){
      setToast(e?.response?.data?.message || 'ไม่สามารถไปหน้าชำระเงินได้');
    }finally{
      setWorking(false);
    }
  }

  const backTo = loc.state?.from || '/account/orders';
  const addr = order?.shippingAddress || order?.address;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>คำสั่งซื้อ #{id}</h1>
        <div className={styles.tools}>
          <button className={styles.btn} onClick={()=> nav(backTo)}>← กลับรายการ</button>
        </div>
      </div>

      {toast ? <div className={styles.toast}>{toast}</div> : null}

      {loading ? (
        <div className={styles.note}>กำลังโหลด…</div>
      ) : error ? (
        <div className={`${styles.note} ${styles.error}`}>{error}</div>
      ) : !order ? (
        <div className={styles.note}>ไม่พบคำสั่งซื้อ</div>
      ) : (
        <div className={styles.detailCard}>
          <div className={styles.detailTop}>
            <div className={styles.detailLeft}>
              <div className={styles.rowLine}>
                <span>สถานะ</span>
                <span className={`${styles.badge} ${styles['st_'+(order.status||'').toLowerCase()]}`}>
                  {STATUS_LABEL[(order.status||'').toUpperCase()] || (order.status||'').toUpperCase()}
                </span>
              </div>
              {order.createdAt && (
                <div className={styles.rowLine}><span>วันที่สั่งซื้อ</span><span>{new Date(order.createdAt).toLocaleString('th-TH')}</span></div>
              )}
              {(order.paymentMethod || order?.payment?.method) && (
                <div className={styles.rowLine}><span>วิธีชำระ</span><span>{order.paymentMethod || order?.payment?.method}</span></div>
              )}
              <div className={`${styles.rowLine} ${styles.totalLine}`}><span>ยอดรวม</span><span>฿{total.toLocaleString('th-TH')}</span></div>

              <div style={{marginTop:6, color:'#455a64'}}>
                {('summary' in order ? 'subtotal' in (order.summary||{}) : ('subtotal' in order)) && (
                  <div className={styles.rowLine}>
                    <span>ยอดสินค้า</span>
                    <span>฿{Number(order?.summary?.subtotal ?? order?.subtotal ?? 0).toLocaleString('th-TH')}</span>
                  </div>
                )}
                {('summary' in order ? 'shipping' in (order.summary||{}) : ('shipping' in order)) && (
                  <div className={styles.rowLine}>
                    <span>ค่าจัดส่ง</span>
                    <span>{Number(order?.summary?.shipping ?? order?.shipping ?? 0) === 0 ? 'ฟรี' : `฿${Number(order?.summary?.shipping ?? order?.shipping ?? 0).toLocaleString('th-TH')}`}</span>
                  </div>
                )}
                {('summary' in order ? 'discount' in (order.summary||{}) : ('discount' in order)) && (
                  <div className={styles.rowLine}>
                    <span>ส่วนลด</span>
                    <span>฿{Number(order?.summary?.discount ?? order?.discount ?? 0).toLocaleString('th-TH')}</span>
                  </div>
                )}
              </div>

              {(order?.tracking?.code || order?.trackingCode) && (
                <div className={styles.trackingBox}>
                  <div className={styles.trackingRow}>
                    <span>เลขติดตาม</span>
                    <span className={styles.bold}>{order?.tracking?.code || order?.trackingCode}</span>
                  </div>
                  <div className={styles.trackingActions}>
                    <button className={styles.btnTiny} onClick={handleCopyTracking}>คัดลอก</button>
                    {order?.tracking?.url && (
                      <button className={styles.btnTiny} onClick={handleOpenTracking}>เปิดลิงก์ติดตาม</button>
                    )}
                  </div>
                </div>
              )}

              <div className={styles.actionsRow}>
                <button className={styles.btnPrimary} onClick={handlePrint}>พิมพ์/ดาวน์โหลดใบเสร็จ</button>
                <button className={styles.btnGhost} onClick={handleReorder} disabled={working || !order?.items?.length}>สั่งซื้ออีกครั้ง</button>
                <button
                  className={styles.btnDanger}
                  onClick={handleCancel}
                  disabled={working || !canCancel}
                  title={canCancel ? '' : 'สถานะนี้ไม่สามารถยกเลิกได้'}>
                  ยกเลิกคำสั่งซื้อ
                </button>
              </div>
            </div>

            {addr && (
              <div className={styles.detailRight}>
                <div className={styles.addrTitle}>ที่อยู่จัดส่ง</div>
                <div>{addr.fullName} • {addr.phone}</div>
                <div>{addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}</div>
                <div>{addr.subdistrict} {addr.district} {addr.province} {addr.postcode}</div>
              </div>
            )}
          </div>

          <div className={styles.sectionTitle}>รายการสินค้า</div>
          <div className={styles.detailItems}>
            {(order.items && order.items.length ? order.items : ((order.status||'').toUpperCase()==='CANCELLED' ? (order.cancelledItems||[]) : [])).map((it, idx) => {
              const b = it.book || {};
              const bookId = it.bookId || b._id || it._id;
              const cover = it.coverUrl || b.coverUrl || (bookId ? `${apiBase()}/books/${bookId}/cover` : null);
              return (
                <div key={idx} className={styles.detailItemRow}>
                  <img className={styles.cover} src={cover || FallbackImg} alt={it.title || b.title || 'book'} onError={(e)=>{ e.currentTarget.src = FallbackImg; }}/>
                  <div className={styles.itemMain}>
                    <div className={styles.name}>{it.title || b.title || bookId}</div>
                    <div className={styles.dim}>×{it.qty}</div>
                  </div>
                  <div className={styles.linePrice}>฿{Number(it.price||b.price||0).toLocaleString('th-TH')}</div>
                  <div className={styles.lineTotal}>฿{(Number(it.price||b.price||0) * Number(it.qty||1)).toLocaleString('th-TH')}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
