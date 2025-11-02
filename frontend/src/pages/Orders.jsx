// frontend/src/pages/Orders.jsx
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api, { apiBase } from '../api';
import { useAuth } from '../context/AuthContext';
import styles from '../styles/orders.module.css';

const STATUS = ['ALL','TO_SHIP','SHIPPED','COMPLETED','CANCELLED'];
const STATUS_LABEL = {
  ALL: 'ทั้งหมด',
  TO_SHIP: 'ที่ต้องจัดส่ง',
  SHIPPED: 'จัดส่งแล้ว',
  COMPLETED: 'สำเร็จ',
  CANCELLED: 'ยกเลิก',
};
const FallbackImg =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=';

// ฟอกข้อมูลตามแท็บแบบเข้ม (กันรายการหลุดแท็บ)
function applyTabFilter(items, statusTab){
  const s = (statusTab || 'ALL').toUpperCase();
  if (s === 'ALL') return items;

  // "ที่ต้องจัดส่ง" รวม PENDING/PAID/PROCESSING
  if (s === 'TO_SHIP') {
    const toShip = new Set(['PENDING', 'PAID', 'PROCESSING']);
    return items.filter(it => toShip.has((it.status || '').toUpperCase()));
  }

  // ยอมรับทั้ง CANCELLED/CANCELED
  return items.filter(it => {
    const st = (it.status || '').toUpperCase();
    if (s === 'CANCELLED') return st === 'CANCELLED' || st === 'CANCELED';
    return st === s;
  });
}

export default function Orders(){
  const { token } = useAuth();
  const nav = useNavigate();
  const [sp, setSp] = useSearchParams();

  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState('');

  const status = (sp.get('status') || 'ALL').toUpperCase();
  const isLoggedIn = !!token;

  useEffect(()=>{
    if(!isLoggedIn){
      nav('/login', { replace: true, state: { next: '/orders' } });
    }
  }, [isLoggedIn, nav]);

  useEffect(()=>{
    (async ()=>{
      setLoading(true); setError(''); setNotice('');
      try{
        const params = new URLSearchParams();
        params.set('page', String(page));
        params.set('limit', String(pageSize));
        // อย่าส่ง TO_SHIP ไป backend (เป็นสถานะรวมหลายค่า)
        if (status && status !== 'ALL' && status !== 'TO_SHIP') params.set('status', status);
        if (q) params.set('q', q.trim());

        const { data } = await api.get(`/orders?${params.toString()}`);
        const raw = data?.items || data?.orders || data?.data || [];
        const normalized = raw.map(normalizeOrder);

        // ฟอกตามแท็บอีกรอบให้ตรง UI
        const filtered = applyTabFilter(normalized, status);

        setList(filtered);
        // ให้ตัวเลขหน้าตามสิ่งที่ผู้ใช้เห็นจริง ๆ
        setTotal(filtered.length);
      }catch(e){
        setError(e?.response?.data?.message || 'ไม่สามารถโหลดประวัติการสั่งซื้อได้');
      }finally{
        setLoading(false);
      }
    })();
  }, [page, pageSize, status, q]);

  const totalPages = useMemo(()=> Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);

  function normalizeOrder(raw){
    const id = raw._id || raw.id;
    const createdAt = raw.createdAt || raw.created_at || raw.date || null;
    const items = Array.isArray(raw.items) ? raw.items : [];
    const cancelledItems = Array.isArray(raw.cancelledItems) ? raw.cancelledItems : [];
    const paymentMethod = raw.paymentMethod || raw.payment_method || '';
    const shippingAddress = raw.shippingAddress || raw.address || null;
    const summary = raw.summary || {};
    const total = Number(summary.total ?? raw.total ?? items.reduce((s,it)=> s + Number(it.price||0)*Number(it.qty||1),0));
    const status = (raw.status || '').toUpperCase() || 'PENDING';
    return { id, createdAt, items, cancelledItems, paymentMethod, shippingAddress, summary: { ...summary, total }, status };
  }

  const openDetail = (id)=> nav(`/orders/${id}`, { state: { from: '/orders' } });

  // เปลี่ยนแท็บ (update URL + reset page)
  const setStatus = (next) => {
    const nextSp = new URLSearchParams(sp);
    nextSp.set('status', next);
    setSp(nextSp, { replace: true });
    setPage(1);
  };

  // ✅ สั่งซื้ออีกครั้งเฉพาะสินค้าจากออเดอร์นั้น → ไป checkout พร้อม state.items + warnings (ไม่แตะ cart)
  const handleReorder = async (orderId, e) => {
    e?.stopPropagation?.(); // กันเปิดหน้า detail ตอนกดปุ่ม
    setNotice('');
    try{
      const { data } = await api.post(`/orders/${orderId}/reorder`, { mode: 'checkout' });
      const items = Array.isArray(data?.items) ? data.items : [];
      const warnings = Array.isArray(data?.warnings) ? data.warnings : [];
      if (!items.length){
        setNotice(data?.message || 'สินค้าที่จะสั่งซ้ำไม่พร้อมจำหน่าย');
        return;
      }
      nav('/checkout?from=reorder', { state: { items, warnings } });
    }catch(err){
      const msg = err?.response?.data?.message || 'สั่งซื้ออีกครั้งไม่สำเร็จ';
      setNotice(msg);
    }
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>ประวัติการสั่งซื้อ</h1>
        <div className={styles.tools}>
          <input
            className={styles.input}
            placeholder="ค้นหาเลขออเดอร์ / คีย์เวิร์ด"
            value={q}
            onChange={e=>{ setPage(1); setQ(e.target.value); }}
          />
          <select
            className={styles.select}
            value={pageSize}
            onChange={e=>{ setPage(1); setPageSize(Number(e.target.value)); }}>
            {[10,20,30,50].map(n => <option key={n} value={n}>{n}/หน้า</option>)}
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabs} role="tablist" aria-label="ตัวกรองสถานะคำสั่งซื้อ">
        {STATUS.map(s => (
          <button
            key={s}
            role="tab"
            aria-selected={status===s}
            className={`${styles.tab} ${status===s ? styles.tabActive : ''}`}
            onClick={()=> setStatus(s)}
          >
            {STATUS_LABEL[s]}
          </button>
        ))}
      </div>

      {notice ? <div className={styles.toast}>{notice}</div> : null}

      {/* Content */}
      {loading ? (
        <div className={styles.note}>กำลังโหลด…</div>
      ) : error ? (
        <div className={`${styles.note} ${styles.error}`}>{error}</div>
      ) : list.length === 0 ? (
        <div className={styles.empty}>
          ยังไม่มีคำสั่งซื้อในหมวด “{STATUS_LABEL[status]}”
          <button className={styles.btnLink} onClick={()=> nav('/')}>ไปเลือกซื้อหนังสือ</button>
        </div>
      ) : (
        <div className={styles.list}>
          {list.map(ord => {
            const showItems = (ord.items && ord.items.length)
              ? ord.items
              : ((ord.status||'').toUpperCase()==='CANCELLED' ? (ord.cancelledItems||[]) : []);
            const moreCount = Math.max(0, (showItems.length || 0) - 5);

            return (
              <div key={ord.id} className={styles.card} onClick={()=> openDetail(ord.id)}>
                <div className={styles.rowTop}>
                  <div className={styles.left}>
                    <div className={styles.orderId}>#{ord.id}</div>
                    {ord.createdAt && <div className={styles.date}>{new Date(ord.createdAt).toLocaleString('th-TH')}</div>}
                  </div>
                  <div className={styles.right}>
                    <span className={`${styles.badge} ${styles['st_'+ord.status.toLowerCase()]}`}>
                      {STATUS_LABEL[ord.status] || ord.status}
                    </span>
                    <div className={styles.total}>฿{Number(ord.summary.total||0).toLocaleString('th-TH')}</div>
                  </div>
                </div>

                <div className={styles.items}>
                  {showItems.slice(0, 5).map((it, idx) => {
                    const b = it.book || {};
                    const bookId = it.bookId || b._id || it._id;
                    const cover = it.coverUrl || b.coverUrl || (bookId ? `${apiBase()}/books/${bookId}/cover` : null);
                    return (
                      <div key={idx} className={styles.item}>
                        <img
                          className={styles.cover}
                          src={cover || FallbackImg}
                          alt={it.title || b.title || 'book'}
                          onError={(e)=>{ e.currentTarget.src = FallbackImg; }}
                        />
                        <div className={styles.meta}>
                          <div className={styles.name}>{it.title || b.title || bookId}</div>
                          <div className={styles.qtyPrice}>×{it.qty} • ฿{Number(it.price||b.price||0).toLocaleString('th-TH')}</div>
                        </div>
                      </div>
                    );
                  })}
                  {moreCount > 0 && <div className={styles.more}>+{moreCount} รายการ</div>}
                </div>

                {/* Actions */}
                <div className={styles.actionsRow}>
                  <button
                    className={styles.btn}
                    onClick={(e)=> handleReorder(ord.id, e)}
                    title="สั่งซื้อรายการนี้อีกครั้ง (ไปหน้าชำระเงินทันที)">
                    สั่งซื้ออีกครั้ง
                  </button>
                  <button
                    className={styles.btnGhost}
                    onClick={(e)=> { e.stopPropagation(); openDetail(ord.id); }}>
                    ดูรายละเอียด
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pager */}
      <div className={styles.pager}>
        <button className={styles.btn} disabled={page<=1} onClick={()=> setPage(p => Math.max(1, p-1))}>ก่อนหน้า</button>
        <div className={styles.pageInfo}>{page} / {totalPages}</div>
        <button className={styles.btn} disabled={page>=totalPages} onClick={()=> setPage(p => Math.min(totalPages, p+1))}>ถัดไป</button>
      </div>
    </div>
  );
}
