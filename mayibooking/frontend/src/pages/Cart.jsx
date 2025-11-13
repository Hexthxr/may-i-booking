// frontend/src/pages/Cart.jsx  (FULL UI)
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { apiBase } from '../api';
import styles from '../styles/cart.module.css';
import { useAuth } from '../context/AuthContext';
import {
  getLocalCart, addToLocalCart, setQtyLocal, removeLocalItems, clearLocalCart,
  fetchServerCart, addServerCart, setServerQty, removeServerItems, clearServerCart
} from '../utils/cart';

const FallbackImg =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=';

export default function Cart() {
  const nav = useNavigate();
  const { user } = useAuth();
  const isLoggedIn = !!user;

  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState({});
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');

  const normalizeServerItems = (arr) => (arr || []).map((it) => {
    const b = it.book || {};
    const rawId = it.bookId || b._id || it._id;
    const bookId = String(rawId || '');
    const title = it.title || b.title || bookId;
    const price = Number(it.price ?? b.price ?? 0);
    const qty = Math.max(1, Number(it.qty || 1));
    const coverUrl = it.coverUrl || (bookId ? `${apiBase()}/books/${bookId}/cover` : undefined);
    return { bookId, title, price, qty, coverUrl };
  });

  const loadCart = async () => {
    try {
      if (isLoggedIn) {
        const raw = await fetchServerCart(); // returns array
        setItems(normalizeServerItems(raw));
        setNotice('');
      } else {
        setItems(getLocalCart());
        setNotice('โหมดยังไม่เข้าสู่ระบบ • แสดงตะกร้าจากเบราว์เซอร์');
      }
    } catch (e) {
      if (e?.response?.status === 401) {
        setItems(getLocalCart());
        setNotice('เซสชันหมดอายุ/ยังไม่เข้าสู่ระบบ • แสดงตะกร้าจากเบราว์เซอร์');
      } else {
        setNotice('โหลดตะกร้าไม่สำเร็จ');
        console.error('loadCart error:', e);
      }
    }
  };

  useEffect(() => {
    (async () => { try { await loadCart(); } finally { setLoading(false); } })();
    const onLocalUpdate = () => { if (!isLoggedIn) loadCart(); };
    window.addEventListener('mib:cart:update', onLocalUpdate);
    return () => window.removeEventListener('mib:cart:update', onLocalUpdate);
  }, [isLoggedIn]);

  const saveCartLocal = (next) => {
    localStorage.setItem('mib:cart', JSON.stringify(next));
    setItems(next);
    window.dispatchEvent(new Event('mib:cart:update'));
  };

  const toggleAll = (checked) => {
    const next = {};
    if (checked) items.forEach(it => (next[it.bookId] = true));
    setSelected(next);
  };
  const allSelected = items.length > 0 && Object.keys(selected).filter(id => selected[id]).length === items.length;

  const toggleOne = (bookId, checked) =>
    setSelected(prev => ({ ...prev, [bookId]: checked }));

  const selectedItems = useMemo(
    () => items.filter(it => selected[it.bookId]),
    [items, selected]
  );

  const summary = useMemo(() => {
    const subtotal = selectedItems.reduce((s, it) => s + Number(it.price||0) * Number(it.qty||1), 0);
    const shipping = subtotal > 500 ? 0 : (selectedItems.length ? 35 : 0);
    const discount = 0;
    const total = Math.max(0, subtotal + shipping - discount);
    return { subtotal, shipping, discount, total };
  }, [selectedItems]);

  // --- actions ---
  const setQty = async (bookId, q) => {
    const v = Math.max(1, Number(q) || 1);
    if (isLoggedIn) {
      try {
        const raw = await setServerQty(bookId, v); // returns array
        setItems(normalizeServerItems(raw));
      } catch (e) {
        if (e?.response?.status === 401) setNotice('เซสชันหมดอายุ • โปรดเข้าสู่ระบบใหม่');
        console.error('setQty error:', e);
      }
    } else {
      saveCartLocal(setQtyLocal(bookId, v));
    }
  };

  const removeOne = async (bookId) => {
    if (isLoggedIn) {
      try {
        const raw = await removeServerItems([bookId]); // returns array
        setItems(normalizeServerItems(raw));
      } catch (e) { console.error('removeOne error:', e); }
    } else {
      saveCartLocal(removeLocalItems([bookId]));
    }
  };

  const removeSelected = async () => {
    const ids = Object.keys(selected).filter(id => selected[id]);
    if (!ids.length) return;
    if (isLoggedIn) {
      try {
        const raw = await removeServerItems(ids); // returns array
        setItems(normalizeServerItems(raw));
        setSelected({});
      } catch (e) { console.error('removeSelected error:', e); }
    } else {
      saveCartLocal(removeLocalItems(ids));
      setSelected({});
    }
  };

  const clearAll = async () => {
    if (!confirm('ล้างตะกร้าทั้งหมด?')) return;
    if (isLoggedIn) {
      try {
        const raw = await clearServerCart(); // returns array ([])
        setItems(normalizeServerItems(raw));
        setSelected({});
      } catch (e) { console.error('clearAll error:', e); }
    } else {
      saveCartLocal(clearLocalCart());
      setSelected({});
    }
  };

  const checkoutSelected = () => {
    if (!selectedItems.length) return;
    nav('/checkout', { state: { items: selectedItems } });
  };
  const checkoutAll = () => {
    if (!items.length) return;
    nav('/checkout', { state: { items } });
  };

  if (loading) return <div className={`${styles.container} container`}>Loading...</div>;

  return (
    <div className={`${styles.container} container`}>
      {notice ? <div className={styles.card}>{notice}</div> : null}

      <h2 className={styles.title}>ตะกร้าของฉัน</h2>
      <p className={styles.subtitle}>เลือกจ่ายทั้งหมด หรือจ่ายเฉพาะที่เลือก</p>

      {!items.length ? (
        <div className={styles.card}>
          ยังไม่มีสินค้าในตะกร้า
          <button onClick={() => nav('/')} className={styles.linkBtn}>เลือกสินค้า</button>
        </div>
      ) : (
        <>
          {/* Toolbar */}
          <div className={`${styles.card} ${styles.toolbar}`}>
            <label className={styles.inline}>
              <input type="checkbox" checked={allSelected} onChange={(e) => toggleAll(e.target.checked)} />
              เลือกทั้งหมด ({selectedItems.length}/{items.length})
            </label>
            <div className={styles.toolbarRight}>
              <button onClick={removeSelected} disabled={!selectedItems.length} className={styles.dangerBtn}>
                ลบที่เลือก
              </button>
              <button onClick={clearAll} className={styles.secondaryBtn}>ล้างตะกร้า</button>
            </div>
          </div>

          {/* List */}
          <div className={`${styles.card}`}>
            <div className={styles.list}>
              {items.map((it) => {
                const fallback = it.bookId ? `${apiBase()}/books/${it.bookId}/cover` : '';
                const imgSrc = it.coverUrl || fallback || FallbackImg;
                return (
                  <div key={it.bookId} className={styles.itemRow}>
                    <label className={styles.inline}>
                      <input
                        type="checkbox"
                        checked={!!selected[it.bookId]}
                        onChange={(e) => toggleOne(it.bookId, e.target.checked)}
                      />
                    </label>

                    <img
                      className={styles.cover}
                      src={imgSrc}
                      alt={it.title}
                      onError={(e)=>{ e.currentTarget.src = FallbackImg; }}
                    />

                    <div className={styles.itemMain}>
                      <div className={styles.itemTitle}>{it.title}</div>
                      <div className={styles.itemSub}>฿{Number(it.price||0).toLocaleString('th-TH')}</div>
                    </div>

                    <div>
                      <button
                        onClick={() => ((Number(it.qty||1) <= 1) ? removeOne(it.bookId) : setQty(it.bookId, Number(it.qty||1)-1))}
                        className={styles.secondaryBtn}
                        aria-label="ลดจำนวน"
                      >-</button>

                      <input
                        className={styles.qtyInput}
                        type="number"
                        min="1"
                        value={Number(it.qty || 1)}
                        onChange={(e) => {
                          const v = Math.max(1, parseInt(e.target.value || '1', 10) || 1);
                          setQty(it.bookId, v);
                        }}
                      />

                      <button
                        onClick={() => setQty(it.bookId, Number(it.qty||1)+1)}
                        className={styles.secondaryBtn}
                        aria-label="เพิ่มจำนวน"
                      >+</button>
                    </div>

                    <div className={styles.lineTotal}>
                      ฿{(Number(it.price||0)*Number(it.qty||1)).toLocaleString('th-TH')}
                    </div>

                    <div>
                      <button onClick={() => removeOne(it.bookId)} className={styles.removeBtn}>ลบ</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Summary */}
          <div className={`${styles.card} ${styles.summaryGrid}`}>
            <div>
              <div className={styles.sectionTitle}>สรุปยอด (รายการที่เลือก)</div>
              <div className={styles.summaryList}>
                <Row label="ยอดสินค้า" value={`฿${summary.subtotal.toLocaleString('th-TH')}`} />
                <Row label="ค่าจัดส่ง" value={summary.shipping === 0 ? 'ฟรี' : `฿${summary.shipping.toLocaleString('th-TH')}`} />
                <Row label="ส่วนลด" value={`฿${summary.discount.toLocaleString('th-TH')}`} />
                <hr className={styles.hr} />
                <Row big label="ยอดชำระทั้งหมด" value={`฿${summary.total.toLocaleString('th-TH')}`} />
              </div>
            </div>
            <div className={styles.actionCol}>
              <button onClick={checkoutSelected} disabled={!selectedItems.length} className={styles.buyBtn}>จ่ายเฉพาะที่เลือก</button>
              <button onClick={checkoutAll} disabled={!items.length} className={styles.cartBtn}>จ่ายทั้งหมด</button>
              <button onClick={() => nav('/')} className={styles.secondaryBtn}>เลือกสินค้าเพิ่ม</button>
            </div>
          </div>
        </>
      )}
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
