// frontend/src/pages/AdminOrderSlip.jsx
import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api, { apiBase } from '../api';
import styles from '../styles/orders.module.css';

// ตัด /api ทิ้งให้เหลือ root ของ backend เช่น http://localhost:4000
function backendRoot() {
  const b = apiBase() || '';
  return b.replace(/\/api\/?$/i, '');
}

// สร้าง URL รูปสลิปให้พร้อมใช้
function buildSlipUrl(order) {
  const raw = order?.payment?.slipUrl;
  if (!raw) return '';

  // ถ้าเป็น URL เต็มอยู่แล้ว (เช่น https://...) ก็ใช้เลย
  if (/^https?:\/\//i.test(raw)) return raw;

  const root = backendRoot();
  if (raw.startsWith('/')) return root + raw;
  return root + '/' + raw.replace(/^\/+/, '');
}

export default function AdminOrderSlip() {
  const { id } = useParams();
  const nav = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr('');
      try {
        const { data } = await api.get(`/orders/${id}`);
        setOrder(data?.order || null);
      } catch (e) {
        console.error(e);
        setErr(e?.response?.data?.message || 'ไม่สามารถดึงข้อมูลออเดอร์ได้');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const imgSrc = useMemo(() => buildSlipUrl(order), [order]);
  const hasSlip = !!imgSrc;

  const handleImgError = () => {
    setErr('ไม่สามารถโหลดรูปสลิปได้');
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>สลิปโอนเงินคำสั่งซื้อ #{String(id || '').slice(-8)}</h2>
        <button type="button" className={styles.btnSmall} onClick={() => nav(-1)}>
          ← กลับไปหน้ารายการออเดอร์
        </button>
      </div>

      {loading ? (
        <div className={styles.empty}>กำลังโหลด...</div>
      ) : err && !hasSlip ? (
        <div className={styles.empty}>{err}</div>
      ) : !hasSlip ? (
        <div className={styles.empty}>ออเดอร์นี้ไม่มีสลิปแนบมา</div>
      ) : err ? (
        <div className={styles.empty}>{err}</div>
      ) : (
        <div className={styles.slipPage}>
          <img
            src={imgSrc}
            alt=""
            className={styles.slipImage}
            onError={handleImgError}
          />
        </div>
      )}
    </div>
  );
}
