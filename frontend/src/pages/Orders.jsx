// frontend/src/pages/Orders.jsx
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import api, { apiBase } from '../api';
import { useAuth } from '../context/AuthContext';
import styles from '../styles/orders.module.css';

const STATUS = ['ALL', 'TO_SHIP', 'SHIPPED', 'COMPLETED', 'CANCELLED'];
const STATUS_LABEL = {
  ALL: 'ทั้งหมด',
  TO_SHIP: 'ที่ต้องจัดส่ง',
  SHIPPED: 'จัดส่งแล้ว',
  COMPLETED: 'สำเร็จ',
  CANCELLED: 'ยกเลิก',
};

const FallbackImg =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=';

// ฟอกตามแท็บ
function applyTabFilter(items, statusTab) {
  const s = (statusTab || 'ALL').toUpperCase();
  if (s === 'ALL') return items;

  if (s === 'TO_SHIP') {
    const toShip = new Set(['PENDING', 'PAID', 'PROCESSING']);
    return items.filter(it => toShip.has((it.status || '').toUpperCase()));
  }

  return items.filter(it => {
    const st = (it.status || '').toUpperCase();
    if (s === 'CANCELLED') return st === 'CANCELLED' || st === 'CANCELED';
    return st === s;
  });
}

function normalizeOrder(raw) {
  const id = raw._id || raw.id;
  const createdAt = raw.createdAt || raw.created_at || raw.date || null;
  const items = Array.isArray(raw.items) ? raw.items : [];
  const cancelledItems = Array.isArray(raw.cancelledItems) ? raw.cancelledItems : [];
  const paymentMethod = raw.paymentMethod || raw.payment?.method || raw.payment_method || '';
  const shippingAddress = raw.shippingAddress || raw.address || null;
  const summary = raw.summary || {};
  const total =
    Number(
      summary.total ??
        raw.total ??
        items.reduce((s, it) => s + Number(it.price || 0) * Number(it.qty || 1), 0)
    ) || 0;
  const status = (raw.status || '').toUpperCase() || 'PENDING';

  return {
    id,
    createdAt,
    items,
    cancelledItems,
    paymentMethod,
    shippingAddress,
    summary: { ...summary, total },
    status,
  };
}

export default function Orders() {
  const { token } = useAuth();
  const nav = useNavigate();
  const [sp, setSp] = useSearchParams();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [q, setQ] = useState('');

  const status = (sp.get('status') || 'ALL').toUpperCase();
  const isLoggedIn = !!token;

  useEffect(() => {
    if (!isLoggedIn) {
      nav('/login', { replace: true, state: { next: '/orders' } });
    }
  }, [isLoggedIn, nav]);

  useEffect(() => {
    if (!isLoggedIn) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError('');
      setNotice('');
      try {
        const { data } = await api.get('/orders');
        const raw = Array.isArray(data)
          ? data
          : data?.items || data?.orders || data?.data || [];
        const normalized = raw.map(normalizeOrder);
        if (!cancelled) setOrders(normalized);
      } catch (e) {
        if (!cancelled)
          setError(e?.response?.data?.message || 'ไม่สามารถโหลดประวัติการสั่งซื้อได้');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoggedIn]);

  // filter
  const filtered = useMemo(() => {
    let list = applyTabFilter(orders, status);
    const key = q.trim().toLowerCase();
    if (key) {
      list = list.filter(ord => {
        const idStr = String(ord.id || '').toLowerCase();
        const addrName = (ord.shippingAddress?.fullName || '').toLowerCase();
        const itemMatch = (ord.items || []).some(it =>
          String(it.title || '').toLowerCase().includes(key)
        );
        return idStr.includes(key) || addrName.includes(key) || itemMatch;
      });
    }
    return list;
  }, [orders, status, q]);

  const total = filtered.length;
  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);

  useEffect(() => setPage(1), [status, q, pageSize]);
  useEffect(() => setPage(p => Math.min(p, totalPages)), [totalPages]);

  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const openDetail = id => nav(`/orders/${id}`, { state: { from: '/orders' } });

  const setStatus = next => {
    const nextSp = new URLSearchParams(sp);
    nextSp.set('status', next);
    setSp(nextSp, { replace: true });
    setPage(1);
  };

  const handleReorder = async (orderId, e) => {
    e?.stopPropagation?.();
    setNotice('');
    try {
      const { data } = await api.post(`/orders/${orderId}/reorder`, { mode: 'checkout' });
      const items = Array.isArray(data?.items) ? data.items : [];
      const warnings = Array.isArray(data?.warnings) ? data.warnings : [];
      if (!items.length) {
        setNotice(data?.message || 'สินค้าที่จะสั่งซ้ำไม่พร้อมจำหน่าย');
        return;
      }
      nav('/checkout?from=reorder', { state: { items, warnings } });
    } catch (err) {
      const msg = err?.response?.data?.message || 'สั่งซื้ออีกครั้งไม่สำเร็จ';
      setNotice(msg);
    }
  };

  if (!isLoggedIn) return null;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>ประวัติการสั่งซื้อ</h1>
        <div className={styles.tools}>
          <input
            className={styles.input}
            placeholder="ค้นหาเลขออเดอร์ / ชื่อหนังสือ / ชื่อลูกค้า"
            value={q}
            onChange={e => setQ(e.target.value)}
          />
          <select
            className={styles.select}
            value={pageSize}
            onChange={e => setPageSize(Number(e.target.value) || 10)}
          >
            {[10, 20, 30, 50].map(n => (
              <option key={n} value={n}>
                {n}/หน้า
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabs} role="tablist">
        {STATUS.map(s => (
          <button
            key={s}
            role="tab"
            aria-selected={status === s}
            className={`${styles.tab} ${status === s ? styles.tabActive : ''}`}
            onClick={() => setStatus(s)}
          >
            {STATUS_LABEL[s]}
          </button>
        ))}
      </div>

      {notice && <div className={styles.toast}>{notice}</div>}

      {/* Data */}
      {loading ? (
        <div className={styles.note}>กำลังโหลด…</div>
      ) : error ? (
        <div className={`${styles.note} ${styles.error}`}>{error}</div>
      ) : paged.length === 0 ? (
        <div className={styles.empty}>
          ยังไม่มีคำสั่งซื้อในหมวด “{STATUS_LABEL[status]}”
          <button className={styles.btnLink} onClick={() => nav('/')}>
            ไปเลือกซื้อหนังสือ
          </button>
        </div>
      ) : (
        <div className={styles.list}>
          {paged.map(ord => {
            const showItems =
              ord.items && ord.items.length
                ? ord.items
                : ord.status === 'CANCELLED'
                ? ord.cancelledItems || []
                : [];

            const moreCount = Math.max(0, (showItems.length || 0) - 5);

            const statusClassName = (() => {
              const base = (ord.status || '').toLowerCase();
              if (base === 'cancelled') return styles.st_canceled;
              return styles['st_' + base] || '';
            })();

            return (
              <div key={ord.id} className={styles.card} onClick={() => openDetail(ord.id)}>
                <div className={styles.rowTop}>
                  <div className={styles.left}>
                    <div className={styles.orderId}>#{ord.id}</div>
                    <div className={styles.date}>
                      {ord.createdAt ? new Date(ord.createdAt).toLocaleString('th-TH') : ''}
                    </div>
                  </div>

                  <div className={styles.right}>
                    <span className={`${styles.badge} ${statusClassName}`}>
                      {STATUS_LABEL[ord.status] || ord.status}
                    </span>
                    <div className={styles.total}>
                      ฿{Number(ord.summary.total || 0).toLocaleString('th-TH')}
                    </div>
                  </div>
                </div>

                {/* แสดงรายการหนังสือของออเดอร์ */}
                <div className={styles.items}>
                  {showItems.slice(0, 5).map((it, idx) => {
                    const b = it.book || {};
                    const bookId = it.bookId || b._id || it._id;
                    const cover =
                      it.coverUrl ||
                      b.coverUrl ||
                      (bookId ? `${apiBase()}/books/${bookId}/cover` : null);

                    return (
                      <div key={idx} className={styles.item}>
                        <img
                          className={styles.cover}
                          src={cover || FallbackImg}
                          alt={it.title || b.title || 'book'}
                          onError={e => (e.currentTarget.src = FallbackImg)}
                        />
                        <div className={styles.meta}>
                          <div className={styles.name}>{it.title || b.title || bookId}</div>
                          <div className={styles.qtyPrice}>
                            ×{it.qty} • ฿{Number(it.price || b.price || 0).toLocaleString('th-TH')}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {moreCount > 0 && <div className={styles.more}>+{moreCount} รายการ</div>}
                </div>

                {/* Action buttons */}
                <div className={styles.actionsRow}>
                  {/* ปุ่มสั่งซ้ำ */}
                  <button
                    className={styles.btn}
                    onClick={e => handleReorder(ord.id, e)}
                    title="สั่งซื้อรายการนี้อีกครั้ง"
                  >
                    สั่งซื้ออีกครั้ง
                  </button>

                  {/* ปุ่มดูรายละเอียด */}
                  <button
                    className={styles.btnGhost}
                    onClick={e => {
                      e.stopPropagation();
                      openDetail(ord.id);
                    }}
                  >
                    ดูรายละเอียด
                  </button>

                  {/* ⭐ ปุ่มใหม่: ติดตามพัสดุ */}
                  <Link
                    to={`/track?orderId=${encodeURIComponent(ord.id)}`}
                    className={styles.btn}
                    onClick={e => e.stopPropagation()}
                  >
                    ติดตามพัสดุ
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pager */}
      {paged.length > 0 && (
        <div className={styles.pager}>
          <button
            className={styles.btn}
            disabled={page <= 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
          >
            ก่อนหน้า
          </button>
          <div className={styles.pageInfo}>
            {page} / {totalPages}
          </div>
          <button
            className={styles.btn}
            disabled={page >= totalPages}
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          >
            ถัดไป
          </button>
        </div>
      )}
    </div>
  );
}
