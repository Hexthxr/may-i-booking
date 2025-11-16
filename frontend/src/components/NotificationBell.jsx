// frontend/src/components/NotificationBell.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import styles from "../styles/notify.module.css";
import { useAuth } from "../context/AuthContext";

// กระดิ่ง
const BELL = (
  <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
    <path
      fill="currentColor"
      d="M12 22a2 2 0 0 0 2-2h-4a2 2 0 0 0 2 2Zm6-6V11c0-3.07-1.64-5.64-4.5-6.32V4a1.5 1.5 0 0 0-3 0v.68C7.64 5.36 6 7.92 6 11v5l-1.29 1.29A1 1 0 0 0 5 19h14a1 1 0 0 0 .71-1.71Z"
    />
  </svg>
);

// ใช้ key แยกตาม user
const RESERVATION_KEY = (user) => {
  if (!user) return "mib:reservations:guest";
  const id = user?._id || user?.id || user?.email || "user";
  return `mib:reservations:${id}`;
};

function readReservations(key) {
  if (!key) return [];
  try {
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch {
    return [];
  }
}

export default function NotificationBell() {
  const nav = useNavigate();
  const { user } = useAuth();
  const key = RESERVATION_KEY(user);

  const [open, setOpen] = useState(false);
  const [items, setItems] = useState(() => readReservations(key));
  const ref = useRef(null);

  const count = items.length;
  const latest = useMemo(
    () => items.slice().reverse().slice(0, 6),
    [items]
  );

  // โหลดใหม่ทุกครั้งที่ user เปลี่ยน (key เปลี่ยน)
  useEffect(() => {
    setItems(readReservations(key));
  }, [key]);

  // อัปเดตเมื่อมี event แจ้งเตือน + storage เปลี่ยน
  useEffect(() => {
    const onNotify = () => setItems(readReservations(key));
    const onStorage = (e) => {
      if (!key) return;
      if (e.key === key) onNotify();
    };

    window.addEventListener("mib:notify", onNotify);
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("mib:notify", onNotify);
      window.removeEventListener("storage", onStorage);
    };
  }, [key]);

  // ปิด dropdown เมื่อคลิกนอก
  useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const handleClear = () => {
    if (!key) return;
    localStorage.removeItem(key);
    window.dispatchEvent(new Event("mib:notify"));
  };

  return (
    <div className={styles.wrap} ref={ref}>
      <button
        className={styles.btn}
        aria-label="การแจ้งเตือนการจอง"
        onClick={() => setOpen((v) => !v)}
      >
        <span className={styles.icon}>{BELL}</span>
        {count > 0 && <span className={styles.badge}>{count}</span>}
      </button>

      {open && (
        <div className={styles.dropdown}>
          <div className={styles.dropHeader}>
            การจองล่าสุด {count ? `(${count})` : ""}
          </div>

          {count === 0 ? (
            <div className={styles.empty}>ยังไม่มีการจอง</div>
          ) : (
            <ul className={styles.list}>
              {latest.map((it) => (
                <li key={it.id} className={styles.item}>
                  <img
                    src={it.coverUrl}
                    alt={it.title}
                    onError={(e) => {
                      e.currentTarget.style.visibility = "hidden";
                    }}
                  />
                  <div className={styles.meta}>
                    <div
                      className={styles.title}
                      title={it.title}
                    >
                      {it.title}
                    </div>
                    <div className={styles.sub}>
                      จำนวน {it.qty} • ฿
                      {Number(it.price || 0).toLocaleString("th-TH")}
                    </div>
                  </div>
                  <button
                    className={styles.viewBtn}
                    onClick={() => {
                      setOpen(false);
                      nav(`/book/${it.id}`); // ไปหน้ารายละเอียดหนังสือ
                    }}
                  >
                    ดู
                  </button>
                </li>
              ))}
            </ul>
          )}

          {count > 0 && (
            <div className={styles.footer}>
              <Link
                to="/cart"
                onClick={() => setOpen(false)}
                className={styles.linkBtn}
              >
                ไปยังตะกร้า
              </Link>
              <button
                className={styles.clearBtn}
                onClick={handleClear}
              >
                ล้างรายการ
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
