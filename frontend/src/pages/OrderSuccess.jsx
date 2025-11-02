// frontend/src/pages/OrderSuccess.jsx
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../api';
import styles from '../styles/order-success.module.css';

export default function OrderSuccess(){
  const nav = useNavigate();
  const location = useLocation();
  const orderId = location.state?.orderId || location.state?.id || null;
  const placed = !!location.state?.placed;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(!!orderId);
  const [error, setError] = useState('');

  useEffect(()=>{
    if (!placed && !orderId) {
      nav('/orders', { replace: true });
    }
  }, [placed, orderId, nav]);

  useEffect(()=>{
    if (!orderId) return;
    (async ()=>{
      setLoading(true); setError('');
      try{
        const { data } = await api.get(`/orders/${orderId}`);
        setOrder(data?.order || data || null);
      }catch(e){
        setError(e?.response?.data?.message || 'ไม่สามารถโหลดข้อมูลคำสั่งซื้อได้');
      }finally{
        setLoading(false);
      }
    })();
  }, [orderId]);

  const total = useMemo(()=>{
    if (order?.summary?.total != null) return Number(order.summary.total);
    if (Array.isArray(order?.items)) {
      const sub = order.items.reduce((s,it)=> s + Number(it.price||0)*Number(it.qty||1), 0);
      const ship = Number(order?.summary?.shipping ?? 0);
      const disc = Number(order?.summary?.discount ?? 0);
      return Math.max(0, sub + ship - disc);
    }
    return location.state?.total ?? 0;
  }, [order, location.state]);

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.iconWrap}>
          <div className={styles.checkIcon}>✓</div>
        </div>
        <h2 className={styles.title}>สั่งซื้อสำเร็จ!</h2>
        <p className={styles.subtitle}>ขอบคุณที่สั่งซื้อกับ <b>May i Booking</b></p>

        {loading ? (
          <div className={styles.note}>กำลังดึงรายละเอียดคำสั่งซื้อ…</div>
        ) : error ? (
          <div className={styles.error}>{error}</div>
        ) : (
          <div className={styles.summary}>
            {orderId && <div className={styles.row}><span>เลขคำสั่งซื้อ</span><span className={styles.bold}>{orderId}</span></div>}
            {total ? <div className={`${styles.row} ${styles.big}`}><span>ยอดชำระทั้งหมด</span><span className={styles.bold}>฿{total.toLocaleString('th-TH')}</span></div> : null}
            {order?.paymentMethod ? <div className={styles.row}><span>วิธีชำระ</span><span>{order.paymentMethod}</span></div> : null}
            {order?.shippingAddress ? (
              <div className={styles.addr}>
                <div className={styles.addrTitle}>ที่อยู่จัดส่ง</div>
                <div>{order.shippingAddress.fullName} • {order.shippingAddress.phone}</div>
                <div>{order.shippingAddress.line1}{order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ''}</div>
                <div>{order.shippingAddress.subdistrict} {order.shippingAddress.district} {order.shippingAddress.province} {order.shippingAddress.postcode}</div>
              </div>
            ) : null}
          </div>
        )}

        <div className={styles.actions}>
          <button className={styles.primary} onClick={()=> nav('/orders', { replace: true })}>
            ไปหน้าคำสั่งซื้อของฉัน
          </button>
          <button className={styles.ghost} onClick={()=> nav('/', { replace: true })}>
            เลือกซื้อหนังสือต่อ
          </button>
        </div>
      </div>
    </div>
  );
}
