// // frontend/src/pages/AdminOrders.jsx
// import { useEffect, useState, useMemo } from 'react';
// import { useNavigate, useSearchParams } from 'react-router-dom';
// import api from '../api';
// import styles from '../styles/orders.module.css';

// const STATUS_LABEL = {
//   PENDING: 'รอชำระ / รอดำเนินการ',
//   PAID: 'ที่ต้องจัดส่ง',
//   PROCESSING: 'กำลังเตรียมของ',
//   SHIPPED: 'จัดส่งแล้ว',
//   COMPLETED: 'จัดส่งถึงแล้ว',
//   CANCELLED: 'ยกเลิก',
//   CANCELED: 'ยกเลิก',
// };

// function formatDate(iso) {
//   if (!iso) return '-';
//   const d = new Date(iso);
//   if (Number.isNaN(d.getTime())) return iso;
//   return d.toLocaleString('th-TH', {
//     year: 'numeric',
//     month: 'short',
//     day: '2-digit',
//     hour: '2-digit',
//     minute: '2-digit',
//   });
// }

// function statusClass(status) {
//   const s = (status || '').toLowerCase();
//   if (s === 'pending') return styles.st_pending;
//   if (s === 'paid') return styles.st_paid;
//   if (s === 'processing') return styles.st_processing;
//   if (s === 'shipped') return styles.st_shipped;
//   if (s === 'completed') return styles.st_completed;
//   if (s === 'cancelled' || s === 'canceled') return styles.st_canceled;
//   return '';
// }

// // แปลง path slip ให้ครอบทุกเคส /uploads, uploads, /api/uploads
// function resolveSlipUrl(order) {
//   const raw = order?.payment?.slipUrl;
//   if (!raw) return '';

//   // ถ้าเป็น URL เต็มอยู่แล้วก็ใช้เลย
//   if (/^https?:\/\//i.test(raw)) return raw;

//   let p = raw.trim();

//   // ถ้ามี /api/uploads ให้ตัด /api ออก
//   if (p.startsWith('/api/uploads')) {
//     p = p.replace(/^\/api/, '');
//   }

//   // ถ้าไม่ได้ขึ้นต้นด้วย / ให้เติม
//   if (!p.startsWith('/')) {
//     p = '/' + p.replace(/^\/+/, '');
//   }

//   return p; // เช่น /uploads/slips/xxx.png
// }

// export default function AdminOrders() {
//   const nav = useNavigate();
//   const [searchParams, setSearchParams] = useSearchParams();

//   const [orders, setOrders] = useState([]);
//   const [page, setPage] = useState(() => {
//     const p = parseInt(searchParams.get('page') || '1', 10);
//     return Number.isNaN(p) || p < 1 ? 1 : p;
//   });
//   const [totalPages, setTotalPages] = useState(1);
//   const [total, setTotal] = useState(0);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');
//   const [notice, setNotice] = useState('');

//   // sync page -> query string
//   useEffect(() => {
//     const params = new URLSearchParams(searchParams);
//     params.set('page', String(page));
//     setSearchParams(params, { replace: true });
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [page]);

//   useEffect(() => {
//     (async () => {
//       setLoading(true);
//       setError('');
//       setNotice('');
//       try {
//         const params = new URLSearchParams();
//         params.set('page', String(page));
//         params.set('limit', '10'); // 10 orders per page

//         const { data } = await api.get(`/orders/admin?${params.toString()}`);
//         const items = Array.isArray(data) ? data : data.items || [];
//         const totalFromApi = data?.total ?? items.length ?? 0;
//         const pagesFromApi = data?.totalPages ?? Math.max(1, Math.ceil(totalFromApi / 10));

//         setOrders(items);
//         setTotal(totalFromApi);
//         setTotalPages(pagesFromApi || 1);
//       } catch (e) {
//         console.error('load admin orders error:', e);
//         setError(e?.response?.data?.message || 'ไม่สามารถโหลดรายการคำสั่งซื้อได้');
//       } finally {
//         setLoading(false);
//       }
//     })();
//   }, [page, searchParams]);

//   const hasOrders = useMemo(() => Array.isArray(orders) && orders.length > 0, [orders]);

//   const openDetail = (id) => {
//     if (!id) return;
//     nav(`/orders/${id}`);
//   };

//   const openSlipPage = (id) => {
//     if (!id) return;
//     nav(`/admin/orders/${id}/slip`);
//   };

//   const handleMarkCompleted = async (id) => {
//     try {
//       setNotice('');
//       const { data } = await api.patch(`/orders/${id}/complete`);
//       const updated = data?.order;
//       if (!updated) return;
//       setOrders((prev) =>
//         prev.map((o) =>
//           String(o._id || o.id) === String(updated._id) ? { ...o, status: updated.status } : o
//         )
//       );
//       setNotice('อัปเดตสถานะออเดอร์เป็น “จัดส่งถึงแล้ว” เรียบร้อย');
//     } catch (e) {
//       console.error('mark complete error', e);
//       setNotice(e?.response?.data?.message || 'ไม่สามารถอัปเดตสถานะได้');
//     }
//   };

//   return (
//     <div className={styles.container}>
//       <div className={styles.header}>
//         <h2 className={styles.title}>คำสั่งซื้อทั้งหมด (สำหรับแอดมิน)</h2>
//         <div className={styles.tools}>
//           <span className={styles.adminMeta}>
//             แสดงหน้าละ 10 ออเดอร์ (ทั้งหมด {total} ออเดอร์)
//           </span>
//         </div>
//       </div>

//       {notice && <div className={styles.toast}>{notice}</div>}
//       {error && <div className={styles.empty}>{error}</div>}

//       {loading ? (
//         <div className={styles.empty}>กำลังโหลดรายการคำสั่งซื้อ...</div>
//       ) : !hasOrders ? (
//         <div className={styles.empty}>ยังไม่มีคำสั่งซื้อในระบบ</div>
//       ) : (
//         <div className={styles.list}>
//           {orders.map((ord) => {
//             const id = ord._id || ord.id;
//             const status = (ord.status || '').toUpperCase();
//             const slipUrl = resolveSlipUrl(ord);
//             const user = ord.user || {};
//             const name = user.username || '-';
//             const email = user.email || '';

//             const totalAmount =
//               (ord.summary && (ord.summary.total ?? ord.summary.grand ?? ord.summary.amount)) ??
//               ord.total ??
//               0;

//             const canMarkCompleted =
//               status !== 'COMPLETED' && status !== 'CANCELLED' && status !== 'CANCELED';

//             return (
//               <div key={id} className={styles.card}>
//                 <div className={styles.rowTop}>
//                   <div className={styles.left}>
//                     <div className={styles.orderId}>คำสั่งซื้อ #{String(id).slice(-8)}</div>
//                     <div className={styles.date}>{formatDate(ord.createdAt)}</div>
//                     <div className={styles.customer}>
//                       👤 บัญชีผู้สั่งซื้อ:{' '}
//                       <strong>{name}</strong>
//                       {email ? ` (${email})` : ''}
//                     </div>
//                     <div className={styles.adminMeta}>
//                       ยอดรวม: ฿{Number(totalAmount || 0).toLocaleString('th-TH')}
//                     </div>
//                   </div>
//                   <div className={styles.right}>
//                     <span className={styles.badge + ' ' + statusClass(status)}>
//                       {STATUS_LABEL[status] || status || 'ไม่ทราบสถานะ'}
//                     </span>
//                   </div>
//                 </div>

//                 {/* 🔧 ไม่มีรูปสลิปแล้ว เหลือเฉพาะข้อมูล + ปุ่ม */}
//                 <div style={{ marginTop: 10 }}>
//                   <div className={styles.adminMeta}>
//                     วิธีชำระเงิน: {ord.payment?.method || 'ไม่ระบุ'}
//                   </div>

//                   <div className={styles.adminActions}>
//                     <button
//                       type="button"
//                       className={`${styles.adminBtn} ${styles.adminBtnBlue}`}
//                       disabled={!slipUrl}
//                       onClick={() => openSlipPage(id)}
//                     >
//                       ดูสลิปโอนเงิน
//                     </button>

//                     <button
//                       type="button"
//                       className={`${styles.adminBtn} ${styles.adminBtnGreen}`}
//                       disabled={!canMarkCompleted}
//                       onClick={() => handleMarkCompleted(id)}
//                     >
//                       ยืนยันส่งสินค้าแล้ว
//                     </button>

//                     <button
//                       type="button"
//                       className={`${styles.adminBtn} ${styles.adminBtnYellow}`}
//                       onClick={() => openDetail(id)}
//                     >
//                       ดูรายละเอียดคำสั่งซื้อ
//                     </button>
//                   </div>
//                 </div>
//               </div>
//             );
//           })}
//         </div>
//       )}

//       {/* pager */}
//       <div className={styles.pager}>
//         <button
//           type="button"
//           className={styles.btn}
//           disabled={page <= 1}
//           onClick={() => setPage((p) => Math.max(1, p - 1))}
//         >
//           ก่อนหน้า
//         </button>
//         <div className={styles.pageInfo}>
//           {page} / {totalPages}
//         </div>
//         <button
//           type="button"
//           className={styles.btn}
//           disabled={page >= totalPages}
//           onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
//         >
//           ถัดไป
//         </button>
//       </div>
//     </div>
//   );
// }
// frontend/src/pages/AdminOrders.jsx
import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api';
import styles from '../styles/orders.module.css';

const STATUS_LABEL = {
  PENDING: 'รอชำระ / รอดำเนินการ',
  PAID: 'ที่ต้องจัดส่ง',
  PROCESSING: 'กำลังเตรียมของ',
  SHIPPED: 'จัดส่งแล้ว',
  COMPLETED: 'จัดส่งถึงแล้ว',
  CANCELLED: 'ยกเลิกคำสั่งซื้อ',
  CANCELED: 'ยกเลิกคำสั่งซื้อ',
};

function formatDate(iso) {
  if (!iso) return '-';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function statusClass(status) {
  const s = (status || '').toLowerCase();
  if (s === 'pending') return styles.st_pending;
  if (s === 'paid') return styles.st_paid;
  if (s === 'processing') return styles.st_processing;
  if (s === 'shipped') return styles.st_shipped;
  if (s === 'completed') return styles.st_completed;
  if (s === 'cancelled' || s === 'canceled') return styles.st_canceled;
  return '';
}

// แปลง path slip ให้ครอบทุกเคส /uploads, uploads, /api/uploads
function resolveSlipUrl(order) {
  const raw = order?.payment?.slipUrl;
  if (!raw) return '';

  // ถ้าเป็น URL เต็มอยู่แล้วก็ใช้เลย
  if (/^https?:\/\//i.test(raw)) return raw;

  let p = raw.trim();

  // ถ้ามี /api/uploads ให้ตัด /api ออก
  if (p.startsWith('/api/uploads')) {
    p = p.replace(/^\/api/, '');
  }

  // ถ้าไม่ได้ขึ้นต้นด้วย / ให้เติม
  if (!p.startsWith('/')) {
    p = '/' + p.replace(/^\/+/, '');
  }

  return p; // เช่น /uploads/slips/xxx.png
}

export default function AdminOrders() {
  const nav = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [orders, setOrders] = useState([]);
  const [page, setPage] = useState(() => {
    const p = parseInt(searchParams.get('page') || '1', 10);
    return Number.isNaN(p) || p < 1 ? 1 : p;
  });
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  // sync page -> query string
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    params.set('page', String(page));
    setSearchParams(params, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError('');
      setNotice('');
      try {
        const params = new URLSearchParams();
        params.set('page', String(page));
        params.set('limit', '10'); // 10 orders per page

        const { data } = await api.get(`/orders/admin?${params.toString()}`);
        const items = Array.isArray(data) ? data : data.items || [];
        const totalFromApi = data?.total ?? items.length ?? 0;
        const pagesFromApi = data?.totalPages ?? Math.max(1, Math.ceil(totalFromApi / 10));

        setOrders(items);
        setTotal(totalFromApi);
        setTotalPages(pagesFromApi || 1);
      } catch (e) {
        console.error('load admin orders error:', e);
        setError(e?.response?.data?.message || 'ไม่สามารถโหลดรายการคำสั่งซื้อได้');
      } finally {
        setLoading(false);
      }
    })();
  }, [page, searchParams]);

  const hasOrders = useMemo(() => Array.isArray(orders) && orders.length > 0, [orders]);

  const openDetail = (id) => {
    if (!id) return;
    nav(`/orders/${id}`);
  };

  const openSlipPage = (id) => {
    if (!id) return;
    nav(`/admin/orders/${id}/slip`);
  };

  const handleMarkCompleted = async (id) => {
    try {
      setNotice('');
      const { data } = await api.patch(`/orders/${id}/complete`);
      const updated = data?.order;
      if (!updated) return;
      setOrders((prev) =>
        prev.map((o) =>
          String(o._id || o.id) === String(updated._id)
            ? { ...o, status: updated.status }
            : o
        )
      );
      setNotice('อัปเดตสถานะออเดอร์เป็น “จัดส่งถึงแล้ว” เรียบร้อย');
    } catch (e) {
      console.error('mark complete error', e);
      setNotice(e?.response?.data?.message || 'ไม่สามารถอัปเดตสถานะได้');
    }
  };

  // ✅ ปุ่มใหม่: ปฏิเสธออเดอร์
  const handleCancelOrder = async (id) => {
    const ok = window.confirm('ยืนยันที่จะปฏิเสธคำสั่งซื้อนี้หรือไม่?');
    if (!ok) return;

    try {
      setNotice('');
      const { data } = await api.patch(`/orders/${id}/cancel`);
      const updated = data?.order || data;
      if (!updated) return;
      setOrders((prev) =>
        prev.map((o) =>
          String(o._id || o.id) === String(updated._id || updated.id)
            ? { ...o, status: updated.status }
            : o
        )
      );
      setNotice('ปฏิเสธคำสั่งซื้อเรียบร้อยแล้ว');
    } catch (e) {
      console.error('cancel order error', e);
      setNotice(e?.response?.data?.message || 'ไม่สามารถปฏิเสธคำสั่งซื้อได้');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>คำสั่งซื้อทั้งหมด (สำหรับแอดมิน)</h2>
        <div className={styles.tools}>
          <span className={styles.adminMeta}>
            แสดงหน้าละ 10 ออเดอร์ (ทั้งหมด {total} ออเดอร์)
          </span>
        </div>
      </div>

      {notice && <div className={styles.toast}>{notice}</div>}
      {error && <div className={styles.empty}>{error}</div>}

      {loading ? (
        <div className={styles.empty}>กำลังโหลดรายการคำสั่งซื้อ...</div>
      ) : !hasOrders ? (
        <div className={styles.empty}>ยังไม่มีคำสั่งซื้อในระบบ</div>
      ) : (
        <div className={styles.list}>
          {orders.map((ord) => {
            const id = ord._id || ord.id;
            const status = (ord.status || '').toUpperCase();
            const slipUrl = resolveSlipUrl(ord);
            const user = ord.user || {};
            const name = user.username || '-';
            const email = user.email || '';

            const totalAmount =
              (ord.summary &&
                (ord.summary.total ?? ord.summary.grand ?? ord.summary.amount)) ??
              ord.total ??
              0;

            const canMarkCompleted =
              status !== 'COMPLETED' &&
              status !== 'CANCELLED' &&
              status !== 'CANCELED';

            const canCancel =
              status !== 'CANCELLED' &&
              status !== 'CANCELED' &&
              status !== 'COMPLETED';

            return (
              <div key={id} className={styles.card}>
                <div className={styles.rowTop}>
                  <div className={styles.left}>
                    <div className={styles.orderId}>คำสั่งซื้อ #{String(id).slice(-8)}</div>
                    <div className={styles.date}>{formatDate(ord.createdAt)}</div>
                    <div className={styles.customer}>
                      👤 บัญชีผู้สั่งซื้อ:{' '}
                      <strong>{name}</strong>
                      {email ? ` (${email})` : ''}
                    </div>
                    <div className={styles.adminMeta}>
                      ยอดรวม: ฿{Number(totalAmount || 0).toLocaleString('th-TH')}
                    </div>
                  </div>
                  <div className={styles.right}>
                    <span className={styles.badge + ' ' + statusClass(status)}>
                      {STATUS_LABEL[status] || status || 'ไม่ทราบสถานะ'}
                    </span>
                  </div>
                </div>

                <div style={{ marginTop: 10 }}>
                  <div className={styles.adminMeta}>
                    วิธีชำระเงิน: {ord.payment?.method || 'ไม่ระบุ'}
                  </div>

                  {/* แถวปุ่มทั้งหมด */}
                  <div className={styles.adminActions}>
                    {/* กลุ่มปุ่มฝั่งซ้าย 3 ปุ่มเดิม */}
                    <div className={styles.adminActionsMain}>
                      <button
                        type="button"
                        className={`${styles.adminBtn} ${styles.adminBtnBlue}`}
                        disabled={!slipUrl}
                        onClick={() => openSlipPage(id)}
                      >
                        ดูสลิปโอนเงิน
                      </button>

                      <button
                        type="button"
                        className={`${styles.adminBtn} ${styles.adminBtnGreen}`}
                        disabled={!canMarkCompleted}
                        onClick={() => handleMarkCompleted(id)}
                      >
                        ยืนยันส่งสินค้าแล้ว
                      </button>

                      <button
                        type="button"
                        className={`${styles.adminBtn} ${styles.adminBtnYellow}`}
                        onClick={() => openDetail(id)}
                      >
                        ดูรายละเอียดคำสั่งซื้อ
                      </button>
                    </div>

                    {/* ปุ่มใหม่: ปฏิเสธออเดอร์ (ชิดขวา) */}
                    <button
                      type="button"
                      className={`${styles.adminBtn} ${styles.adminBtnDanger}`}
                      disabled={!canCancel}
                      onClick={() => handleCancelOrder(id)}
                    >
                      ปฏิเสธออเดอร์
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* pager */}
      <div className={styles.pager}>
        <button
          type="button"
          className={styles.btn}
          disabled={page <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          ก่อนหน้า
        </button>
        <div className={styles.pageInfo}>
          {page} / {totalPages}
        </div>
        <button
          type="button"
          className={styles.btn}
          disabled={page >= totalPages}
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
        >
          ถัดไป
        </button>
      </div>
    </div>
  );
}
